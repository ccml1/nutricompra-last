import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import * as request from 'supertest';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { PlateModule } from './plate.module';
import { VISION_MODEL, VisionModelError, type VisionModel } from './vision-model';

const createdAt = new Date('2026-10-30T00:00:00Z');

/** Un perfil del catálogo TPCA tal como lo devuelve Prisma (solo importa el nombre aquí). */
function profileOf(name: string) {
  return {
    id: `profile-${name}`,
    foodId: `food-${name}`,
    referenceAmount: new Prisma.Decimal('100'),
    referenceUnit: 'g',
    energyKcal: new Prisma.Decimal('100'),
    proteinG: null,
    carbohydrateG: null,
    fatG: null,
    fiberG: null,
    sodiumMg: null,
    calciumMg: null,
    ironMg: null,
    dataSourceId: 'source-tpca',
    createdAt,
    updatedAt: createdAt,
    food: { id: `food-${name}`, name, category: 'Cereales', type: 'basic', createdAt, updatedAt: createdAt },
    dataSource: { id: 'source-tpca', name: 'TPCA', version: '2023', sourceCode: 'X', sourceName: name, sourceUrl: null, notes: null, createdAt },
  };
}

/** Foto mínima válida (JPEG de 1 x 1 en base64). */
const photo =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

/** Modelo simulado: anota lo que recibe y responde el texto dado. */
function fakeModel(answer: string) {
  const received: { image: string; prompt: string }[] = [];
  const model: VisionModel = {
    async describe(image, prompt) {
      received.push({ image, prompt });
      return answer;
    },
  };
  return { model, received };
}

async function appWith(model: VisionModel | null): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [PrismaModule, PlateModule] })
    .overrideProvider(PrismaService)
    .useValue({
      nutritionalProfile: {
        findMany: jest.fn().mockResolvedValue(['Arroz blanco', 'Pollo', 'Tomate'].map(profileOf)),
      },
    })
    .overrideProvider(VISION_MODEL)
    .useValue(model)
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('POST /plate/analyze', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
  });

  it('devuelve el plato y sus alimentos con gramos, con los nombres de la TPCA cuando corresponden', async () => {
    // El modelo suele envolver el JSON en ```json y escribir los nombres a su manera.
    const answer =
      '```json\n{"dish": "Pollo con arroz", "foods": [' +
      '{"name": "arroz blanco", "grams": 180},' +
      '{"name": "Pollo", "grams": 120},' +
      '{"name": "Pan francés", "grams": 40, "per100g": {"kcal": 270, "proteinG": 9, "carbsG": 52, "fatG": 3}}' +
      ']}\n```';
    app = await appWith(fakeModel(answer).model);

    const response = await request(app.getHttpServer()).post('/plate/analyze').send({ image: photo }).expect(200);

    expect(response.body).toEqual({
      dish: 'Pollo con arroz',
      foods: [
        { name: 'Arroz blanco', grams: 180, inCatalog: true },
        { name: 'Pollo', grams: 120, inCatalog: true },
        { name: 'Pan francés', grams: 40, inCatalog: false, per100g: { kcal: 270, proteinG: 9, carbsG: 52, fatG: 3 } },
      ],
    });
  });

  it('le pasa al modelo la foto, los nombres del catálogo TPCA y el tamaño de un plato como referencia', async () => {
    const { model, received } = fakeModel('{"dish": null, "foods": []}');
    app = await appWith(model);

    await request(app.getHttpServer()).post('/plate/analyze').send({ image: photo }).expect(200);

    expect(received[0].image).toBe(photo);
    expect(received[0].prompt).toContain('Arroz blanco, Pollo, Tomate');
    expect(received[0].prompt).toContain('26 cm');
    expect(received[0].prompt).toContain('cocidos');
  });

  it('rechaza un pedido sin foto, con algo que no es una imagen o con una foto demasiado grande', async () => {
    app = await appWith(fakeModel('{}').model);
    const server = app.getHttpServer();

    await request(server).post('/plate/analyze').send({}).expect(400);
    await request(server).post('/plate/analyze').send({ image: 'data:text/plain;base64,aG9sYQ==' }).expect(400);
    await request(server)
      .post('/plate/analyze')
      .send({ image: `data:image/jpeg;base64,${'A'.repeat(2_000_001)}` })
      .expect(413);
  });

  it('sin GROQ_API_KEY responde 503; si Groq pide esperar, 429; si el modelo falla o responde algo ilegible, 502', async () => {
    const logError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    app = await appWith(null);
    expect((await request(app.getHttpServer()).post('/plate/analyze').send({ image: photo }).expect(503)).body.message).toBe(
      'El análisis de fotos no está configurado (falta GROQ_API_KEY en el backend).',
    );
    await app.close();

    app = await appWith({
      describe: async () => {
        throw new VisionModelError(429, 'Rate limit reached');
      },
    });
    expect((await request(app.getHttpServer()).post('/plate/analyze').send({ image: photo }).expect(429)).body.message).toBe(
      'Analizamos muchas fotos seguidas. Espera unos segundos e inténtalo de nuevo.',
    );
    await app.close();

    app = await appWith(fakeModel('No puedo ver la imagen.').model);
    expect((await request(app.getHttpServer()).post('/plate/analyze').send({ image: photo }).expect(502)).body.message).toBe(
      'No pudimos analizar la foto. Inténtalo de nuevo.',
    );
    logError.mockRestore();
  });

  it('acota valores absurdos: gramos entre 1 y 1.500, kcal por 100 g hasta 900 y como máximo 12 alimentos', async () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ name: `Alimento ${i}`, grams: 50 }));
    const answer = JSON.stringify({
      dish: 'Raro',
      foods: [
        { name: 'Tomate', grams: 99999 },
        { name: 'Mantequilla', grams: -5, per100g: { kcal: 5000, proteinG: 1, carbsG: 0, fatG: 81 } },
        ...many,
      ],
    });
    app = await appWith(fakeModel(answer).model);

    const response = await request(app.getHttpServer()).post('/plate/analyze').send({ image: photo }).expect(200);

    expect(response.body.foods).toHaveLength(12);
    expect(response.body.foods[0]).toEqual({ name: 'Tomate', grams: 1500, inCatalog: true });
    expect(response.body.foods[1]).toEqual({
      name: 'Mantequilla',
      grams: 1,
      inCatalog: false,
      per100g: { kcal: 900, proteinG: 1, carbsG: 0, fatG: 81 },
    });
  });
});
