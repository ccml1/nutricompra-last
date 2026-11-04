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
 * Guarda la tienda y deja en la base el precio actual de cada producto:
 * lo crea si es nuevo o lo actualiza si ya existía (misma tienda y SKU).
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

  for (const product of products) {
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

    await db.storeProduct.upsert({
      where: { storeId_sourceSku: { storeId, sourceSku: product.sourceSku } },
      create: { storeId, sourceSku: product.sourceSku, ...current },
      update: current,
    });
  }
}
