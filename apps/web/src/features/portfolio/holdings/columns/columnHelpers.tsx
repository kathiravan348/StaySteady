// Shared pieces of the holdings columns (UI spec 7.2): sign styling, group totals and cell stacks.

import type { ColumnDef, Row } from '@staysteady/ui';
import { Decimal } from 'decimal.js';
import type { ReactElement } from 'react';

import { formatSignedMoney, formatSignedPercent } from '../../../../shared/format';
import type { MarketSessionState } from '../../../../shared/marketTime';
import type { Money } from '../../../../shared/money';
import { createMoney } from '../../../../shared/money';
import styles from '../HoldingsPage.module.scss';
import type { BaseMoney, HoldingRow } from '../model/holdingTypes';

type HoldingColumn = ColumnDef<HoldingRow, unknown>;

// Colour is never the only signal: moves carry an arrow and a sign (UI spec 4).
export const ARROWS: Readonly<Record<HoldingRow['direction'], string>> = {
  positive: '▲',
  negative: '▼',
  neutral: '■',
};

export const MARKET_STATE_NOTE: Readonly<Record<MarketSessionState, string | null>> = {
  open: null,
  'pre-open': 'Pre-open',
  'post-close': 'After hours',
  closed: 'Closed, last price',
  holiday: 'Holiday, last price',
};

export function sumOf(
  rows: readonly Row<HoldingRow>[],
  pick: (row: HoldingRow) => BaseMoney,
): BaseMoney | null {
  const first = rows[0];
  if (first === undefined) {
    return null;
  }
  const total = rows.reduce((sum, row) => sum.plus(pick(row.original).amount), new Decimal(0));
  return createMoney(total, pick(first.original).currency);
}

export function signClass(value: number): string | undefined {
  if (value > 0) {
    return styles.positive;
  }
  return value < 0 ? styles.negative : styles.neutral;
}

export function signedMoney(money: Money): ReactElement {
  return <span className={signClass(money.amount.toNumber())}>{formatSignedMoney(money)}</span>;
}

export function gainStack(gain: Money, percent: number): ReactElement {
  return (
    <span className={styles.valueStack}>
      {signedMoney(gain)}
      <span className={signClass(percent)}>{formatSignedPercent(percent)}</span>
    </span>
  );
}

export const numeric = (label: string): NonNullable<HoldingColumn['meta']> => ({
  align: 'end',
  label,
});
