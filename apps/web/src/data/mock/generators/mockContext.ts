// Shared starting point for every mock dataset generator (M-03).

import type { IsoUtcTimestamp } from '../../../shared/types/dateTime';
import { toIsoUtcTimestamp } from '../../../shared/types/dateTime';
import { createSeededRandom } from './seededRandom';
import type { SeededRandom } from './seededRandom';

// Changing this seed regenerates every dataset. Bump the version only on purpose.
export const DEFAULT_MOCK_SEED = 'staysteady-mock-v1';

export interface MockGeneratorContext {
  readonly random: SeededRandom;
  // "Now" for generated data. Datasets that walk forward from a fixed origin date keep the same
  // values for a given day whatever the reference time is.
  readonly referenceTime: IsoUtcTimestamp;
}

export interface MockGeneratorOptions {
  readonly seed?: string;
  readonly referenceTime?: IsoUtcTimestamp;
}

// Start of the current UTC day, so repeated loads on the same day see identical data.
export function startOfUtcDay(date: Date): IsoUtcTimestamp {
  return toIsoUtcTimestamp(
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())),
  );
}

export function createMockGeneratorContext(
  options: MockGeneratorOptions = {},
): MockGeneratorContext {
  return {
    random: createSeededRandom(options.seed ?? DEFAULT_MOCK_SEED),
    referenceTime: options.referenceTime ?? startOfUtcDay(new Date()),
  };
}
