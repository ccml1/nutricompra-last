/** Tamaño de lo que se vende, en gramos o mililitros enteros (946 ml, 5.000 g). */
export interface Size {
  quantity: number;
  unit: 'g' | 'ml';
}

/** Cómo escriben las tiendas cada unidad, y cuántos g o ml es una. */
const UNITS: Record<string, { unit: Size['unit']; factor: number }> = {
  kg: { unit: 'g', factor: 1000 },
  g: { unit: 'g', factor: 1 },
  gr: { unit: 'g', factor: 1 },
  grs: { unit: 'g', factor: 1 },
  ml: { unit: 'ml', factor: 1 },
  cc: { unit: 'ml', factor: 1 },
  l: { unit: 'ml', factor: 1000 },
  lt: { unit: 'ml', factor: 1000 },
  lts: { unit: 'ml', factor: 1000 },
};

/** Un número (con punto o coma decimal) seguido de su unidad: "946ml", "1 L", "1.18 lt", "100Gr". */
const SIZE = /(\d+(?:[.,]\d+)?)\s*(kg|grs|gr|g|ml|cc|lts|lt|l)\b/gi;

const UNITS_WORD = '(?:un|und|unid|unidades)\\b';

/**
 * Formas de decir cuántos envases trae el producto, en el orden en que se prueban.
 * `sizeIsEach`: la forma misma dice que el tamaño es de cada envase ("10 x 20g").
 */
const PACKS: { pattern: RegExp; sizeIsEach?: boolean }[] = [
  { pattern: /\bsix\s*-?\s*pack\b/i }, // "Sixpack", "Six Pack" → 6
  { pattern: /\b(\d+)\s*pack\b/i }, // "4 Pack"
  { pattern: new RegExp(`\\b(?:paquete|pack|caja|display|tira)\\s*(?:x\\s*)?(\\d+)\\s*${UNITS_WORD}`, 'i') }, // "Paquete 6un"
  { pattern: new RegExp(`\\bx\\s*(\\d+)\\s*${UNITS_WORD}`, 'i') }, // "x 2un"
  { pattern: /\b(\d+)\s*x\s*(?=\d+(?:[.,]\d+)?\s*(?:kg|grs|gr|g|ml|cc|lts|lt|l)\b)/i, sizeIsEach: true }, // "10 x 20g"
];

/** Palabras que dicen que el tamaño es de cada envase del pack: "Lata 390g", "Botella 1L", "625 ml c/u". */
const EACH_CONTAINER = /\b(?:lata|botella)\b|c\/u/i;

/** Cuántos envases trae el producto y si se sabe que el tamaño es de cada uno. */
function pack(name: string): { count: number; sizeIsEach: boolean } {
  for (const { pattern, sizeIsEach } of PACKS) {
    const match = pattern.exec(name);
    if (match) {
      const count = match[1] ? Number(match[1]) : 6;
      return { count, sizeIsEach: Boolean(sizeIsEach) || EACH_CONTAINER.test(name) };
    }
  }
  return { count: 1, sizeIsEach: true };
}

/**
 * El tamaño total del producto (envase × pack), o null si el nombre no lo dice
 * con claridad. Lo que VTEX vende por peso (`measurementUnit` "kg") publica su
 * precio por kg, así que cuenta como 1 kg sin importar el nombre.
 *
 * Ante la duda no hay tamaño, para no mostrar un precio por kg o L engañoso:
 * dos tamaños en el nombre, un combo ("Keke + Gaseosa 1.5L") o un pack que no
 * dice si el tamaño es de cada envase ("Sixpack Galletas 222g").
 */
export function parseSize(name: string, measurementUnit?: string): Size | null {
  if (measurementUnit?.toLowerCase() === 'kg') return { quantity: 1000, unit: 'g' };
  if (name.includes('+')) return null;

  const sizes = [...name.matchAll(SIZE)];
  if (sizes.length !== 1) return null;
  const [, amount, written] = sizes[0];

  const { count, sizeIsEach } = pack(name);
  if (count > 1 && !sizeIsEach) return null;

  const { unit, factor } = UNITS[written.toLowerCase()];
  return { quantity: Math.round(Number(amount.replace(',', '.')) * factor * count), unit };
}
