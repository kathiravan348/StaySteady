// Deterministic pseudo-random numbers for mock data (UI spec 15: reproducible between sessions).
// Suitable for mock data only — never for anything security related. Mock data must never use
// Math.random, or datasets would change on every reload.

// A function returning a number in [0, 1).
export type RandomSource = () => number;

// FNV-1a 32-bit hash: turns a readable seed such as "staysteady-mock-v1:prices" into a number.
export function hashSeed(key: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// mulberry32: small and fast, with an even spread across [0, 1).
export function mulberry32(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
