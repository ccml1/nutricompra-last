import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeSearchText, searchWords } from './search-text';

/** El precio de un producto en una tienda, con la fecha de consulta y su ficha. */
export interface Offer {
  store: string;
  storeName: string;
  priceCents: number;
  observedAt: Date;
  url: string;
  /** "Mejor precio": el más barato del grupo (todos si empatan); nunca con una sola tienda. */
  isBest: boolean;
  /** Precio por kg o por litro en céntimos (S/ 30.44 → 3044); null si no se sabe el tamaño. */
  unitPriceCents: number | null;
  /** "kg" o "L"; null junto con `unitPriceCents`. */
  unitPriceBasis: 'kg' | 'L' | null;
}

/** Como `a - b`, pero Infinity contra Infinity es empate (y no NaN). */
const compareNumbers = (a: number, b: number) => (a === b ? 0 : a - b);

/** Precio por kg (tamaño en g) o por litro (en ml), redondeado al céntimo. */
function unitPrice(priceCents: number, sizeQuantity: number | null, sizeUnit: string | null) {
  if (!sizeQuantity || (sizeUnit !== 'g' && sizeUnit !== 'ml')) {
    return { unitPriceCents: null, unitPriceBasis: null };
  }
  return {
    unitPriceCents: Math.round((priceCents * 1000) / sizeQuantity),
    unitPriceBasis: sizeUnit === 'g' ? ('kg' as const) : ('L' as const),
  };
}

/** Un producto con su precio en cada tienda que lo vende. */
export interface ProductGroup {
  groupKey: string;
  name: string;
  brand: string | null;
  offers: Offer[];
}

/** Pocos resultados para no obligar a hacer mucho scroll en el celular. */
const MAX_RESULTS = 20;

/** Filas que se leen como máximo por búsqueda, antes de agrupar y ordenar. */
const MAX_ROWS = 1000;

/** Un precio de más de 4 días ya no se muestra: esa tienda no se pudo leer en ese tiempo. */
const MAX_PRICE_AGE_MS = 96 * 60 * 60 * 1000;

/** Orden alfabético en español ("Ñ" después de "N", tildes en su lugar). */
const spanish = new Intl.Collator('es');

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Productos cuyo nombre contiene todas las palabras buscadas (sin tildes ni
   * mayúsculas), juntando en uno los que comparten clave de grupo.
   */
  async search(query: string, sort?: string): Promise<ProductGroup[]> {
    const words = searchWords(query);
    // Sin palabras no hay nada que buscar: no se lee la tabla entera.
    if (words.length === 0) return [];

    const rows = await this.prisma.storeProduct.findMany({
      where: {
        inStock: true,
        observedAt: { gte: new Date(Date.now() - MAX_PRICE_AGE_MS) },
        AND: words.map((word) => ({ searchName: { contains: word } })),
      },
      include: { store: true },
      // Tope para palabras comunes ("de"): de sobra para elegir los 20 que se muestran.
      take: MAX_ROWS,
    });

    const groups = new Map<string, ProductGroup>();
    for (const row of rows) {
      const group = groups.get(row.groupKey) ?? {
        groupKey: row.groupKey,
        name: row.name,
        brand: row.brand,
        offers: [],
      };
      const offer: Offer = {
        store: row.store.code,
        storeName: row.store.name,
        priceCents: row.priceCents,
        observedAt: row.observedAt,
        url: row.url,
        isBest: false,
        ...unitPrice(row.priceCents, row.sizeQuantity, row.sizeUnit),
      };
      // Una tienda con dos SKUs del mismo producto: queda su precio más bajo.
      const sameStore = group.offers.findIndex((existing) => existing.store === offer.store);
      if (sameStore === -1) group.offers.push(offer);
      else if (offer.priceCents < group.offers[sameStore].priceCents) group.offers[sameStore] = offer;
      groups.set(row.groupKey, group);
    }

    for (const { offers } of groups.values()) {
      if (offers.length < 2) continue;
      const lowest = Math.min(...offers.map((offer) => offer.priceCents));
      for (const offer of offers) offer.isBest = offer.priceCents === lowest;
    }

    // Relevancia: los combos al final; primero lo que es el alimento buscado (el nombre
    // empieza con el texto: "Manzana Royal Gala" antes que "Agua sabor a manzana");
    // luego los que se pueden comparar en más tiendas; a igual número, por nombre.
    const text = normalizeSearchText(query);
    const startsWithText = (group: ProductGroup) => normalizeSearchText(group.name).startsWith(text);
    // Un combo ("Keke + Gaseosa 1.5L") no es el alimento buscado: va al final por relevancia.
    const isCombo = (group: ProductGroup) => group.name.includes('+');
    const relevance = (a: ProductGroup, b: ProductGroup) =>
      Number(isCombo(a)) - Number(isCombo(b)) ||
      Number(startsWithText(b)) - Number(startsWithText(a)) ||
      b.offers.length - a.offers.length ||
      spanish.compare(a.name, b.name);
    // Cada producto se ordena por su precio más bajo entre las tiendas.
    const lowest = (group: ProductGroup) => Math.min(...group.offers.map((offer) => offer.priceCents));
    // El precio por kg o L más bajo entre las tiendas; sin tamaño cuenta como el más caro.
    const lowestUnit = (group: ProductGroup) =>
      Math.min(...group.offers.map((offer) => offer.unitPriceCents ?? Infinity));
    const byName = (a: ProductGroup, b: ProductGroup) => spanish.compare(a.name, b.name);
    const sorts = new Map<string, (a: ProductGroup, b: ProductGroup) => number>([
      ['price-asc', (a, b) => lowest(a) - lowest(b) || byName(a, b)],
      ['price-desc', (a, b) => lowest(b) - lowest(a) || byName(a, b)],
      ['unit-price', (a, b) => compareNumbers(lowestUnit(a), lowestUnit(b)) || byName(a, b)],
    ]);

    // Se ordenan todas las coincidencias y recién después se toman las 20 primeras.
    return [...groups.values()].sort(sorts.get(sort ?? '') ?? relevance).slice(0, MAX_RESULTS);
  }
}
