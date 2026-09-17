// What a fund actually holds (requirements 36; decision 51). A fund's own label is a blend, so
// exposure held through it only becomes measurable by looking through to its holdings and sector
// weights. Risk limits count that exposure; a sector limit that ignored funds would understate it.

import { z } from 'zod';

import { InstrumentIdSchema, IsoDateSchema, MoneySchema, PercentageSchema } from './common';

export const FundHoldingSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  // Set when this platform tracks the underlying instrument, so a screen can link to it.
  instrumentId: InstrumentIdSchema.nullable(),
  weightPercent: PercentageSchema,
  sectorName: z.string().min(1).nullable(),
  groupName: z.string().min(1).nullable(),
});
export type FundHoldingDto = z.infer<typeof FundHoldingSchema>;

export const FundSectorWeightSchema = z.object({
  sectorId: z.string().min(1).nullable(),
  sectorName: z.string().min(1),
  weightPercent: PercentageSchema,
});
export type FundSectorWeightDto = z.infer<typeof FundSectorWeightSchema>;

export const FundLookThroughSchema = z
  .object({
    instrumentId: InstrumentIdSchema,
    fundName: z.string().min(1),
    indexTracked: z.string().min(1).nullable(),
    assetsUnderManagement: MoneySchema.nullable(),
    holdingCount: z.number().int().positive(),
    // The largest holdings, not the whole book: a broad fund holds hundreds.
    topHoldings: z.array(FundHoldingSchema),
    sectorWeights: z.array(FundSectorWeightSchema).min(1),
    asOf: IsoDateSchema,
    source: z.string().min(1),
    note: z.string().min(1),
  })
  .refine(
    (value) =>
      value.sectorWeights.reduce((total, weight) => total + weight.weightPercent, 0) <= 100.5,
    { error: 'Sector weights cannot add up to more than 100%', path: ['sectorWeights'] },
  );
export type FundLookThroughDto = z.infer<typeof FundLookThroughSchema>;

// An instrument that is not a fund has nothing to look through, which is a fact about it rather
// than a failed request (the same shape as the ownership response).
export const FundLookThroughResponseSchema = z
  .object({
    instrumentId: InstrumentIdSchema,
    lookThrough: FundLookThroughSchema.nullable(),
    unavailableReason: z.string().min(1).nullable(),
  })
  .refine((value) => (value.lookThrough === null) !== (value.unavailableReason === null), {
    error: 'Either the look-through or the reason it is unavailable, never both or neither',
    path: ['unavailableReason'],
  });
export type FundLookThroughResponseDto = z.infer<typeof FundLookThroughResponseSchema>;
