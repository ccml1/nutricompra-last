import type { StoreInfo } from './save-products';

/** Una tienda VTEX que se lee, con los departamentos de alimentos elegidos (SP-23, Q90). */
export interface PriceStore extends StoreInfo {
  /** IDs de departamento del árbol público de categorías de la tienda. */
  foodDepartmentIds: number[];
}

/**
 * Wong y Metro usan el mismo catálogo y los mismos IDs de departamento.
 * Fuera: comidas preparadas, packs, licores y secciones que repiten
 * productos de otros departamentos ("Mercado Saludable", "Vive Sano").
 */
const cencosudFood = [
  800, // Frutas y Verduras
  1700, // Abarrotes
  1001327, // Carnes, Aves y Pescados
  1001436, // Lácteos
  1400, // Embutidos y Fiambres
  1001374, // Panadería y Pastelería
  1200, // Congelados
  1001253, // Desayuno
  1800, // Aguas y Bebidas
];

export const PRICE_STORES: PriceStore[] = [
  {
    code: 'plazavea',
    name: 'Plaza Vea',
    host: 'www.plazavea.com.pe',
    foodDepartmentIds: [
      77, // Frutas y Verduras
      431, // Abarrotes
      814, // Carnes, Aves y Pescados
      845, // Lácteos y Huevos
      621, // Quesos y Fiambres
      493, // Panadería y Pastelería
      210, // Congelados
      478, // Desayunos
      2, // Bebidas
    ],
  },
  { code: 'wong', name: 'Wong', host: 'www.wong.pe', foodDepartmentIds: cencosudFood },
  { code: 'metro', name: 'Metro', host: 'www.metro.pe', foodDepartmentIds: cencosudFood },
];
