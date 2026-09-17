// Capital losses carried forward between tax years (requirements 26; UI spec 19.2 and 19.4). Each
// loss keeps the tax year it arose in, what is left of it and the last year it may be set off in.

import { z } from 'zod';

import { IsoDateSchema, MoneySchema } from './common';

export const TaxJurisdictionSchema = z.enum(['IN', 'US']);
export type TaxJurisdictionDto = z.infer<typeof TaxJurisdictionSchema>;

export const CarriedLossCategorySchema = z.enum(['short_term', 'long_term']);
export type CarriedLossCategoryDto = z.infer<typeof CarriedLossCategorySchema>;

export const LossCarryForwardSchema = z.object({
  id: z.string().min(1),
  jurisdiction: TaxJurisdictionSchema,
  category: CarriedLossCategorySchema,
  // Tax year label as the jurisdiction writes it, e.g. "FY 2020-21" or "2022".
  taxYear: z.string().min(1),
  original: MoneySchema,
  setOff: MoneySchema,
  remaining: MoneySchema,
  // Null when the loss never expires.
  lastTaxYear: z.string().min(1).nullable(),
  expiresOn: IsoDateSchema.nullable(),
  daysToExpiry: z.number().int().nullable(),
  isExpiringSoon: z.boolean(),
  rule: z.string().min(1),
});
export type LossCarryForwardDto = z.infer<typeof LossCarryForwardSchema>;

export const LossCarryForwardListSchema = z.array(LossCarryForwardSchema);
export type LossCarryForwardListDto = z.infer<typeof LossCarryForwardListSchema>;
