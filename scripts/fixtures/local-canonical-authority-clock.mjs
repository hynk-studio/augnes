// Only synthetic record authors use this clock. Shared receipt helpers inherit
// the acquisition callback's adjacent ticks across awaits; production clocks,
// deadlines, unrelated groups and fresh processes keep native Date.now.
import { AsyncLocalStorage } from "node:async_hooks";

const acquisitionClock = new AsyncLocalStorage();
export const fixtureNow = () => acquisitionClock.getStore()?.() ?? Date.now();

export function withAdjacentAuthorityClock(callback, nativeNow = Date.now) {
  let previous = nativeNow();
  return acquisitionClock.run(() => previous = Math.max(nativeNow(), previous + 1), callback);
}
