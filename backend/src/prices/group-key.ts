import type { StoreProduct } from './vtex';

/**
 * Clave que reúne el mismo producto en distintas tiendas:
 * "g-" + el código de barras completado a 14 dígitos (GTIN-14).
 * Sin código de barras no hay forma segura de reconocerlo en otra tienda,
 * así que el producto queda solo, con una clave propia de su tienda y SKU.
 */
export function groupKey(product: Pick<StoreProduct, 'ean' | 'store' | 'sourceSku'>): string {
  if (product.ean) return `g-${product.ean.padStart(14, '0')}`;
  return `s-${product.store}-${product.sourceSku}`;
}
