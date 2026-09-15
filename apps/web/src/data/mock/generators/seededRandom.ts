// Seeded random helpers used by every mock dataset generator (M-03).

import { hashSeed, mulberry32 } from './prng';

export interface WeightedOption<T> {
  readonly value: T;
  readonly weight: number;
}

export interface SeededRandom {
  // The seed key this stream was created from, e.g. "staysteady-mock-v1:instruments".
  readonly seedKey: string;
  // Number in [0, 1).
  next(): number;
  // Integer in [min, max], both inclusive.
  int(min: number, max: number): number;
  // Number in [min, max).
  float(min: number, max: number): number;
  boolean(probability?: number): boolean;
  pick<T>(items: readonly T[]): T;
  weightedPick<T>(options: readonly WeightedOption<T>[]): T;
  shuffle<T>(items: readonly T[]): T[];
  sample<T>(items: readonly T[], count: number): T[];
  // Normally distributed number (Box–Muller), used for realistic price moves.
  normal(mean?: number, standardDeviation?: number): number;
  // Independent child stream. Adding a new fork never changes the numbers of another fork.
  fork(key: string): SeededRandom;
}

export function createSeededRandom(seedKey: string): SeededRandom {
  const source = mulberry32(hashSeed(seedKey));

  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`int(${min}, ${max}) needs integer bounds with min <= max`);
    }
    return min + Math.floor(source() * (max - min + 1));
  };

  const pick = <T>(items: readonly T[]): T => {
    const item = items[int(0, items.length - 1)];
    if (item === undefined) {
      throw new RangeError('pick() needs at least one item');
    }
    return item;
  };

  const shuffle = <T>(items: readonly T[]): T[] => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = int(0, index);
      const current = result[index];
      const swap = result[swapIndex];
      if (current !== undefined && swap !== undefined) {
        result[index] = swap;
        result[swapIndex] = current;
      }
    }
    return result;
  };

  return {
    seedKey,
    next: source,
    int,
    float: (min, max) => min + source() * (max - min),
    boolean: (probability = 0.5) => source() < probability,
    pick,
    weightedPick: (options) => weightedPick(source(), options),
    shuffle,
    sample: (items, count) => shuffle(items).slice(0, Math.max(0, count)),
    normal: (mean = 0, standardDeviation = 1) => {
      // 1 - source() keeps the logarithm argument inside (0, 1].
      const radius = Math.sqrt(-2 * Math.log(1 - source()));
      return mean + standardDeviation * radius * Math.cos(2 * Math.PI * source());
    },
    fork: (key) => createSeededRandom(`${seedKey}:${key}`),
  };
}

function weightedPick<T>(roll: number, options: readonly WeightedOption<T>[]): T {
  const total = options.reduce((sum, option) => sum + Math.max(0, option.weight), 0);
  if (total <= 0) {
    throw new RangeError('weightedPick() needs at least one option with a positive weight');
  }
  let remaining = roll * total;
  for (const option of options) {
    remaining -= Math.max(0, option.weight);
    if (remaining < 0) {
      return option.value;
    }
  }
  const last = options[options.length - 1];
  if (last === undefined) {
    throw new RangeError('weightedPick() needs at least one option');
  }
  return last.value;
}
