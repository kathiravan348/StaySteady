// Historical consumer price inflation per country (requirements 30; UI spec 19.4). Real returns divide
// a nominal value change by the index change over the same months, so both yearly rates and a monthly
// index are carried.

import { z } from 'zod';

import { CurrencyCodeSchema, DecimalStringSchema } from './common';

export const InflationCountrySchema = z.enum(['US', 'IN', 'GB']);
export type InflationCountryDto = z.infer<typeof InflationCountrySchema>;

export const InflationYearSchema = z.object({
  year: z.number().int().min(1990).max(2100),
  ratePercent: z.number().min(-20).max(100),
  // The current year is incomplete; its rate is an assumption, not a published figure.
  isEstimate: z.boolean(),
});
export type InflationYearDto = z.infer<typeof InflationYearSchema>;

export const InflationIndexPointSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  index: DecimalStringSchema,
});
export type InflationIndexPointDto = z.infer<typeof InflationIndexPointSchema>;

export const InflationSeriesSchema = z.object({
  country: InflationCountrySchema,
  currency: CurrencyCodeSchema,
  measure: z.string().min(1),
  source: z.string().min(1),
  years: z.array(InflationYearSchema).min(1),
  monthlyIndex: z.array(InflationIndexPointSchema).min(12),
});
export type InflationSeriesDto = z.infer<typeof InflationSeriesSchema>;

export const InflationHistorySchema = z.array(InflationSeriesSchema).min(2);
export type InflationHistoryDto = z.infer<typeof InflationHistorySchema>;
