import { PrismaClient } from '@prisma/client';
import { recordStoreRun } from './scrape-run';

// La corrida diaria empieza a las 06:07 de Lima (11:07 UTC); la lectura de Wong toma unos 8 minutos.
const startedAt = new Date('2026-11-05T11:07:00Z');
const finishedAt = new Date('2026-11-05T11:15:00Z');

/** Base de datos simulada: solo guarda corridas. */
function fakeDb() {
  const db = { scrapeRun: { create: jest.fn().mockResolvedValue({}) } };
  return { db, client: db as unknown as Pick<PrismaClient, 'scrapeRun'> };
}

describe('recordStoreRun', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: startedAt });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('una tienda que carga bien deja su corrida como ok, con inicio, fin y cantidad de productos', async () => {
    const { db, client } = fakeDb();
    const loadWong = async () => {
      jest.setSystemTime(finishedAt);
      return { categories: 44, products: 9836 };
    };

    await recordStoreRun(client, 'wong', loadWong);

    expect(db.scrapeRun.create).toHaveBeenCalledWith({
      data: {
        storeCode: 'wong',
        startedAt,
        finishedAt,
        status: 'ok',
        products: 9836,
        error: null,
      },
    });
  });

  it('una tienda que falla deja su corrida como error con el mensaje, y el error sigue para que la carga termine fallando', async () => {
    const { db, client } = fakeDb();
    const loadWong = async () => {
      jest.setSystemTime(finishedAt);
      throw new Error('wong: la tienda respondió 503 en /api/catalog_system/pub/products/search');
    };

    await expect(recordStoreRun(client, 'wong', loadWong)).rejects.toThrow(
      'wong: la tienda respondió 503',
    );

    expect(db.scrapeRun.create).toHaveBeenCalledWith({
      data: {
        storeCode: 'wong',
        startedAt,
        finishedAt,
        status: 'error',
        products: null,
        error: 'wong: la tienda respondió 503 en /api/catalog_system/pub/products/search',
      },
    });
  });
});
