// Transactions (UI spec 15 and nav map 6): every deposit, purchase, dividend and charge, with fees,
// currency conversions, and each amount in the base currency on the day it happened.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import {
  useBrokers,
  useFxHistories,
  useInstruments,
  usePortfolioHoldings,
  useTransactions,
} from '../../data/api';
import { useSystemState } from '../../providers/SystemStateProvider';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { buildTransactionRows } from './transactions/model/transactionRows';
import { TransactionsView } from './transactions/sections/TransactionsView';

function TransactionsBody(): ReactElement {
  const { baseCurrency } = useSystemState();
  const transactions = useTransactions();
  const instruments = useInstruments();
  const holdings = usePortfolioHoldings();
  const brokers = useBrokers();
  const fx = useFxHistories();
  const queries = [transactions, instruments, holdings, brokers, fx];

  const rows = useMemo(
    () =>
      transactions.data === undefined ||
      instruments.data === undefined ||
      holdings.data === undefined ||
      brokers.data === undefined ||
      fx.data === undefined
        ? null
        : buildTransactionRows({
            transactions: transactions.data,
            instruments: instruments.data,
            holdings: holdings.data,
            brokers: brokers.data,
            fxHistories: fx.data,
            baseCurrency,
          }),
    [transactions.data, instruments.data, holdings.data, brokers.data, fx.data, baseCurrency],
  );

  const failed = queries.find((query) => query.isError);
  if (failed !== undefined) {
    return (
      <ErrorState
        title="Transactions unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          queries.forEach((query) => {
            void query.refetch();
          });
        }}
      />
    );
  }
  if (rows === null) return <LoadingState layout="table" count={8} />;
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Deposits, purchases, dividends and charges appear here as they happen."
      />
    );
  }
  return <TransactionsView rows={rows} baseCurrency={baseCurrency} />;
}

export function PortfolioTransactionsPage(): ReactElement {
  return (
    <PageShell
      title="Transactions"
      description="Deposits, purchases, dividends, fees and conversion charges, with each amount in your base currency at the rate on the day."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Portfolio', to: ROUTES.PORTFOLIO_HOLDINGS },
        { label: 'Transactions' },
      ]}
    >
      <TransactionsBody />
    </PageShell>
  );
}
