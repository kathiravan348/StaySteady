// Position Detail view model types (UI spec 7.3).

import type { TransactionTypeDto } from '../../../../data/schemas';
import type { Money } from '../../../../shared/money';
import type { BaseCurrencyCode } from '../../../../shared/types/currency';

// One transaction for this instrument, from the portfolio ledger or added manually in this session.
export interface LedgerEntry {
  readonly id: string;
  // Calendar date (YYYY-MM-DD) the transaction happened.
  readonly date: string;
  readonly type: TransactionTypeDto;
  readonly quantity: number | null;
  readonly unitPrice: Money | null;
  readonly fees: Money;
  readonly netAmount: Money;
  readonly notes: string;
  readonly isManual: boolean;
}

export type LedgerState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string; readonly retry: () => void }
  | { readonly status: 'ready'; readonly entries: readonly LedgerEntry[] };

// A cost or income item, converted at the exchange rate on its own date.
export interface CashFlowItem {
  readonly id: string;
  readonly date: string;
  readonly label: string;
  readonly amount: Money;
  readonly amountBase: Money<BaseCurrencyCode>;
  readonly isManual: boolean;
}

export interface CashFlowSummary {
  readonly items: readonly CashFlowItem[];
  readonly totalBase: Money<BaseCurrencyCode>;
}
