import { matchFoods } from './match-foods';

// Nombres reales del catálogo TPCA.
const foods = [
  { name: 'Arroz blanco' },
  { name: 'Arroz integral' },
  { name: 'Atún en conserva en aceite' },
  { name: 'Papa amarilla' },
  { name: 'Quinua' },
  { name: 'Leche evaporada entera' },
];

describe('matchFoods', () => {
  it('encuentra los alimentos del catálogo que nombra la pregunta, sin importar tildes ni mayúsculas', () => {
    const found = matchFoods('¿Cuánta proteína tiene la QUINUA y el atun?', foods);

    expect(found.map((food) => food.name)).toEqual(['Quinua', 'Atún en conserva en aceite']);
  });

  it('prefiere el nombre más completo cuando varios empiezan igual ("arroz integral" antes que "arroz blanco")', () => {
    const found = matchFoods('¿Es mejor el arroz integral?', foods);

    expect(found.map((food) => food.name)).toEqual(['Arroz integral', 'Arroz blanco']);
  });

  it('no se activa con palabras cortas ni con texto sin alimentos, y devuelve como máximo 5', () => {
    expect(matchFoods('hola, ¿me ayudas con la cena de hoy?', foods)).toEqual([]);
    expect(
      matchFoods(
        'arroz atun papa quinua leche',
        [...foods, { name: 'Arroz con leche' }, { name: 'Papa blanca' }],
      ),
    ).toHaveLength(5);
  });
});
