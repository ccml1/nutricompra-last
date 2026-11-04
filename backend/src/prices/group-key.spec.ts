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

  it('los códigos internos (prefijos 02 y 20–29) no agrupan entre cadenas distintas, y los inválidos no agrupan', () => {
    // GS1 reserva esos prefijos para uso interno: cada cadena los asigna a lo suyo
    // (p. ej. frescos vendidos por peso), así que el mismo número no es el mismo producto.
    const tomatePlazaVea = { store: 'plazavea', sourceSku: '111', ean: '2000123000000' };
    const otroWong = { store: 'wong', sourceSku: '222', ean: '2000123000000' };
    const codigo02Metro = { store: 'metro', sourceSku: '333', ean: '0212345678905' };
    const codigo02PlazaVea = { store: 'plazavea', sourceSku: '555', ean: '0212345678905' };

    expect(groupKey(tomatePlazaVea)).not.toBe(groupKey(otroWong));
    expect(groupKey(codigo02Metro)).not.toBe(groupKey(codigo02PlazaVea));
    expect(groupKey({ store: 'metro', sourceSku: '444', ean: '123' })).toBe('s-metro-444');
  });

  it('un código interno sí agrupa dentro de la misma cadena: Wong y Metro (Cencosud) comparten catálogo', () => {
    // Dato real: "Queso Maduro Gouda Pimienta Gestam x Kg" usa 2566500000004 en Wong y en Metro.
    const goudaWong = { store: 'wong', sourceSku: '1', ean: '2566500000004' };
    const goudaMetro = { store: 'metro', sourceSku: '2', ean: '2566500000004' };
    const mismoCodigoPlazaVea = { store: 'plazavea', sourceSku: '3', ean: '2566500000004' };

    expect(groupKey(goudaWong)).toBe(groupKey(goudaMetro));
    expect(groupKey(mismoCodigoPlazaVea)).not.toBe(groupKey(goudaWong));
  });
});
