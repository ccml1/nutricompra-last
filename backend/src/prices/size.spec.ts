import { parseSize } from './size';

// Nombres reales de productos de Plaza Vea, Wong y Metro (Neon, 4 nov. 2026).
describe('parseSize', () => {
  it('lee el tamaño del nombre en g, kg, ml y L, con sus formas (Gr, Kg, lt, cc, "1 L", "2.5L")', () => {
    expect(parseSize('Crema de Leche Gloria 946ml')).toEqual({ quantity: 946, unit: 'ml' });
    expect(parseSize('Arroz Añejo Extra COSTEÑO Bolsa 5Kg')).toEqual({ quantity: 5000, unit: 'g' });
    expect(parseSize('Aceite De Girasol Borges Botella 1 L')).toEqual({ quantity: 1000, unit: 'ml' });
    expect(parseSize('Atún Claro en Aceite de Oliva Palacio de Oriente Lata 111 g')).toEqual({
      quantity: 111,
      unit: 'g',
    });
    expect(parseSize("Agua de Mesa BELL'S Sin Gas Botella 2.5L")).toEqual({ quantity: 2500, unit: 'ml' });
    expect(parseSize('Aceite de Maíz Mazola Original Botella 1.18 lt')).toEqual({
      quantity: 1180,
      unit: 'ml',
    });
    expect(parseSize('Ají especial SIBARITA Sin picante Bolsa 100Gr')).toEqual({ quantity: 100, unit: 'g' });
    expect(parseSize('Miel De Abeja Fitosana 450cc')).toEqual({ quantity: 450, unit: 'ml' });
  });

  it('multiplica por el pack cuando el tamaño es de cada envase ("Paquete 6un", "4 Pack", "x 2un", "Sixpack", "10 x 20g")', () => {
    expect(parseSize('Leche Evaporada Entera GLORIA Lata 390g Paquete 6un')).toEqual({
      quantity: 2340,
      unit: 'g',
    });
    expect(parseSize('Agua Mineral con Gas MAISON PERRIER Chic Citrus Fizz Lata 250ml Pack 4un')).toEqual({
      quantity: 1000,
      unit: 'ml',
    });
    expect(parseSize('Agua Mineral EVIAN Sin Gas Paquete 6un Botella 330ml')).toEqual({
      quantity: 1980,
      unit: 'ml',
    });
    expect(parseSize('Agua Sin Gas Cielo Pack 6 Unidades de 625 ml c/u')).toEqual({
      quantity: 3750,
      unit: 'ml',
    });
    expect(parseSize('Agua Saborizada MR PERKINS Soda Pink 4 Pack Lata 180ml')).toEqual({
      quantity: 720,
      unit: 'ml',
    });
    expect(parseSize('Pack Gaseosa COCA COLA Botella 1L x 2un')).toEqual({ quantity: 2000, unit: 'ml' });
    expect(parseSize('Sixpack Gaseosa Inca Kola Sin Azúcar Botella 1.5L')).toEqual({
      quantity: 9000,
      unit: 'ml',
    });
    expect(parseSize('Caja de Chocotejas Zero Azúcar x 10 x 20g')).toEqual({ quantity: 200, unit: 'g' });
  });

  it('lo que VTEX vende por kg cuenta como 1 kg al precio publicado, aunque el nombre no traiga número', () => {
    // La ficha de Wong muestra "S/ 3.59 x kg" y la API publica Price 3.59 con unidad "kg".
    expect(parseSize('Plátano de Seda Wong x kg', 'kg')).toEqual({ quantity: 1000, unit: 'g' });
    expect(parseSize('Plátano de Seda Tipo Exportación en Bolsa x kg', 'kg')).toEqual({
      quantity: 1000,
      unit: 'g',
    });
  });

  it('sin un tamaño claro no inventa uno: unidades, sobres, porciones, dos tamaños, combos y packs que no dicen si el tamaño es de cada envase', () => {
    // Se venden por unidad, sobre o porción: no tienen kg ni litros.
    expect(parseSize('Granadilla Tipo Exportación 4un.')).toBeNull();
    expect(parseSize('YOUTH ELIXIR FUXION 28 SOBRES')).toBeNull();
    expect(parseSize('Torta Selva Negra con Durazno 16 Porciones')).toBeNull();
    expect(parseSize('Keke de Vainilla Rectangular LA FLORENCIA x und.')).toBeNull();
    // Dos tamaños: no se sabe cuál es el del producto.
    expect(parseSize('Helado Zub Zero Sabor 200G Chocolúcuma 180g')).toBeNull();
    // Combos ("+"): el tamaño es de una sola parte del combo.
    expect(parseSize('Keke Marmoleado + Gaseosa Botella 1.5L')).toBeNull();
    expect(parseSize('Cubo de Atún Poke 200g + Salsa Aliño Nikkei 80g')).toBeNull();
    // Packs sin "Lata", "Botella", "c/u" ni "10 x 20g": el tamaño puede ser del total.
    expect(parseSize('Sixpack Galletas Chips Ahoy Original 222g')).toBeNull();
    expect(parseSize('Barquilllo de Chocolate PIRUCREAM 6 Pack Blíster 144g')).toBeNull();
  });
});
