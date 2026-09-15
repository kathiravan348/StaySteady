// Display helpers for the Overview. Gains and losses always carry a sign (UI spec 4).

import { formatMoney, formatPercentage } from '../../shared/format';
import type { Money } from '../../shared/money';

export type NumberDirection = 'positive' | 'negative' | 'neutral';

export function formatSignedMoney(money: Money): string {
  return formatMoney(money, { signed: true });
}

export function formatSignedPercent(value: number): string {
  return formatPercentage(value, { signed: true });
}

export function directionOfNumber(value: number): NumberDirection {
  if (value > 0) {
    return 'positive';
  }
  return value < 0 ? 'negative' : 'neutral';
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
