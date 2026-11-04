import { readFileSync } from 'fs';
import { join } from 'path';
import { readCategory, toStoreProduct, toStoreProducts, type VtexProduct } from './vtex';

// Respuestas reales de la API pública de catálogo de VTEX (4 nov. 2026),
// recortadas a los campos que usa NutriCompra.
function fixture(name: string) {
  return JSON.parse(readFileSync(join(__dirname, 'fixtures', `${name}.json`), 'utf8'));
}

/** Copia del producto con otra oferta (precio o stock), para casos que no vimos en vivo. */
function withOffer(
  product: VtexProduct,
  offer: Partial<VtexProduct['items'][0]['sellers'][0]['commertialOffer']>,
): VtexProduct {
  const copy = structuredClone(product);
  Object.assign(copy.items[0].sellers[0].commertialOffer, offer);
  return copy;
}

describe('toStoreProduct', () => {
  it('convierte un producto VTEX en producto de tienda: nombre, marca, EAN, SKU, precio en céntimos, precio de lista, stock y enlace', () => {
    const [cremaDeLeche] = fixture('wong-crema-de-leche');

    expect(toStoreProduct('wong', cremaDeLeche)).toEqual({
      store: 'wong',
      sourceSku: '8839',
      ean: '7751271038683',
      name: 'Crema de Leche Gloria 946ml',
      brand: 'Gloria',
      priceCents: 2880,
      listPriceCents: 2880,
      inStock: true,
      url: 'https://www.wong.pe/crema-de-leche-gloria-946ml-crema-de-leche-gloria-946ml/p',
    });
  });

  it('un producto sin EAN queda con EAN null, no con texto vacío', () => {
    // Plaza Vea publica este producto con "ean": "".
    const [cremaDeLeche] = fixture('plazavea-crema-de-leche');

    expect(toStoreProduct('plazavea', cremaDeLeche).ean).toBeNull();
  });
});

describe('toStoreProducts', () => {
  it('descarta productos sin stock o con precio 0', () => {
    const [cremaDeLeche] = fixture('wong-crema-de-leche');
    const sinStock = withOffer(cremaDeLeche, { AvailableQuantity: 0 });
    const sinPrecio = withOffer(cremaDeLeche, { Price: 0 });

    const result = toStoreProducts('wong', [sinStock, cremaDeLeche, sinPrecio]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ sourceSku: '8839', priceCents: 2880, inStock: true });
  });
});

/** `count` copias del producto con SKUs distintos, para armar páginas de la API. */
function copiesOf(product: VtexProduct, count: number, firstSku: number): VtexProduct[] {
  return Array.from({ length: count }, (_, i) => {
    const copy = structuredClone(product);
    copy.items[0].itemId = String(firstSku + i);
    return copy;
  });
}

/**
 * Tienda VTEX simulada: responde cada página según `_from` y anota en `events`
 * cada petición y cada espera, en el orden en que ocurren.
 */
function fakeVtex(pages: VtexProduct[][]) {
  const urls: string[] = [];
  const events: string[] = [];
  const userAgents: (string | undefined)[] = [];
  const fetch = jest.fn(async (url: string, init?: { headers?: Record<string, string> }) => {
    urls.push(url);
    userAgents.push(init?.headers?.['User-Agent']);
    const from = Number(new URL(url).searchParams.get('_from'));
    events.push(`pide _from=${from}`);
    const page = pages[from / 50] ?? [];
    return { ok: true, status: 206, json: async () => page };
  });
  const sleep = jest.fn(async (ms: number) => {
    events.push(`espera ${ms} ms`);
  });
  return { fetch, sleep, urls, events, userAgents };
}

describe('readCategory', () => {
  const wong = { code: 'wong', host: 'www.wong.pe' };

  it('recorre todas las páginas de una categoría de 50 en 50 hasta terminar', async () => {
    const [cremaDeLeche] = fixture('wong-crema-de-leche');
    // Página llena de 50 y una última con 1: son 51 productos en total.
    const vtex = fakeVtex([copiesOf(cremaDeLeche, 50, 1), copiesOf(cremaDeLeche, 1, 51)]);

    const products = await readCategory(wong, '/1700/', vtex);

    expect(products).toHaveLength(51);
    expect(vtex.urls).toHaveLength(2);
    const [first, second] = vtex.urls.map((url) => new URL(url));
    expect(first.origin).toBe('https://www.wong.pe');
    expect(first.pathname).toBe('/api/catalog_system/pub/products/search');
    expect(first.searchParams.get('fq')).toBe('C:/1700/');
    expect([first.searchParams.get('_from'), first.searchParams.get('_to')]).toEqual(['0', '49']);
    expect([second.searchParams.get('_from'), second.searchParams.get('_to')]).toEqual(['50', '99']);
  });

  it('espera 1 segundo entre peticiones a la misma tienda', async () => {
    const [cremaDeLeche] = fixture('wong-crema-de-leche');
    const vtex = fakeVtex([
      copiesOf(cremaDeLeche, 50, 1),
      copiesOf(cremaDeLeche, 50, 51),
      copiesOf(cremaDeLeche, 1, 101),
    ]);

    await readCategory(wong, '/1700/', vtex);

    expect(vtex.events).toEqual([
      'pide _from=0',
      'espera 1000 ms',
      'pide _from=50',
      'espera 1000 ms',
      'pide _from=100',
    ]);
  });

  it('envía un User-Agent identificable de NutriCompra, con enlace al repositorio', async () => {
    const [cremaDeLeche] = fixture('wong-crema-de-leche');
    const vtex = fakeVtex([copiesOf(cremaDeLeche, 50, 1), copiesOf(cremaDeLeche, 1, 51)]);

    await readCategory(wong, '/1700/', vtex);

    expect(vtex.userAgents).toHaveLength(2);
    for (const userAgent of vtex.userAgents) {
      expect(userAgent).toContain('NutriCompra');
      expect(userAgent).toContain('https://github.com/ccml1/nutricompra-last');
    }
  });
});
