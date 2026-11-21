import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import * as request from 'supertest';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { ChatModule } from './chat.module';
import { CHAT_MODEL, type ChatModel, type ModelMessage } from './chat-model';

const createdAt = new Date('2026-10-30T00:00:00Z');

/** "Quinua" del catálogo TPCA tal como la devuelve Prisma (por 100 g). */
const quinuaProfile = {
  id: 'profile-quinua',
  foodId: 'food-quinua',
  referenceAmount: new Prisma.Decimal('100'),
  referenceUnit: 'g',
  energyKcal: new Prisma.Decimal('343'),
  proteinG: new Prisma.Decimal('13.6'),
  carbohydrateG: new Prisma.Decimal('64.2'),
  fatG: new Prisma.Decimal('5.8'),
  fiberG: new Prisma.Decimal('7'),
  sodiumMg: null,
  calciumMg: new Prisma.Decimal('56'),
  ironMg: new Prisma.Decimal('7.5'),
  dataSourceId: 'source-tpca',
  createdAt,
  updatedAt: createdAt,
  food: { id: 'food-quinua', name: 'Quinua', category: 'Cereales', type: 'basic', createdAt, updatedAt: createdAt },
  dataSource: {
    id: 'source-tpca',
    name: 'TPCA',
    version: '2023',
    sourceCode: 'A40',
    sourceName: 'Quinua',
    sourceUrl: null,
    notes: null,
    createdAt,
  },
};

/** Lo que la pantalla manda del hogar: su menú, su lista y su presupuesto. */
const context = {
  weeklyBudget: 180,
  menu: [
    {
      day: 'Jueves',
      meals: [
        { type: 'Desayuno', name: 'Avena con plátano', kcal: 320 },
        { type: 'Almuerzo', name: 'Lomo saltado', kcal: 780 },
        { type: 'Cena', name: 'Sopa de quinua', kcal: 410 },
      ],
      kcal: 1510,
      proteinG: 62,
      carbsG: 190,
      fatG: 48,
    },
  ],
  shoppingList: [{ name: 'Quinua', quantity: '500 g' }],
  shoppingTotal: 152.4,
};

/** Modelo simulado: anota lo que recibe y responde por partes. */
function fakeModel(chunks: string[] = ['Hola, ', '¿en qué ', 'te ayudo?']) {
  const received: ModelMessage[][] = [];
  const model: ChatModel = {
    async *stream(messages) {
      received.push(messages);
      for (const chunk of chunks) yield chunk;
    },
  };
  return { model, received };
}

async function appWith(model: ChatModel | null): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [PrismaModule, ChatModule] })
    .overrideProvider(PrismaService)
    .useValue({ nutritionalProfile: { findMany: jest.fn().mockResolvedValue([quinuaProfile]) } })
    .overrideProvider(CHAT_MODEL)
    .useValue(model)
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

const ask = (content: string) => ({ messages: [{ role: 'user', content }], context });

describe('POST /chat', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
  });

  it('responde con el texto del modelo a medida que llega', async () => {
    app = await appWith(fakeModel().model);

    const response = await request(app.getHttpServer()).post('/chat').send(ask('Hola')).expect(200);

    expect(response.headers['content-type']).toMatch(/^text\/plain/);
    expect(response.text).toBe('Hola, ¿en qué te ayudo?');
  });

  it('le da al modelo las reglas, el menú, la lista, el presupuesto y los nutrientes TPCA de los alimentos que se nombran', async () => {
    const { model, received } = fakeModel();
    app = await appWith(model);

    await request(app.getHttpServer())
      .post('/chat')
      .send({
        messages: [
          { role: 'user', content: 'Hola' },
          { role: 'assistant', content: 'Hola, ¿en qué te ayudo?' },
          { role: 'user', content: '¿Cuánta proteína tiene la quinua?' },
        ],
        context,
      })
      .expect(200);

    const [system, ...conversation] = received[0];
    expect(system.role).toBe('system');
    expect(system.content).toContain('NutriCompra');
    expect(system.content).toContain('No des diagnósticos');
    expect(system.content).toContain('Jueves: Desayuno Avena con plátano (320 kcal)');
    // El reparto de calorías ya va calculado (62 g × 4 kcal = 248 de 1510 → 16 %): el modelo no hace cuentas.
    expect(system.content).toContain(
      'Total del día por persona: 1510 kcal; proteína 62 g (16 % de las kcal), carbohidratos 190 g (50 %), grasa 48 g (29 %).',
    );
    expect(system.content).toContain('Quinua (500 g)');
    expect(system.content).toContain('S/ 180.00');
    expect(system.content).toContain('Quinua: 343 kcal, 13.6 g de proteína');
    expect(conversation.map((message) => message.role)).toEqual(['user', 'assistant', 'user']);
    expect(conversation.at(-1)?.content).toBe('¿Cuánta proteína tiene la quinua?');
  });

  it('rechaza una conversación vacía, un mensaje demasiado largo o una que no termina con la pregunta del usuario', async () => {
    app = await appWith(fakeModel().model);
    const server = app.getHttpServer();

    await request(server).post('/chat').send({ messages: [] }).expect(400);
    await request(server).post('/chat').send(ask('a'.repeat(1001))).expect(400);
    await request(server)
      .post('/chat')
      .send({ messages: [{ role: 'assistant', content: 'Hola' }] })
      .expect(400);
  });

  it('sin GROQ_API_KEY ni HF_TOKEN responde 503 con un mensaje claro', async () => {
    app = await appWith(null);

    const response = await request(app.getHttpServer()).post('/chat').send(ask('Hola')).expect(503);

    expect(response.body.message).toBe('El chat no está configurado (falta GROQ_API_KEY o HF_TOKEN en el backend).');
  });

  it('si el modelo falla antes de responder, 502 con un mensaje claro', async () => {
    const failing: ChatModel = {
      // eslint-disable-next-line require-yield
      async *stream() {
        throw new Error('Provider returned 401');
      },
    };
    app = await appWith(failing);
    const logError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await request(app.getHttpServer()).post('/chat').send(ask('Hola')).expect(502);

    expect(response.body.message).toBe('El modelo no pudo responder. Intenta de nuevo en un momento.');
    expect(logError).toHaveBeenCalled();
    logError.mockRestore();
  });

  it('limita a 20 preguntas cada 10 minutos por persona, para no gastar los créditos', async () => {
    app = await appWith(fakeModel().model);
    const server = app.getHttpServer();

    for (let i = 0; i < 20; i++) await request(server).post('/chat').send(ask('Hola')).expect(200);
    const response = await request(server).post('/chat').send(ask('Hola')).expect(429);

    expect(response.body.message).toBe('Hiciste muchas preguntas seguidas. Espera unos minutos.');
  });
});
