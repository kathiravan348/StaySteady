// Position Detail data: the holding row (shared with Holdings) or why there is none (UI spec 7.3, 10).

import type { PartialDataSource } from '@staysteady/ui';

import { useInstruments } from '../../../data/api';
import type { InstrumentDto } from '../../../data/schemas';
import type { BaseCurrencyCode } from '../../../shared/types/currency';
import type { IsoUtcTimestamp } from '../../../shared/types/dateTime';
import type { HoldingRow } from '../holdings/model/holdingTypes';
import { useHoldingsData } from '../holdings/useHoldingsData';

export type PositionState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string; readonly retry: () => void }
  | { readonly status: 'unknown'; readonly instrumentId: string }
  | { readonly status: 'not-held'; readonly instrument: InstrumentDto }
  | {
      readonly status: 'ready';
      readonly row: HoldingRow;
      readonly baseCurrency: BaseCurrencyCode;
      readonly heldMarketIds: ReadonlySet<string>;
      readonly oldestQuoteTimestamp: IsoUtcTimestamp | null;
      readonly unavailable: readonly PartialDataSource[];
      readonly retry: () => void;
    };

export function usePositionData(instrumentId: string): PositionState {
  const holdings = useHoldingsData();
  const instruments = useInstruments();

  if (holdings.status === 'loading') {
    return { status: 'loading' };
  }
  if (holdings.status === 'error') {
    return { status: 'error', message: holdings.message, retry: holdings.retry };
  }
  if (holdings.status === 'ready') {
    const row = holdings.rows.find((item) => item.instrument.id === instrumentId);
    if (row !== undefined) {
      return {
        status: 'ready',
        row,
        baseCurrency: holdings.baseCurrency,
        heldMarketIds: new Set([row.instrument.marketId]),
        oldestQuoteTimestamp: row.quoteTimestamp,
        unavailable: holdings.unavailable,
        retry: holdings.retry,
      };
    }
  }

  if (instruments.isError) {
    return {
      status: 'error',
      message: instruments.error.message,
      retry: () => {
        void instruments.refetch();
      },
    };
  }
  if (instruments.data === undefined) {
    return { status: 'loading' };
  }
  const instrument = instruments.data.find((item) => item.id === instrumentId);
  return instrument === undefined
    ? { status: 'unknown', instrumentId }
    : { status: 'not-held', instrument };
}
