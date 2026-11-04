import type { StoreProduct } from './vtex';

/**
 * Cadena a la que pertenece cada tienda. Wong y Metro son de Cencosud y
 * comparten catálogo, así que sus códigos internos también son los mismos.
 * Una tienda que no aparece aquí es su propia cadena.
 */
const chainOf: Record<string, string> = { wong: 'cencosud', metro: 'cencosud' };

type Barcode = { kind: 'global' | 'in-store'; gtin14: string };

/**
 * Clasifica el código de barras: GTIN global (8 a 14 dígitos), o interno si
 * cae en los rangos que GS1 reserva para uso propio de cada cadena (02 y
 * 20–29 en GTIN-13, p. ej. frescos vendidos por peso). Otro valor no sirve.
 */
function barcode(ean: string | null): Barcode | null {
  if (!ean || !/^\d{8,14}$/.test(ean)) return null;
  const gtin14 = ean.padStart(14, '0');
  const gtin13 = gtin14.slice(1);
  const inStore = gtin13.startsWith('2') || gtin13.startsWith('02');
  return { kind: inStore ? 'in-store' : 'global', gtin14 };
}

/**
 * Clave que reúne el mismo producto en distintas tiendas:
 * - código global: "g-" + GTIN-14, en cualquier tienda;
 * - código interno: "i-<cadena>-" + GTIN-14, solo dentro de la misma cadena;
 * - sin código útil: el producto queda solo, con la clave de su tienda y SKU.
 */
export function groupKey(product: Pick<StoreProduct, 'ean' | 'store' | 'sourceSku'>): string {
  const code = barcode(product.ean);
  if (code?.kind === 'global') return `g-${code.gtin14}`;
  if (code?.kind === 'in-store') return `i-${chainOf[product.store] ?? product.store}-${code.gtin14}`;
  return `s-${product.store}-${product.sourceSku}`;
}
