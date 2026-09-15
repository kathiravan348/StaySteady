// Holding-period tax status (requirements 18: flag positions approaching a threshold). Pure.

import { pluralize } from '../../../../shared/format';
import type { TaxStatus } from './holdingTypes';

// A lot within this many days of its market's threshold is "approaching" long-term treatment.
export const APPROACHING_WINDOW_DAYS = 30;

export function lotTaxStatus(daysHeld: number, thresholdDays: number | null): TaxStatus {
  if (thresholdDays === null) {
    return { kind: 'not-applicable' };
  }
  if (daysHeld >= thresholdDays) {
    return { kind: 'long-term' };
  }
  const daysToLongTerm = thresholdDays - daysHeld;
  return daysToLongTerm <= APPROACHING_WINDOW_DAYS
    ? { kind: 'approaching', daysToLongTerm }
    : { kind: 'short-term', daysToLongTerm };
}

// A position is "approaching" if any lot is, so the prompt is never hidden behind older lots.
export function holdingTaxStatus(lots: readonly TaxStatus[]): TaxStatus {
  let longTerm = 0;
  let applicable = 0;
  let nearest: number | null = null;
  let soonestShort: number | null = null;

  for (const status of lots) {
    switch (status.kind) {
      case 'long-term':
        longTerm += 1;
        applicable += 1;
        break;
      case 'approaching':
        applicable += 1;
        nearest =
          nearest === null ? status.daysToLongTerm : Math.min(nearest, status.daysToLongTerm);
        break;
      case 'short-term':
        applicable += 1;
        soonestShort =
          soonestShort === null
            ? status.daysToLongTerm
            : Math.min(soonestShort, status.daysToLongTerm);
        break;
      case 'not-applicable':
      case 'mixed':
        break;
    }
  }

  if (applicable === 0) {
    return { kind: 'not-applicable' };
  }
  if (nearest !== null) {
    return { kind: 'approaching', daysToLongTerm: nearest };
  }
  if (longTerm === applicable) {
    return { kind: 'long-term' };
  }
  if (longTerm === 0 && soonestShort !== null) {
    return { kind: 'short-term', daysToLongTerm: soonestShort };
  }
  return { kind: 'mixed', longTermLots: longTerm, totalLots: applicable };
}

export function describeTaxStatus(status: TaxStatus): string {
  switch (status.kind) {
    case 'not-applicable':
      return 'No holding-period rule';
    case 'long-term':
      return 'Long term';
    case 'approaching':
      return `Long term in ${pluralize(status.daysToLongTerm, 'day')}`;
    case 'short-term':
      return `Short term (${pluralize(status.daysToLongTerm, 'day')} to long term)`;
    case 'mixed':
      return `Mixed: ${status.longTermLots} of ${status.totalLots} lots long term`;
  }
}
