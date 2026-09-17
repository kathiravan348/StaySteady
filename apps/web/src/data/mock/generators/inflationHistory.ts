// Historical consumer price inflation for the owner's markets (M-17; requirements 30; UI spec 19.4).
// Yearly rates approximate published annual averages and are mock figures, not an authoritative
// source. The monthly index compounds each year's rate evenly across its months from 100.

import { Decimal } from 'decimal.js';

import type { InflationCountryDto, InflationHistoryDto } from '../../schemas/inflation';
import { InflationHistorySchema } from '../../schemas/inflation';
import type { CurrencyCode } from '../../../shared/types/currency';
import { parseGenerated } from './validated';

const FIRST_YEAR = 2016;

interface SeriesSeed {
  readonly country: InflationCountryDto;
  readonly currency: CurrencyCode;
  readonly measure: string;
  // Rates from FIRST_YEAR onward; the last entry is the assumption used for the current year and any
  // later year the mock clock reaches.
  readonly rates: readonly number[];
}

const SEEDS: readonly SeriesSeed[] = [
  {
    country: 'US',
    currency: 'USD',
    measure: 'Consumer Price Index, all urban consumers (CPI-U)',
    rates: [1.3, 2.1, 2.4, 1.8, 1.2, 4.7, 8.0, 4.1, 2.9, 2.7, 2.8],
  },
  {
    country: 'IN',
    currency: 'INR',
    measure: 'Consumer Price Index, combined (all India)',
    rates: [4.9, 3.3, 3.9, 3.7, 6.6, 5.1, 6.7, 5.7, 4.9, 2.4, 4.0],
  },
  {
    country: 'GB',
    currency: 'GBP',
    measure: 'Consumer Prices Index (CPI)',
    rates: [0.7, 2.7, 2.5, 1.8, 0.9, 2.6, 9.1, 7.3, 2.5, 3.4, 3.0],
  },
];

function rateFor(seed: SeriesSeed, year: number): number {
  const offset = year - FIRST_YEAR;
  return seed.rates[Math.min(offset, seed.rates.length - 1)] ?? 0;
}

export function generateInflationHistory(today: string): InflationHistoryDto {
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));
  const series = SEEDS.map((seed) => {
    const years = [];
    const monthlyIndex = [];
    let index = new Decimal(100);
    for (let year = FIRST_YEAR; year <= currentYear; year += 1) {
      const ratePercent = rateFor(seed, year);
      years.push({ year, ratePercent, isEstimate: year === currentYear });
      const monthly = new Decimal(1).plus(new Decimal(ratePercent).dividedBy(100)).pow(1 / 12);
      const lastMonth = year === currentYear ? currentMonth : 12;
      for (let month = 1; month <= lastMonth; month += 1) {
        if (year !== FIRST_YEAR || month !== 1) index = index.times(monthly);
        monthlyIndex.push({
          month: `${String(year)}-${String(month).padStart(2, '0')}`,
          index: index.toFixed(4),
        });
      }
    }
    return {
      country: seed.country,
      currency: seed.currency,
      measure: seed.measure,
      source: 'Mock figures approximating published annual averages',
      years,
      monthlyIndex,
    };
  });
  return parseGenerated(InflationHistorySchema, series, 'inflation history');
}
