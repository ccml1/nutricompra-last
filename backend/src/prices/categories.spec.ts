import { readFileSync } from 'fs';
import { join } from 'path';
import { categoryPaths } from './categories';

// Árbol real de categorías de Wong (`/api/catalog_system/pub/category/tree/1`,
// 4 nov. 2026), recortado a Abarrotes, Limpieza y Lácteos.
const wongTree = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'wong-category-tree.json'), 'utf8'),
);

describe('categoryPaths', () => {
  it('recorre las subcategorías de los departamentos elegidos, para no pasar el tope de 2.500 productos por búsqueda', () => {
    // Abarrotes (1700) y Lácteos (1001436) sí; Limpieza (1900) no es alimento.
    expect(categoryPaths(wongTree, [1700, 1001436])).toEqual([
      '/1700/1709/',
      '/1700/1710/',
      '/1700/1711/',
      '/1700/1715/',
      '/1700/1000694/',
      '/1700/1001282/',
      '/1700/1001287/',
      '/1700/1001294/',
      '/1700/1001424/',
      '/1001436/1001437/',
      '/1001436/1001442/',
      '/1001436/1001445/',
      '/1001436/1001448/',
    ]);
  });
});
