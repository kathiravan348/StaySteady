// Number formatting utilities with instrument-specific precision and compact notation (UI spec 4).

import type { Percentage, Ratio } from '../types/quantities';

export type InstrumentType = 'equity' | 'etf' | 'mutual_fund' | 'crypto' | 'forex' | 'bond';

export interface FormatNumberOptions {
  readonly decimals?: number;
  readonly signed?: boolean;
  readonly compact?: boolean;
  readonly locale?: string;
}

export function getDecimalsForInstrument(type: InstrumentType): number {
  switch (type) {
    case 'crypto':
      return 6;
    case 'forex':
      return 4;
    case 'bond':
      return 3;
    case 'equity':
    case 'etf':
    case 'mutual_fund':
    default:
      return 2;
  }
}

export function formatNumber(value: number, options: FormatNumberOptions = {}): string {
  if (!Number.isFinite(value)) {
    return '—';
  }

  const { decimals = 2, signed = false, compact = false, locale = 'en-US' } = options;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: compact ? 0 : decimals,
    maximumFractionDigits: decimals,
    notation: compact ? 'compact' : 'standard',
    compactDisplay: 'short',
    signDisplay: signed ? 'always' : 'auto',
  });

  return formatter.format(value);
}

export function formatPercentage(
  percentage: Percentage | number,
  options: { readonly decimals?: number; readonly signed?: boolean } = {},
): string {
  const num = typeof percentage === 'number' ? percentage : Number(percentage);
  if (!Number.isFinite(num)) {
    return '—%';
  }

  const { decimals = 2, signed = true } = options;
  const sign = signed && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
}

export function formatRatio(
  ratio: Ratio | number,
  options: { readonly decimals?: number; readonly signed?: boolean } = {},
): string {
  const num = typeof ratio === 'number' ? ratio : Number(ratio);
  if (!Number.isFinite(num)) {
    return '—';
  }

  const { decimals = 4, signed = false } = options;
  const sign = signed && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}`;
}

export function formatInstrumentPrice(value: number, type: InstrumentType): string {
  const decimals = getDecimalsForInstrument(type);
  return formatNumber(value, { decimals });
}
