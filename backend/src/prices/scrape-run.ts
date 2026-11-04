import type { PrismaClient } from '@prisma/client';

/**
 * Lee y guarda una tienda con `load`, y deja registrada la corrida: inicio,
 * fin, resultado, cantidad de productos y el mensaje si falló. Un fallo se
 * registra y se vuelve a lanzar, para que la carga termine con error.
 */
export async function recordStoreRun<T extends { products: number }>(
  db: Pick<PrismaClient, 'scrapeRun'>,
  storeCode: string,
  load: () => Promise<T>,
): Promise<T> {
  const startedAt = new Date();
  const save = (outcome: { status: 'ok' | 'error'; products: number | null; error: string | null }) =>
    db.scrapeRun.create({ data: { storeCode, startedAt, finishedAt: new Date(), ...outcome } });

  try {
    const result = await load();
    await save({ status: 'ok', products: result.products, error: null });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await save({ status: 'error', products: null, error: message });
    throw error;
  }
}
