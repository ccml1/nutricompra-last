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
 * Usage: npm run prices:load
 */
import { PrismaClient } from '@prisma/client';
import { categoryPaths, type VtexCategory } from '../src/prices/categories';
import { saveStoreProducts } from '../src/prices/save-products';
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
  const tree = (await (await fetch(treeUrl, { headers: { 'User-Agent': USER_AGENT } })).json()) as VtexCategory[];
  const paths = categoryPaths(tree, store.foodDepartmentIds);

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

async function main() {
  const prisma = new PrismaClient();
  try {
    const results = await Promise.allSettled(
      PRICE_STORES.map((store) => loadStore(prisma, store)),
    );

    let failed = false;
    results.forEach((result, i) => {
      const { name } = PRICE_STORES[i];
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
