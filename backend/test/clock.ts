/**
 * Fija la fecha y hora actuales en un test (Date y Date.now). Solo finge el
 * reloj: los timers siguen siendo reales, porque Nest y supertest los usan y
 * con timers falsos el test se quedaría colgado. Para mover la hora después,
 * `jest.setSystemTime(...)`; para volver al reloj real, `jest.useRealTimers()`.
 */
export function setClock(now: string | Date) {
  jest.useFakeTimers({
    now: new Date(now),
    doNotFake: [
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  });
}
