/**
 * Loads the current price of every food product of Plaza Vea, Wong and Metro
 * from their public VTEX catalog API into the database (Store + StoreProduct).
 *
 * For each store it reads the category tree, walks the subcategories of the
 * chosen food departments (at most 1 request per second, identifiable
 * User-Agent) and saves what can be bought: in stock and with a price.
 * Stores are read in parallel because each one is a different website.
 *
 * Safe to re-run: every write is an upsert keyed by store + SKU, so a second
 * run overwrites the current price instead of duplicating products. A store
 * that fails (blocked, down, unexpected answer) is reported and skipped; its
 * previous prices stay as they were.
 *
 * Every store's load is recorded in ScrapeRun (start, end, ok or error,
 * products saved, error message), and the command exits with an error code
 * when any store failed, so the daily job shows up as failed.
 *
 * Usage: npm run prices:load            (all stores)
 *        npm run prices:load -- metro   (only the given store codes)
 */
import { PrismaClient } from '@prisma/client';
import { categoryPaths, type VtexCategory } from '../src/prices/categories';
import { saveStoreProducts } from '../src/prices/save-products';
import { loadStores } from '../src/prices/scrape-run';
import { PRICE_STORES, type PriceStore } from '../src/prices/stores';
import { readCategory, USER_AGENT, type ReaderDeps, type StoreProduct } from '../src/prices/vtex';

const PAUSE_MS = 1000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const deps: ReaderDeps = {
  fetch: (url, init) => fetch(url, init),
  sleep,
};

async function loadStore(prisma: PrismaClient, store: PriceStore) {
  const treeUrl = `https://${store.host}/api/catalog_system/pub/category/tree/1`;
  const response = await fetch(treeUrl, { headers: { 'User-Agent': USER_AGENT } });
  const tree: unknown = response.ok ? await response.json() : null;
  if (!Array.isArray(tree)) {
    throw new Error(`${store.code}: no se pudo leer el árbol de categorías (${response.status}) en ${treeUrl}`);
  }
  const paths = categoryPaths(tree as VtexCategory[], store.foodDepartmentIds);

  // The same SKU can appear in two categories: keep one per SKU.
  const products = new Map<string, StoreProduct>();
  for (const path of paths) {
    await sleep(PAUSE_MS);
    for (const product of await readCategory(store, path, deps)) {
      products.set(product.sourceSku, product);
    }
  }

  await saveStoreProducts(prisma, store, [...products.values()], new Date());
  return { categories: paths.length, products: products.size };
}

/** The stores named on the command line (e.g. `metro`), or all of them. */
function storesToLoad(codes: string[]): PriceStore[] {
  if (codes.length === 0) return PRICE_STORES;
  const unknown = codes.filter((code) => !PRICE_STORES.some((store) => store.code === code));
  if (unknown.length > 0) {
    const valid = PRICE_STORES.map((store) => store.code).join(', ');
    throw new Error(`Tienda desconocida: ${unknown.join(', ')}. Usa: ${valid}`);
  }
  return PRICE_STORES.filter((store) => codes.includes(store.code));
}

/**
 * Falla en segundos si la base no responde o le falta la tabla de corridas,
 * en vez de descubrirlo después de ~8 minutos leyendo las tiendas.
 */
async function checkDatabase(prisma: PrismaClient) {
  try {
    await prisma.scrapeRun.findFirst({ select: { id: true } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `No se pudo usar la base de datos: revisa DATABASE_URL y que las migraciones estén aplicadas. ${reason}`,
    );
  }
}

async function main() {
  const stores = storesToLoad(process.argv.slice(2));
  const prisma = new PrismaClient();
  try {
    await checkDatabase(prisma);
    const results = await loadStores(prisma, stores, (store) => loadStore(prisma, store));

    let failed = false;
    results.forEach((result, i) => {
      const { name } = stores[i];
      if (result.status === 'fulfilled') {
        const { categories, products } = result.value;
        console.log(`${name}: ${products} productos de ${categories} subcategorías`);
      } else {
        failed = true;
        console.error(`${name}: no se pudo cargar —`, result.reason);
      }
    });
    if (failed) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
