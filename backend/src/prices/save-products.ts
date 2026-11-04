import type { PrismaClient } from '@prisma/client';
import { groupKey } from './group-key';
import { normalizeSearchText } from './search-text';
import type { StoreProduct } from './vtex';

/** Una tienda tal como se guarda: su código, nombre visible y dominio. */
export interface StoreInfo {
  code: string;
  name: string;
  host: string;
}

/**
 * Productos que se guardan a la vez. Uno por uno, cada producto esperaba su
 * viaje a Neon y la carga tomaba ~15 minutos por tienda; en tandas pequeñas
 * se aprovechan las conexiones de Prisma sin saturar la base.
 */
const SAVE_BATCH = 20;

/**
 * Guarda la tienda y deja en la base el precio actual de cada producto:
 * lo crea si es nuevo o lo actualiza si ya existía (misma tienda y SKU).
 * Lo que la tienda ya no lista queda sin stock, para no mostrar precios viejos.
 */
export async function saveStoreProducts(
  db: Pick<PrismaClient, 'store' | 'storeProduct'>,
  store: StoreInfo,
  products: StoreProduct[],
  observedAt: Date,
): Promise<void> {
  const { id: storeId } = await db.store.upsert({
    where: { code: store.code },
    create: { code: store.code, name: store.name, host: store.host },
    update: { name: store.name, host: store.host },
  });

  const save = (product: StoreProduct) => {
    const current = {
      ean: product.ean,
      groupKey: groupKey(product),
      name: product.name,
      searchName: normalizeSearchText(product.name),
      brand: product.brand,
      url: product.url,
      priceCents: product.priceCents,
      listPriceCents: product.listPriceCents,
      inStock: product.inStock,
      observedAt,
    };
    return db.storeProduct.upsert({
      where: { storeId_sourceSku: { storeId, sourceSku: product.sourceSku } },
      create: { storeId, sourceSku: product.sourceSku, ...current },
      update: current,
    });
  };

  for (let start = 0; start < products.length; start += SAVE_BATCH) {
    await Promise.all(products.slice(start, start + SAVE_BATCH).map(save));
  }

  // Todo lo de esta lectura lleva `observedAt`; lo anterior que no se volvió a ver ya no se vende.
  await db.storeProduct.updateMany({
    where: { storeId, observedAt: { lt: observedAt } },
    data: { inStock: false },
  });
}
