import type { StoreProduct } from './vtex';

/**
 * Un código de barras sirve para reconocer el mismo producto en otra tienda
 * solo si es un GTIN global: 8 a 14 dígitos y fuera de los rangos que GS1
 * reserva para uso interno (02 y 20–29 en GTIN-13), que cada cadena asigna a
 * lo suyo, por ejemplo a los frescos vendidos por peso.
 */
function globalGtin14(ean: string | null): string | null {
  if (!ean || !/^\d{8,14}$/.test(ean)) return null;
  const gtin13 = ean.padStart(14, '0').slice(1);
  if (gtin13.startsWith('2') || gtin13.startsWith('02')) return null;
  return ean.padStart(14, '0');
}

/**
 * Clave que reúne el mismo producto en distintas tiendas:
 * "g-" + el código de barras completado a 14 dígitos (GTIN-14).
 * Sin un código global no hay forma segura de reconocerlo en otra tienda,
 * así que el producto queda solo, con una clave propia de su tienda y SKU.
 */
export function groupKey(product: Pick<StoreProduct, 'ean' | 'store' | 'sourceSku'>): string {
  const gtin = globalGtin14(product.ean);
  if (gtin) return `g-${gtin}`;
  return `s-${product.store}-${product.sourceSku}`;
}
