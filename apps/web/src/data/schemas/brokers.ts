// Requirements 8 — broker and platform accounts (summary fields used by portfolio screens).

import { z } from 'zod';

import { BrokerIdSchema, CurrencyCodeSchema, MarketIdSchema } from './common';

export const BrokerSchema = z.object({
  id: BrokerIdSchema,
  name: z.string().min(1),
  country: z.string().min(1),
  marketIds: z.array(MarketIdSchema).min(1),
  accountCurrency: CurrencyCodeSchema,
  // Requirements 8 — a broker not flagged automation-capable is used for tracking only.
  supportsAutomation: z.boolean(),
});
export type BrokerDto = z.infer<typeof BrokerSchema>;
