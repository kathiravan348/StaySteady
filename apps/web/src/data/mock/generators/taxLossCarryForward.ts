// Capital losses carried forward for an India-resident owner (M-17; requirements 26; UI spec 19.4).
// Tax years are placed relative to the mock clock so one loss always lapses at the end of the
// current financial year and the others later. Mock figures only, never advice.

import { Decimal } from 'decimal.js';

import type { LossCarryForwardListDto } from '../../schemas/tax-losses';
import { LossCarryForwardListSchema } from '../../schemas/tax-losses';
import { toIsoDate } from '../../../shared/types/dateTime';
import { parseGeneratedList } from './validated';

// Income-tax Act, 1961 ss. 74: set off for eight assessment years after the year of loss.
const CARRY_YEARS = 8;
const EXPIRING_SOON_DAYS = 240;
const DAY_MS = 24 * 60 * 60 * 1000;

interface LossSeed {
  readonly id: string;
  readonly category: 'short_term' | 'long_term';
  readonly yearsAgo: number;
  readonly original: string;
  readonly setOff: string;
}

const SEEDS: readonly LossSeed[] = [
  {
    id: 'loss-in-stcl-old',
    category: 'short_term',
    yearsAgo: 8,
    original: '184000.00',
    setOff: '121500.00',
  },
  {
    id: 'loss-in-ltcl-mid',
    category: 'long_term',
    yearsAgo: 5,
    original: '96500.00',
    setOff: '0.00',
  },
  {
    id: 'loss-in-stcl-new',
    category: 'short_term',
    yearsAgo: 2,
    original: '58200.00',
    setOff: '14000.00',
  },
];

const RULES: Readonly<Record<LossSeed['category'], string>> = {
  short_term: 'Short-term capital loss: set off against short-term or long-term gains',
  long_term: 'Long-term capital loss: set off against long-term gains only',
};

function financialYear(startYear: number): string {
  return `FY ${String(startYear)}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

export function generateLossCarryForwards(
  today: string,
  carryYears: number = CARRY_YEARS,
): LossCarryForwardListDto {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const currentFyStart = month >= 4 ? year : year - 1;
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const losses = SEEDS.map((seed) => {
    const lossFyStart = currentFyStart - seed.yearsAgo;
    const lastFyStart = lossFyStart + carryYears;
    const expiresOn = `${String(lastFyStart + 1)}-03-31`;
    const daysToExpiry = Math.round((Date.parse(`${expiresOn}T00:00:00Z`) - todayMs) / DAY_MS);
    const remaining = new Decimal(seed.original).minus(seed.setOff);
    return {
      id: seed.id,
      jurisdiction: 'IN' as const,
      category: seed.category,
      taxYear: financialYear(lossFyStart),
      original: { amount: seed.original, currency: 'INR' as const },
      setOff: { amount: seed.setOff, currency: 'INR' as const },
      remaining: { amount: remaining.toFixed(2), currency: 'INR' as const },
      lastTaxYear: financialYear(lastFyStart),
      expiresOn: toIsoDate(expiresOn),
      daysToExpiry,
      isExpiringSoon: daysToExpiry <= EXPIRING_SOON_DAYS,
      rule: `${RULES[seed.category]}; carried only if the return for the loss year was filed on time`,
    };
  });
  return parseGeneratedList(LossCarryForwardListSchema.element, losses, 'loss carry-forwards');
}
