// Currency formatting with market convention support (UI spec 4, standards 6.4).

import type { Money, GainLoss } from '../money';
import type { CurrencyCode } from '../types/currency';
import { formatPercentage } from './formatNumber';

export interface FormatMoneyOptions {
  readonly showCurrency?: 'code' | 'symbol' | 'both';
  readonly signed?: boolean;
  readonly compact?: boolean;
  readonly decimals?: number;
}

export function getLocaleForCurrency(currency: CurrencyCode): string {
  switch (currency) {
    case 'INR':
      return 'en-IN'; // Indian number formatting (Lakhs & Crores)
    case 'GBP':
      return 'en-GB';
    case 'EUR':
      return 'de-DE';
    case 'JPY':
      return 'ja-JP';
    case 'SGD':
      return 'en-SG';
    case 'HKD':
      return 'zh-HK';
    case 'CAD':
      return 'en-CA';
    case 'AUD':
      return 'en-AU';
    case 'CHF':
      return 'de-CH';
    case 'USD':
    default:
      return 'en-US';
  }
}

export function formatMoney<C extends CurrencyCode>(
  money: Money<C>,
  options: FormatMoneyOptions = {},
): string {
  const {
    showCurrency = 'symbol',
    signed = false,
    compact = false,
    decimals = money.currency === 'JPY' ? 0 : 2,
  } = options;

  const num = money.amount.toNumber();
  const locale = getLocaleForCurrency(money.currency);

  const formatter = new Intl.NumberFormat(locale, {
    style: showCurrency === 'code' ? 'decimal' : 'currency',
    currency: money.currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: compact ? 0 : decimals,
    maximumFractionDigits: decimals,
    notation: compact ? 'compact' : 'standard',
    compactDisplay: 'short',
    signDisplay: signed ? 'always' : 'auto',
  });

  const formatted = formatter.format(num);

  if (showCurrency === 'code') {
    const signPrefix = signed && num > 0 ? '+' : '';
    return `${signPrefix}${money.currency} ${formatted}`;
  }

  if (showCurrency === 'both') {
    return `${formatted} (${money.currency})`;
  }

  return formatted;
}

export function formatGainLossCombined<C extends CurrencyCode>(
  gainLoss: GainLoss<C>,
  options: { readonly showCurrency?: 'code' | 'symbol' | 'both' } = {},
): string {
  const absoluteStr = formatMoney(gainLoss.absolute, {
    signed: true,
    showCurrency: options.showCurrency ?? 'symbol',
  });
  const percentageStr = formatPercentage(gainLoss.percentage, { signed: true });
  return `${absoluteStr} (${percentageStr})`;
}
