/**
 * Respuesta inmediata al tocar un control: se hunde un poco, con el foco del
 * teclado visible, y sin movimiento si el sistema pide reducirlo.
 * Compartido por los chips y opciones de Nutrición y Precios.
 */
export const pressableClass =
  'cursor-pointer transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
