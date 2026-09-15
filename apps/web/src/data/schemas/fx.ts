// Requirements 10 — exchange rates are archived historically. Rates are positive decimal strings
// so conversion stays exact (decision 4).

import { z } from 'zod';

import {
  CurrencyCodeSchema,
  IsoDateSchema,
  IsoUtcTimestampSchema,
  PositiveDecimalStringSchema,
} from './common';

export const FxRateSchema = z.object({
  from: CurrencyCodeSchema,
  to: CurrencyCodeSchema,
  rate: PositiveDecimalStringSchema,
  asOf: IsoUtcTimestampSchema,
});
export type FxRateDto = z.infer<typeof FxRateSchema>;

export const FxRatePointSchema = z.object({
  date: IsoDateSchema,
  rate: PositiveDecimalStringSchema,
});
export type FxRatePointDto = z.infer<typeof FxRatePointSchema>;

export const FxRateHistorySchema = z.object({
  from: CurrencyCodeSchema,
  to: CurrencyCodeSchema,
  points: z.array(FxRatePointSchema),
});
export type FxRateHistoryDto = z.infer<typeof FxRateHistorySchema>;
