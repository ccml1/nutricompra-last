import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import {
  VISION_MODEL,
  VisionModelError,
  type VisionModel,
} from '../plate/vision-model';
import { BodyModule } from './body.module';
import { guardEstimate } from './body.service';

/** Foto mínima válida (JPEG de 1 x 1 en base64). */
const photo =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const person = { image: photo, sex: 'female', age: 34, heightCm: 160 };

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
  const moduleRef = await Test.createTestingModule({ imports: [BodyModule] })
    .overrideProvider(VISION_MODEL)
    .useValue(model)
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('POST /body/estimate-weight', () => {
  it('devuelve el peso y su rango, y el modelo recibe la foto con sexo, edad y estatura', async () => {
    const { model, received } = fakeModel(
      '```json\n{"usable": true, "reason": null, "weightKg": 61, "lowKg": 56, "highKg": 67}\n```',
    );
    const app = await appWith(model);

    const response = await request(app.getHttpServer())
      .post('/body/estimate-weight')
      .send(person)
      .expect(200);

    expect(response.body).toEqual({ weightKg: 61, lowKg: 56, highKg: 67 });
    expect(received[0].image).toBe(photo);
    expect(received[0].prompt).toContain(
      'una mujer de 34 años que mide 160 cm',
    );
    expect(received[0].prompt).toContain('hombros');
    await app.close();
  });

  it('valida la foto, el sexo, la edad (solo adultos) y la estatura', async () => {
    const app = await appWith(fakeModel('{}').model);
    const post = (body: object) =>
      request(app.getHttpServer()).post('/body/estimate-weight').send(body);

    await post({ ...person, image: 'hola' }).expect(400);
    await post({ ...person, sex: 'otro' }).expect(400);
    expect(
      (await post({ ...person, age: 16 }).expect(400)).body.message,
    ).toContain('adultos');
    await post({ ...person, heightCm: 90 }).expect(400);
    await post({ ...person, image: `${photo}${'A'.repeat(2_000_000)}` }).expect(
      413,
    );
    await app.close();
  });

  it('si la foto no sirve responde 422 con el motivo y un mensaje claro', async () => {
    const app = await appWith(
      fakeModel('{"usable": false, "reason": "multiple_people"}').model,
    );

    const response = await request(app.getHttpServer())
      .post('/body/estimate-weight')
      .send(person)
      .expect(422);

    expect(response.body.reason).toBe('multiple_people');
    expect(response.body.message).toContain('más de una persona');
    await app.close();
  });

  it('sin GROQ_API_KEY 503; si Groq pide esperar 429; si el modelo falla o no da peso 502', async () => {
    const post = (app: INestApplication) =>
      request(app.getHttpServer()).post('/body/estimate-weight').send(person);

    let app = await appWith(null);
    await post(app).expect(503);
    await app.close();

    app = await appWith({
      describe: async () => {
        throw new VisionModelError(429, 'Rate limit reached');
      },
    });
    await post(app).expect(429);
    await app.close();

    app = await appWith(
      fakeModel('{"usable": true, "weightKg": "mucho"}').model,
    );
    await post(app).expect(502);
    await app.close();
  });
});

describe('guardEstimate', () => {
  it('mantiene el peso dentro de IMC 15 a 50 para la estatura y ordena el rango a su alrededor', () => {
    // 160 cm: IMC 15 = 38.4 kg, IMC 50 = 128 kg.
    expect(
      guardEstimate(160, { weightKg: 300, lowKg: 280, highKg: 320 }),
    ).toEqual({
      weightKg: 128,
      lowKg: 120,
      highKg: 128,
    });
    expect(guardEstimate(160, { weightKg: 70, lowKg: 80, highKg: 60 })).toEqual(
      {
        weightKg: 70,
        lowKg: 60,
        highKg: 80,
      },
    );
  });

  it('ensancha un rango demasiado estrecho (mínimo ±6 %) y rechaza un peso que no es número', () => {
    expect(guardEstimate(170, { weightKg: 70, lowKg: 69, highKg: 71 })).toEqual(
      {
        weightKg: 70,
        lowKg: 65,
        highKg: 75,
      },
    );
    expect(guardEstimate(170, { weightKg: null })).toBeNull();
  });
});
