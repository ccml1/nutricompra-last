import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { searchWords } from './search-text';

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
    const rows = await this.prisma.storeProduct.findMany({
      where: { AND: searchWords(query).map((word) => ({ searchName: { contains: word } })) },
      include: { store: true },
    });

    const groups = new Map<string, ProductGroup>();
    for (const row of rows) {
      const group = groups.get(row.groupKey) ?? {
        groupKey: row.groupKey,
        name: row.name,
        brand: row.brand,
        offers: [],
      };
      group.offers.push({
        store: row.store.code,
        storeName: row.store.name,
        priceCents: row.priceCents,
        observedAt: row.observedAt,
        url: row.url,
        isBest: false,
      });
      groups.set(row.groupKey, group);
    }

    for (const { offers } of groups.values()) {
      if (offers.length < 2) continue;
      const lowest = Math.min(...offers.map((offer) => offer.priceCents));
      for (const offer of offers) offer.isBest = offer.priceCents === lowest;
    }

    // Primero los que se pueden comparar en más tiendas; a igual número, por nombre.
    return [...groups.values()]
      .sort((a, b) => b.offers.length - a.offers.length || spanish.compare(a.name, b.name))
      .slice(0, MAX_RESULTS);
  }
}
