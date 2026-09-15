// Display helpers shared by screens. Gains and losses always carry a sign (UI spec 4).

import type { Money } from '../money';
import { formatMoney } from './formatMoney';
import { formatPercentage } from './formatNumber';

export type NumberDirection = 'positive' | 'negative' | 'neutral';

// "long_term" -> "Long term", "manual-approval" -> "Manual approval".
export function humanizeToken(token: string): string {
  const words = token.replaceAll('_', ' ').replaceAll('-', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

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
