// This position's transactions: the portfolio ledger plus manual entries from this session.

import { useMemo } from 'react';

import { useTransactions } from '../../../data/api';
import type { CurrencyCode } from '../../../shared/types/currency';
import type { ManualTransaction } from './model/positionEdits';
import { ledgerFromDtos, ledgerFromManual, sortNewestFirst } from './model/positionLedger';
import type { LedgerState } from './model/positionTypes';

export function usePositionLedger(
  instrumentId: string,
  currency: CurrencyCode,
  manual: readonly ManualTransaction[],
): LedgerState {
  const transactions = useTransactions();
  const entries = useMemo(
    () =>
      transactions.data === undefined
        ? null
        : sortNewestFirst([
            ...ledgerFromDtos(transactions.data, instrumentId),
            ...ledgerFromManual(manual, currency),
          ]),
    [transactions.data, instrumentId, manual, currency],
  );

  if (transactions.isError) {
    return {
      status: 'error',
      message: transactions.error.message,
      retry: () => {
        void transactions.refetch();
      },
    };
  }
  return entries === null ? { status: 'loading' } : { status: 'ready', entries };
}
