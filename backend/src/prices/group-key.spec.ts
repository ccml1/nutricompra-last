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

  it('los códigos internos de cada tienda (prefijos 02 y 20–29) o inválidos no agrupan productos de tiendas distintas', () => {
    // GS1 reserva esos prefijos para uso interno: cada cadena los asigna a lo suyo
    // (p. ej. frescos vendidos por peso), así que el mismo número no es el mismo producto.
    const tomatePlazaVea = { store: 'plazavea', sourceSku: '111', ean: '2000123000000' };
    const otroWong = { store: 'wong', sourceSku: '222', ean: '2000123000000' };

    expect(groupKey(tomatePlazaVea)).not.toBe(groupKey(otroWong));
    expect(groupKey({ store: 'metro', sourceSku: '333', ean: '0212345678905' })).toBe('s-metro-333');
    expect(groupKey({ store: 'metro', sourceSku: '444', ean: '123' })).toBe('s-metro-444');
  });
});
