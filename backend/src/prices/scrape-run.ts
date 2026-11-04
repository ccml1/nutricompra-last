import type { PrismaClient } from '@prisma/client';

type RunOutcome = { status: 'ok' | 'error'; products: number | null; error: string | null };

/**
 * Lee y guarda una tienda con `load`, y deja registrada la corrida: inicio,
 * fin, resultado, cantidad de productos y el mensaje si falló. Un fallo de la
 * tienda se registra y se vuelve a lanzar, para que la carga termine con error.
 */
export async function recordStoreRun<T extends { products: number }>(
  db: Pick<PrismaClient, 'scrapeRun'>,
  storeCode: string,
  load: () => Promise<T>,
): Promise<T> {
  const startedAt = new Date();
  const save = (outcome: RunOutcome) =>
    db.scrapeRun.create({ data: { storeCode, startedAt, finishedAt: new Date(), ...outcome } });

  let result: T;
  try {
    result = await load();
  } catch (error) {
    // Si tampoco se puede registrar, el error que importa sigue siendo el de la tienda.
    await save({ status: 'error', products: null, error: messageOf(error) }).catch((saveError) =>
      console.error(`${storeCode}: no se pudo registrar la corrida —`, saveError),
    );
    throw error;
  }

  try {
    await save({ status: 'ok', products: result.products, error: null });
  } catch (saveError) {
    throw new Error(
      `${storeCode}: los precios se guardaron, pero no se pudo registrar la corrida — ${messageOf(saveError)}`,
    );
  }
  return result;
}

/**
 * Carga las tiendas en paralelo (cada una es otro sitio web) y registra una
 * corrida por tienda con su código. Una tienda que falla no detiene a las demás.
 */
export function loadStores<S extends { code: string }, T extends { products: number }>(
  db: Pick<PrismaClient, 'scrapeRun'>,
  stores: S[],
  loadStore: (store: S) => Promise<T>,
): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(
    stores.map((store) => recordStoreRun(db, store.code, () => loadStore(store))),
  );
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));
