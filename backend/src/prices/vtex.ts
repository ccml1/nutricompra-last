/**
 * Producto tal como lo devuelve la API pública de catálogo de VTEX
 * (`/api/catalog_system/pub/products/search`), solo con los campos que usamos.
 */
export interface VtexProduct {
  productName: string;
  brand: string;
  link: string;
  items: {
    itemId: string;
    ean: string;
    sellers: {
      commertialOffer: { Price: number; ListPrice: number; AvailableQuantity: number };
    }[];
  }[];
}

/** Un producto tal como se vende en una tienda, con su precio actual. */
export interface StoreProduct {
  store: string;
  sourceSku: string;
  /** null cuando la tienda no publica el código de barras (llega como ""). */
  ean: string | null;
  name: string;
  brand: string;
  /** Precio en céntimos enteros (S/ 28.80 → 2880), para no arrastrar errores de redondeo. */
  priceCents: number;
  listPriceCents: number;
  inStock: boolean;
  url: string;
}

const toCents = (soles: number) => Math.round(soles * 100);

export function toStoreProduct(store: string, product: VtexProduct): StoreProduct {
  const [item] = product.items;
  const offer = item.sellers[0].commertialOffer;

  return {
    store,
    sourceSku: item.itemId,
    ean: item.ean || null,
    name: product.productName,
    brand: product.brand,
    priceCents: toCents(offer.Price),
    listPriceCents: toCents(offer.ListPrice),
    inStock: offer.AvailableQuantity > 0,
    url: product.link,
  };
}

/** Una tienda que usa VTEX (Plaza Vea, Wong, Metro): su código en NutriCompra y su dominio. */
export interface VtexStore {
  code: string;
  host: string;
}

/** Lo que el lector necesita del exterior; los tests lo simulan. */
export interface ReaderDeps {
  fetch: (
    url: string,
    init: { headers: Record<string, string> },
  ) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
  sleep: (ms: number) => Promise<void>;
}

/** Nos identificamos ante la tienda, con un enlace para saber quién lee. */
export const USER_AGENT = 'NutriCompra/0.1 (+https://github.com/ccml1/nutricompra-last)';

/** La API de catálogo entrega como máximo 50 productos por petición. */
const PAGE_SIZE = 50;

/** Ritmo cortés: como máximo 1 petición por segundo a cada tienda. */
const PAUSE_MS = 1000;

/** Lee todos los productos comprables de una categoría (p. ej. "/1700/"), página por página. */
export async function readCategory(
  store: VtexStore,
  categoryPath: string,
  deps: ReaderDeps,
): Promise<StoreProduct[]> {
  const products: StoreProduct[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    if (from > 0) await deps.sleep(PAUSE_MS);

    const url = new URL('/api/catalog_system/pub/products/search', `https://${store.host}`);
    url.searchParams.set('fq', `C:${categoryPath}`);
    url.searchParams.set('_from', String(from));
    url.searchParams.set('_to', String(from + PAGE_SIZE - 1));

    const response = await deps.fetch(url.toString(), { headers: { 'User-Agent': USER_AGENT } });
    // Ante un error (bloqueo, caída, límite) nos detenemos en esta tienda, sin insistir.
    if (!response.ok) {
      throw new Error(`${store.code}: la tienda respondió ${response.status} en ${url}`);
    }
    const page = await response.json();
    if (!Array.isArray(page)) {
      throw new Error(
        `${store.code}: la respuesta no es una lista de productos (${response.status}) en ${url}`,
      );
    }
    products.push(...toStoreProducts(store.code, page as VtexProduct[]));
    if (page.length < PAGE_SIZE) return products;
  }
}

/** Convierte una página de la API y deja solo lo que se puede comprar: con stock y precio. */
export function toStoreProducts(store: string, products: VtexProduct[]): StoreProduct[] {
  return products
    .map((product) => toStoreProduct(store, product))
    .filter((product) => product.inStock && product.priceCents > 0);
}
