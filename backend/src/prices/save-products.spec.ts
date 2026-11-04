import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { saveStoreProducts } from './save-products';
import { toStoreProduct } from './vtex';

const observedAt = new Date('2026-11-04T11:00:00Z');
const wong = { code: 'wong', name: 'Wong', host: 'www.wong.pe' };

/** Base de datos simulada: la tienda ya guardada tiene el id "store-wong". */
function fakeDb() {
  const db = {
    store: { upsert: jest.fn().mockResolvedValue({ id: 'store-wong' }) },
    storeProduct: {
      upsert: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
  return { db, client: db as unknown as Pick<PrismaClient, 'store' | 'storeProduct'> };
}

describe('saveStoreProducts', () => {
  it('crea o actualiza cada producto por tienda + SKU con su precio actual y su fecha de consulta', async () => {
    // Crema de leche real de Wong (4 nov. 2026): S/ 28.80, EAN 7751271038683, SKU 8839.
    const [raw] = JSON.parse(
      readFileSync(join(__dirname, 'fixtures', 'wong-crema-de-leche.json'), 'utf8'),
    );
    const { db, client } = fakeDb();

    await saveStoreProducts(client, wong, [toStoreProduct('wong', raw)], observedAt);

    expect(db.store.upsert).toHaveBeenCalledWith({
      where: { code: 'wong' },
      create: { code: 'wong', name: 'Wong', host: 'www.wong.pe' },
      update: { name: 'Wong', host: 'www.wong.pe' },
    });
    const current = {
      ean: '7751271038683',
      groupKey: 'g-07751271038683',
      name: 'Crema de Leche Gloria 946ml',
      searchName: 'crema de leche gloria 946ml',
      brand: 'Gloria',
      url: 'https://www.wong.pe/crema-de-leche-gloria-946ml-crema-de-leche-gloria-946ml/p',
      priceCents: 2880,
      listPriceCents: 2880,
      inStock: true,
      observedAt,
    };
    expect(db.storeProduct.upsert).toHaveBeenCalledTimes(1);
    expect(db.storeProduct.upsert).toHaveBeenCalledWith({
      where: { storeId_sourceSku: { storeId: 'store-wong', sourceSku: '8839' } },
      create: { storeId: 'store-wong', sourceSku: '8839', ...current },
      update: current,
    });
  });

  it('marca sin stock los productos de la tienda cuyo SKU no apareció en esta lectura', async () => {
    // Si la tienda dejó de listarlo (agotado o retirado), su precio viejo no debe seguir vigente.
    // Se decide por SKU y no por hora, para que dos cargas de la misma tienda a la vez
    // no dejen sin stock lo que la otra acaba de guardar.
    const [raw] = JSON.parse(
      readFileSync(join(__dirname, 'fixtures', 'wong-crema-de-leche.json'), 'utf8'),
    );
    const { db, client } = fakeDb();

    await saveStoreProducts(client, wong, [toStoreProduct('wong', raw)], observedAt);

    expect(db.storeProduct.updateMany).toHaveBeenCalledWith({
      where: { storeId: 'store-wong', sourceSku: { notIn: ['8839'] } },
      data: { inStock: false },
    });
  });
});
