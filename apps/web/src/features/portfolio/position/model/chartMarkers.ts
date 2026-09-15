// Entry and exit markers plus price levels for the position chart (UI spec 7.3). Pure.

import type { PriceChartLevel, PriceChartMarker } from '@staysteady/ui';

import { formatNumber } from '../../../../shared/format';
import type { Money } from '../../../../shared/money';
import type { ExitInfo, LotView } from '../../holdings/model/holdingTypes';
import type { LedgerEntry } from './positionTypes';

interface DatedMarker {
  readonly date: string;
  readonly marker: Omit<PriceChartMarker, 'time'>;
}

// Markers must sit on a bar: a weekend or holiday date moves to the previous trading day.
function lastBarOnOrBefore(barDates: readonly string[], date: string): string | null {
  let found: string | null = null;
  for (const candidate of barDates) {
    if (candidate > date) {
      break;
    }
    found = candidate;
  }
  return found;
}

const quantityText = (quantity: number): string =>
  formatNumber(quantity, { decimals: Number.isInteger(quantity) ? 0 : 4 });

// barDates must be ascending. Entries before the first bar are left out (see hiddenCount).
export function buildPositionMarkers(
  lots: readonly LotView[],
  ledger: readonly LedgerEntry[],
  barDates: readonly string[],
): { readonly markers: PriceChartMarker[]; readonly hiddenCount: number } {
  const dated: DatedMarker[] = [
    ...lots.map((lot) => ({
      date: lot.purchaseDate,
      marker: {
        position: 'below' as const,
        shape: 'arrowUp' as const,
        tone: 'neutral' as const,
        text: `Buy ${quantityText(lot.quantity)}`,
      },
    })),
    ...ledger
      .filter((entry) => entry.type === 'sell' || (entry.isManual && entry.type === 'buy'))
      .map((entry) => ({
        date: entry.date,
        marker: {
          position: entry.type === 'sell' ? ('above' as const) : ('below' as const),
          shape: entry.type === 'sell' ? ('arrowDown' as const) : ('arrowUp' as const),
          tone: 'neutral' as const,
          text: `${entry.type === 'sell' ? 'Sell' : 'Buy'} ${quantityText(entry.quantity ?? 0)}${
            entry.isManual ? ' (manual)' : ''
          }`,
        },
      })),
  ];

  const markers: PriceChartMarker[] = [];
  let hiddenCount = 0;
  for (const { date, marker } of dated) {
    const time = lastBarOnOrBefore(barDates, date);
    if (time === null) {
      hiddenCount += 1;
    } else {
      markers.push({ ...marker, time });
    }
  }
  markers.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  return { markers, hiddenCount };
}

export function buildPriceLevels(exit: ExitInfo | null, averageCost: Money): PriceChartLevel[] {
  return [
    {
      id: 'average-cost',
      price: averageCost.amount.toNumber(),
      title: 'Average cost',
      tone: 'neutral',
      isDashed: true,
    },
    ...(exit === null
      ? []
      : [
          { id: 'exit', price: exit.level.amount.toNumber(), title: 'Exit', tone: 'down' as const },
        ]),
  ];
}
