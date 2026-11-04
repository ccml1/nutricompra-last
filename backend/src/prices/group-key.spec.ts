import { readFileSync } from 'fs';
import { join } from 'path';
import { groupKey } from './group-key';
import { toStoreProduct } from './vtex';

// Respuestas reales de la API de catálogo de cada tienda (4 nov. 2026).
function storeProduct(store: string, fixtureName: string) {
  const [product] = JSON.parse(
    readFileSync(join(__dirname, 'fixtures', `${fixtureName}.json`), 'utf8'),
  );
  return toStoreProduct(store, product);
}

describe('groupKey', () => {
  it('agrupa por GTIN (EAN completado a 14 dígitos) productos de tiendas distintas', () => {
    // Wong y Metro venden la misma crema de leche con EAN 7751271038683 (13 dígitos).
    const wong = storeProduct('wong', 'wong-crema-de-leche');
    const metro = storeProduct('metro', 'metro-crema-de-leche');

    expect(groupKey(wong)).toBe('g-07751271038683');
    expect(groupKey(metro)).toBe('g-07751271038683');
  });

  it('un producto sin EAN no se agrupa con otros: queda solo', () => {
    // Plaza Vea vende la misma crema de leche, pero sin EAN.
    const plazaVea = storeProduct('plazavea', 'plazavea-crema-de-leche');
    // Otro producto sin EAN, con el mismo nombre pero otro SKU.
    const otroSinEan = { ...plazaVea, sourceSku: '9999' };
    const wong = storeProduct('wong', 'wong-crema-de-leche');

    const keys = [groupKey(plazaVea), groupKey(otroSinEan), groupKey(wong)];

    expect(new Set(keys).size).toBe(3);
  });
});
