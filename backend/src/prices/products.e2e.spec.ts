import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { PricesModule } from './prices.module';

const observedAt = new Date('2026-11-04T11:00:00Z');
const createdAt = new Date('2026-11-04T11:00:05Z');

/**
 * Lo que Prisma devuelve para un producto guardado con su tienda. Datos reales
 * de la crema de leche Gloria 946ml en Wong (S/ 28.80) y Metro (S/ 26.40),
 * que comparten el EAN 7751271038683.
 */
function storeProductRow(
  store: { code: string; name: string; host: string },
  priceCents: number,
  product: { groupKey?: string; name?: string } = {},
) {
  return {
    id: `sp-${store.code}`,
    storeId: `store-${store.code}`,
    sourceSku: '8839',
    ean: '7751271038683',
    groupKey: 'g-07751271038683',
    name: 'Crema de Leche Gloria 946ml',
    brand: 'Gloria',
    url: `https://${store.host}/crema-de-leche-gloria-946ml-crema-de-leche-gloria-946ml/p`,
    priceCents,
    listPriceCents: priceCents,
    inStock: true,
    observedAt,
    createdAt,
    updatedAt: createdAt,
    store: { id: `store-${store.code}`, ...store },
    ...product,
  };
}

const plazaVea = { code: 'plazavea', name: 'Plaza Vea', host: 'www.plazavea.com.pe' };
const wong = { code: 'wong', name: 'Wong', host: 'www.wong.pe' };
const metro = { code: 'metro', name: 'Metro', host: 'www.metro.pe' };

