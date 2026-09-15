// Mock data generator toolkit (M-03). The datasets in M-04 to M-13 build on these helpers.
// Rule: mock data never calls Math.random — always a SeededRandom forked from the mock context.

export type { RandomSource } from './prng';
export { hashSeed, mulberry32 } from './prng';

export type { SeededRandom, WeightedOption } from './seededRandom';
export { createSeededRandom } from './seededRandom';

export type { MockGeneratorContext, MockGeneratorOptions } from './mockContext';
export { DEFAULT_MOCK_SEED, createMockGeneratorContext, startOfUtcDay } from './mockContext';

export { MockDataError, parseGenerated, parseGeneratedList } from './validated';

export type { DecimalRange, MoneyRange } from './values';
export {
  addDays,
  currencyDecimals,
  daysBetween,
  randomDateBetween,
  randomDecimalString,
  randomMoney,
  randomTimestampBetween,
  sequentialId,
  toUtcDate,
} from './values';
