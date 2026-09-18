// Insider and promoter dealings as disclosed to the exchange (R-10; UI spec 20.1). Seeded per
// symbol by days before the reference date; the value is priced off the close on the dealing day so
// it agrees with the chart (decision 19).

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type { InstrumentDto } from '../../schemas';
import type { InsiderTransactionDto, InsiderTransactionSchema } from '../../schemas/classification';
import type { MockGeneratorContext } from './mockContext';
import { generatePriceHistoryForInstrument } from './priceHistory';
import { currencyDecimals } from './values';

interface DealingSeed {
  readonly daysAgo: number;
  readonly disclosureLagDays: number;
  readonly personName: string;
  readonly role: InsiderTransactionDto['role'];
  readonly action: InsiderTransactionDto['action'];
  readonly shares: number;
}

// Markets whose insider disclosures the platform collects. Elsewhere the list is not reported.
const REPORTING_MARKETS: ReadonlySet<string> = new Set(['IN', 'US']);

const SEEDS: Readonly<Record<string, readonly DealingSeed[]>> = {
  // The pledges behind the rising pledge trend, and a director selling into it.
  TATAMOTORS: [
    {
      daysAgo: 40,
      disclosureLagDays: 2,
      personName: 'Tata Sons Private Limited',
      role: 'promoter',
      action: 'pledge',
      shares: 42_000_000,
    },
    {
      daysAgo: 95,
      disclosureLagDays: 3,
      personName: 'A. Mehta (independent director)',
      role: 'director',
      action: 'sell',
      shares: 25_000,
    },
    {
      daysAgo: 210,
      disclosureLagDays: 2,
      personName: 'Tata Sons Private Limited',
      role: 'promoter',
      action: 'pledge',
      shares: 38_500_000,
    },
    {
      daysAgo: 330,
      disclosureLagDays: 2,
      personName: 'Tata Industries Limited',
      role: 'promoter_group',
      action: 'pledge_release',
      shares: 6_000_000,
    },
  ],
  RELIANCE: [
    {
      daysAgo: 120,
      disclosureLagDays: 2,
      personName: 'Promoter group trust',
      role: 'promoter_group',
      action: 'buy',
      shares: 1_200_000,
    },
  ],
  AAPL: [
    {
      daysAgo: 20,
      disclosureLagDays: 2,
      personName: 'Chief Executive Officer',
      role: 'officer',
      action: 'sell',
      shares: 108_000,
    },
    {
      daysAgo: 150,
      disclosureLagDays: 2,
      personName: 'Chief Financial Officer',
      role: 'officer',
      action: 'sell',
      shares: 42_000,
    },
  ],
  NVDA: [
    {
      daysAgo: 60,
      disclosureLagDays: 2,
      personName: 'Director',
      role: 'director',
      action: 'sell',
      shares: 30_000,
    },
  ],
};

const DAY_MS = 86_400_000;
const isoDaysBefore = (reference: string, days: number): string =>
  new Date(Date.parse(`${reference.slice(0, 10)}T00:00:00Z`) - days * DAY_MS)
    .toISOString()
    .slice(0, 10);

export function reportsInsiderTransactions(instrument: InstrumentDto): boolean {
  return REPORTING_MARKETS.has(instrument.marketId);
}

export function insiderTransactionsFor(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
): z.input<typeof InsiderTransactionSchema>[] {
  const seeds = SEEDS[instrument.symbol];
  if (seeds === undefined || !reportsInsiderTransactions(instrument)) return [];
  const bars = generatePriceHistoryForInstrument(ctx, instrument);
  const reference = String(ctx.referenceTime);
  const decimals = currencyDecimals(instrument.currency);

  return [...seeds]
    .sort((a, b) => a.daysAgo - b.daysAgo)
    .flatMap((seed, index) => {
      const dealtOn = isoDaysBefore(reference, seed.daysAgo);
      // The last close on or before the dealing day: a dealing on a holiday prices at the prior close.
      const bar = bars.filter((item) => item.timestamp.slice(0, 10) <= dealtOn).at(-1);
      if (bar === undefined) return [];
      return [
        {
          id: `${instrument.symbol}-insider-${String(index + 1)}`,
          dealtOn,
          disclosedOn: isoDaysBefore(reference, seed.daysAgo - seed.disclosureLagDays),
          personName: seed.personName,
          role: seed.role,
          action: seed.action,
          shares: seed.shares,
          value: {
            amount: new Decimal(bar.close).times(seed.shares).toFixed(decimals),
            currency: instrument.currency,
          },
        },
      ];
    });
}
