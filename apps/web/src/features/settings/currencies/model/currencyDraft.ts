// Editing currency configuration (UI spec 7.18): what a conversion costs in the base currency, and
// versions described in the screen's own words for the diff.

import type { BaseCurrencyConfigInput, CurrencyConfigInput } from '../../../../data/schemas';
import { formatMoney } from '../../../../shared/format';
import type { Money } from '../../../../shared/money';
import { createMoney, multiplyMoney } from '../../../../shared/money';
import type { CurrencyCode } from '../../../../shared/types/currency';

export const SAMPLE_AMOUNT = 10_000;

// The cost of converting SAMPLE_AMOUNT of the base currency into this one, in the base currency.
export function sampleConversionCost(bps: number, base: CurrencyCode): Money | null {
  if (!Number.isFinite(bps) || bps < 0) return null;
  return multiplyMoney(createMoney(SAMPLE_AMOUNT, base), bps / 10_000);
}

export function describeCurrency(
  config: CurrencyConfigInput,
  providerName: (id: string) => string,
): Record<string, string> {
  return {
    Enabled: config.enabled ? 'Yes' : 'No',
    'Rate source': providerName(config.rateSourceId),
    'Fallback source':
      config.fallbackSourceId === null ? 'None' : providerName(config.fallbackSourceId),
    'Rate goes stale after': `${String(config.maxRateAgeMinutes)} min`,
    'Conversion cost': `${String(config.conversionCostBps)} bps`,
  };
}

export function describeBaseCurrency(config: BaseCurrencyConfigInput): Record<string, string> {
  return { 'Base currency': config.currency };
}

export const formatSample = (money: Money | null): string =>
  money === null ? 'unknown' : formatMoney(money);
