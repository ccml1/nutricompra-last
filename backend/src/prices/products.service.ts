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

/** Orden alfabético en español ("Ñ" después de "N", tildes en su lugar). */
const spanish = new Intl.Collator('es');

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Productos cuyo nombre contiene todas las palabras buscadas (sin tildes ni
   * mayúsculas), juntando en uno los que comparten clave de grupo.
   */
  async search(query: string): Promise<ProductGroup[]> {
    const words = searchWords(query);
    // Sin palabras no hay nada que buscar: no se lee la tabla entera.
    if (words.length === 0) return [];

    const rows = await this.prisma.storeProduct.findMany({
      where: { inStock: true, AND: words.map((word) => ({ searchName: { contains: word } })) },
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

    // Primero lo que es el alimento buscado (el nombre empieza con el texto: "Manzana
    // Royal Gala" antes que "Agua sabor a manzana"); luego los que se pueden comparar
    // en más tiendas; a igual número, por nombre.
    const text = normalizeSearchText(query);
    const startsWithText = (group: ProductGroup) => normalizeSearchText(group.name).startsWith(text);
    return [...groups.values()]
      .sort(
        (a, b) =>
          Number(startsWithText(b)) - Number(startsWithText(a)) ||
          b.offers.length - a.offers.length ||
          spanish.compare(a.name, b.name),
      )
      .slice(0, MAX_RESULTS);
  }
}
