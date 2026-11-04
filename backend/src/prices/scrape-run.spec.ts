import { PrismaClient } from '@prisma/client';
import { setClock } from '../../test/clock';
import { loadStores, recordStoreRun } from './scrape-run';

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
    setClock(startedAt);
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

  it('si no se puede registrar una corrida que salió bien, no la anota como error y avisa que los precios sí se guardaron', async () => {
    const { db, client } = fakeDb();
    db.scrapeRun.create.mockRejectedValue(new Error('Can\'t reach database server'));
    const loadWong = async () => ({ categories: 44, products: 9836 });

    await expect(recordStoreRun(client, 'wong', loadWong)).rejects.toThrow(
      'wong: los precios se guardaron, pero no se pudo registrar la corrida',
    );

    // Un solo intento: la corrida no se vuelve a anotar como "error".
    expect(db.scrapeRun.create).toHaveBeenCalledTimes(1);
  });

  it('si no se puede registrar una corrida que falló, el error que sigue es el de la tienda', async () => {
    const { db, client } = fakeDb();
    db.scrapeRun.create.mockRejectedValue(new Error('Can\'t reach database server'));
    const loadMetro = async () => {
      throw new Error('metro: la tienda respondió 503');
    };
    const logError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(recordStoreRun(client, 'metro', loadMetro)).rejects.toThrow(
      'metro: la tienda respondió 503',
    );

    // El fallo al registrar queda en el log, sin tapar el de la tienda.
    expect(logError).toHaveBeenCalledWith(
      'metro: no se pudo registrar la corrida —',
      expect.any(Error),
    );
    logError.mockRestore();
  });
});

describe('loadStores', () => {
  it('carga las tiendas y registra una corrida por tienda con su código, aunque una falle', async () => {
    const { db, client } = fakeDb();
    const stores = [
      { code: 'wong', name: 'Wong' },
      { code: 'metro', name: 'Metro' },
    ];
    const loadStore = async (store: { code: string }) => {
      if (store.code === 'metro') throw new Error('metro: la tienda respondió 503');
      return { categories: 44, products: 9836 };
    };

    const results = await loadStores(client, stores, loadStore);

    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'rejected']);
    expect(db.scrapeRun.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ storeCode: 'wong', status: 'ok', products: 9836 }),
    });
    expect(db.scrapeRun.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ storeCode: 'metro', status: 'error' }),
    });
  });
});
