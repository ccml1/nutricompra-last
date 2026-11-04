/** Un nodo del árbol de categorías público de VTEX (`/api/catalog_system/pub/category/tree/1`). */
export interface VtexCategory {
  id: number;
  name: string;
  children: VtexCategory[];
}

/**
 * Rutas de categoría a leer ("/1700/1709/"): las subcategorías de los
 * departamentos elegidos. Se lee por subcategoría porque la búsqueda de
 * VTEX entrega como máximo 2.500 productos y un departamento entero
 * (p. ej. Abarrotes) puede tener más.
 */
export function categoryPaths(tree: VtexCategory[], departmentIds: number[]): string[] {
  return tree
    .filter((department) => departmentIds.includes(department.id))
    .flatMap((department) =>
      department.children.map((category) => `/${department.id}/${category.id}/`),
    );
}