describe('GET /products', () => {
  let app: INestApplication;
  let findMany: jest.Mock;

  beforeEach(async () => {
    findMany = jest
      .fn()
      .mockResolvedValue([storeProductRow(wong, 2880), storeProductRow(metro, 2640)]);
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, PricesModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ storeProduct: { findMany } })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('devuelve cada producto con su precio por tienda, la fecha de consulta y el enlace', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ q: 'crema de leche gloria' })
      .expect(200);

    expect(response.body).toEqual([
      {
        groupKey: 'g-07751271038683',
        name: 'Crema de Leche Gloria 946ml',
        brand: 'Gloria',
        offers: expect.arrayContaining([
          {
            store: 'wong',
            storeName: 'Wong',
            priceCents: 2880,
            observedAt: '2026-11-04T11:00:00.000Z',
            url: 'https://www.wong.pe/crema-de-leche-gloria-946ml-crema-de-leche-gloria-946ml/p',
            isBest: false,
          },
          {
            store: 'metro',
            storeName: 'Metro',
            priceCents: 2640,
            observedAt: '2026-11-04T11:00:00.000Z',
            url: 'https://www.metro.pe/crema-de-leche-gloria-946ml-crema-de-leche-gloria-946ml/p',
            isBest: true,
          },
        ]),
      },
    ]);
    expect(response.body[0].offers).toHaveLength(2);
  });

  it('busca sin tildes ni mayúsculas y exige todas las palabras: "Atún ENLATADO" busca "atun" y "enlatado"', async () => {
    await request(app.getHttpServer())
      .get('/products')
      .query({ q: '  Atún   ENLATADO ' })
      .expect(200);

    // La base compara contra el nombre guardado sin tildes y en minúsculas,
    // así que cada palabra buscada llega igual de normalizada.
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          inStock: true,
          AND: [{ searchName: { contains: 'atun' } }, { searchName: { contains: 'enlatado' } }],
        },
      }),
    );
  });

  it('devuelve como máximo 20 productos, primero los que están en más tiendas', async () => {
    // 22 productos de una sola tienda, y al final uno en 2 tiendas y otro en 3.
    const singles = Array.from({ length: 22 }, (_, i) => {
      const n = String(i + 1).padStart(2, '0');
      return storeProductRow(wong, 500, { groupKey: `s-wong-${n}`, name: `Arroz Producto ${n}` });
    });
    const inTwoStores = { groupKey: 'g-2', name: 'Arroz Faraón 1kg' };
    const inThreeStores = { groupKey: 'g-3', name: 'Arroz Costeño 5kg' };
    findMany.mockResolvedValue([
      ...singles,
      storeProductRow(wong, 520, inTwoStores),
      storeProductRow(metro, 510, inTwoStores),
      storeProductRow(plazaVea, 2290, inThreeStores),
      storeProductRow(wong, 2490, inThreeStores),
      storeProductRow(metro, 2390, inThreeStores),
    ]);

    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ q: 'arroz' })
      .expect(200);

    const names = response.body.map((product: { name: string }) => product.name);
    expect(names).toHaveLength(20);
    expect(names.slice(0, 4)).toEqual([
      'Arroz Costeño 5kg',
      'Arroz Faraón 1kg',
      'Arroz Producto 01',
      'Arroz Producto 02',
    ]);
    expect(names.at(-1)).toBe('Arroz Producto 18');
  });

  it('marca el más barato como mejor precio (los empates, todos); con una sola tienda no marca ninguno', async () => {
    // Datos reales: Metro S/ 26.40 y Wong S/ 28.80 comparten EAN. Plaza Vea
    // (S/ 25.90) no publica EAN, así que su crema de leche queda sola.
    // El empate es un caso armado: el mismo precio más bajo en dos tiendas.
    const tie = { groupKey: 'g-empate', name: 'Leche Gloria 400g' };
    findMany.mockResolvedValue([
      storeProductRow(wong, 2880),
      storeProductRow(metro, 2640),
      storeProductRow(plazaVea, 2590, {
        groupKey: 's-plazavea-3800',
        name: 'Crema de leche GLORIA Repostería Bolsa 946ml',
      }),
      storeProductRow(plazaVea, 450, tie),
      storeProductRow(wong, 420, tie),
      storeProductRow(metro, 420, tie),
    ]);

    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ q: 'crema de leche gloria' })
      .expect(200);

    const offersOf = (name: string) =>
      response.body.find((product: { name: string }) => product.name === name).offers;
    expect(offersOf('Crema de Leche Gloria 946ml')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ store: 'metro', isBest: true }),
        expect.objectContaining({ store: 'wong', isBest: false }),
      ]),
    );
    expect(offersOf('Crema de leche GLORIA Repostería Bolsa 946ml')).toEqual([
      expect.objectContaining({ store: 'plazavea', isBest: false }),
    ]);
    expect(offersOf('Leche Gloria 400g')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ store: 'wong', isBest: true }),
        expect.objectContaining({ store: 'metro', isBest: true }),
        expect.objectContaining({ store: 'plazavea', isBest: false }),
      ]),
    );
  });

  it('pone primero los productos cuyo nombre empieza con lo buscado, aunque estén en menos tiendas', async () => {
    // "Manzana" traía primero el agua con gas sabor manzana (3 tiendas) antes que la fruta.
    const agua = { groupKey: 'g-agua', name: 'Agua con Gas CIELO Sabor a Manzana Botella 600ml' };
    findMany.mockResolvedValue([
      storeProductRow(plazaVea, 250, agua),
      storeProductRow(wong, 260, agua),
      storeProductRow(metro, 260, agua),
      storeProductRow(wong, 899, { groupKey: 's-wong-manzana', name: 'Manzana Royal Gala x kg' }),
    ]);

    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ q: 'Manzana' })
      .expect(200);

    expect(response.body.map((product: { name: string }) => product.name)).toEqual([
      'Manzana Royal Gala x kg',
      'Agua con Gas CIELO Sabor a Manzana Botella 600ml',
    ]);
  });

  it('una búsqueda vacía devuelve una lista vacía sin leer la base', async () => {
    const response = await request(app.getHttpServer()).get('/products').query({ q: '   ' }).expect(200);

    expect(response.body).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('lee como máximo 1.000 filas por búsqueda, para que una palabra común no traiga toda la tabla', async () => {
    await request(app.getHttpServer()).get('/products').query({ q: 'de' }).expect(200);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 1000 }));
  });

  it('si una tienda tiene dos SKUs del mismo producto, queda solo su precio más bajo', async () => {
    findMany.mockResolvedValue([
      storeProductRow(wong, 520),
      storeProductRow(wong, 490),
      storeProductRow(metro, 500),
    ]);

    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ q: 'crema de leche gloria' })
      .expect(200);

    const [product] = response.body;
    expect(product.offers).toHaveLength(2);
    expect(product.offers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ store: 'wong', priceCents: 490, isBest: true }),
        expect.objectContaining({ store: 'metro', priceCents: 500, isBest: false }),
      ]),
    );
  });

  it('acepta ?q= repetido y busca todas las palabras, sin responder error', async () => {
    await request(app.getHttpServer()).get('/products?q=arroz&q=costeno').expect(200);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          inStock: true,
          AND: [{ searchName: { contains: 'arroz' } }, { searchName: { contains: 'costeno' } }],
        },
      }),
    );
  });

  it('sin coincidencias devuelve una lista vacía', async () => {
    findMany.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ q: 'producto que no existe' })
      .expect(200);

    expect(response.body).toEqual([]);
  });
});
