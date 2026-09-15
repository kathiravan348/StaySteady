// Holdings table columns (UI spec 7.2). Base-currency columns total up in group rows (UI spec 9).

import { Badge } from '@staysteady/ui';
import type { ColumnDef, Row } from '@staysteady/ui';
import { Decimal } from 'decimal.js';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { positionDetailPath } from '../../../../routes/routes';
import {
  formatMoney,
  formatNumber,
  formatSignedMoney,
  formatSignedPercent,
  pluralize,
} from '../../../../shared/format';
import type { MarketSessionState } from '../../../../shared/marketTime';
import type { Money } from '../../../../shared/money';
import { createMoney } from '../../../../shared/money';
import type { BaseCurrencyCode } from '../../../../shared/types/currency';
import styles from '../HoldingsPage.module.scss';
import type { BaseMoney, HoldingRow } from '../model/holdingTypes';
import { TaxStatusBadge } from '../sections/TaxStatusBadge';

type HoldingColumn = ColumnDef<HoldingRow, unknown>;

// Colour is never the only signal: moves carry an arrow and a sign (UI spec 4).
const ARROWS: Readonly<Record<HoldingRow['direction'], string>> = {
  positive: '▲',
  negative: '▼',
  neutral: '■',
};

const MARKET_STATE_NOTE: Readonly<Record<MarketSessionState, string | null>> = {
  open: null,
  'pre-open': 'Pre-open',
  'post-close': 'After hours',
  closed: 'Closed, last price',
  holiday: 'Holiday, last price',
};

function sumOf(
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

function signClass(value: number): string | undefined {
  if (value > 0) {
    return styles.positive;
  }
  return value < 0 ? styles.negative : styles.neutral;
}

function signedMoney(money: Money): ReactElement {
  return <span className={signClass(money.amount.toNumber())}>{formatSignedMoney(money)}</span>;
}

function gainStack(gain: Money, percent: number): ReactElement {
  return (
    <span className={styles.valueStack}>
      {signedMoney(gain)}
      <span className={signClass(percent)}>{formatSignedPercent(percent)}</span>
    </span>
  );
}

const numeric = (label: string): NonNullable<HoldingColumn['meta']> => ({ align: 'end', label });

export function createHoldingColumns(baseCurrency: BaseCurrencyCode): readonly HoldingColumn[] {
  return [
    {
      id: 'instrument',
      header: 'Instrument',
      accessorFn: (row) => `${row.instrument.symbol} ${row.instrument.name}`,
      sortingFn: (a, b) => a.original.instrument.symbol.localeCompare(b.original.instrument.symbol),
      enableHiding: false,
      meta: { label: 'Instrument' },
      cell: ({ row }) => (
        <span className={styles.stackCell}>
          <Link
            to={positionDetailPath(row.original.instrument.id)}
            className={styles.instrumentLink}
          >
            {row.original.instrument.symbol}
          </Link>
          <span className={styles.meta}>{row.original.instrument.name}</span>
        </span>
      ),
    },
    {
      id: 'market',
      header: 'Market',
      accessorFn: (row) => row.marketName,
      meta: { label: 'Market' },
      cell: ({ row }) => {
        const state = row.original.marketState;
        const note = state === null ? null : MARKET_STATE_NOTE[state];
        return (
          <span className={styles.stackCell}>
            <span>
              {row.original.marketName} ({row.original.instrument.marketId})
            </span>
            {note !== null && <span className={styles.meta}>{note}</span>}
          </span>
        );
      },
    },
    {
      id: 'country',
      header: 'Country',
      accessorFn: (row) => row.country,
      meta: { label: 'Country' },
    },
    {
      id: 'currency',
      header: 'Currency',
      accessorFn: (row) => row.instrument.currency,
      meta: { label: 'Currency' },
    },
    { id: 'type', header: 'Type', accessorFn: (row) => row.typeLabel, meta: { label: 'Type' } },
    {
      id: 'broker',
      header: 'Broker',
      accessorFn: (row) => row.brokerName,
      meta: { label: 'Broker' },
    },
    {
      id: 'strategy',
      header: 'Strategy',
      accessorFn: (row) => row.strategyName,
      meta: { label: 'Strategy' },
    },
    {
      id: 'quantity',
      header: 'Quantity',
      accessorFn: (row) => row.quantity,
      meta: numeric('Quantity'),
      cell: ({ row }) =>
        formatNumber(row.original.quantity, {
          decimals: Number.isInteger(row.original.quantity) ? 0 : 4,
        }),
    },
    {
      id: 'averageCost',
      header: 'Avg cost',
      accessorFn: (row) => row.averageCost.amount.toNumber(),
      meta: numeric('Average cost'),
      cell: ({ row }) => formatMoney(row.original.averageCost, { showCurrency: 'code' }),
    },
    {
      id: 'price',
      header: 'Price / today',
      accessorFn: (row) => row.changePercent,
      meta: numeric('Price and change today'),
      cell: ({ row }) => (
        <span className={styles.valueStack}>
          <span>{formatMoney(row.original.lastPrice, { showCurrency: 'code' })}</span>
          <span className={styles[row.original.direction]}>
            {ARROWS[row.original.direction]} {formatSignedPercent(row.original.changePercent)}
          </span>
        </span>
      ),
    },
    {
      id: 'valueLocal',
      header: 'Value (local)',
      accessorFn: (row) => row.valueLocal.amount.toNumber(),
      meta: numeric('Value (local currency)'),
      cell: ({ row }) => formatMoney(row.original.valueLocal, { showCurrency: 'code' }),
    },
    {
      id: 'valueBase',
      header: `Value (${baseCurrency})`,
      accessorFn: (row) => row.valueBase.amount.toNumber(),
      meta: numeric('Value (base currency)'),
      cell: ({ row }) => formatMoney(row.original.valueBase),
      aggregatedCell: ({ row }) => {
        const total = sumOf(row.getLeafRows(), (holding) => holding.valueBase);
        return total === null ? null : <strong>{formatMoney(total)}</strong>;
      },
    },
    {
      id: 'gain',
      header: `Unrealised (${baseCurrency})`,
      accessorFn: (row) => row.gainBase.amount.toNumber(),
      meta: numeric('Unrealised gain or loss'),
      cell: ({ row }) => gainStack(row.original.gainBase, row.original.gainPercent),
      aggregatedCell: ({ row }) => {
        const leaves = row.getLeafRows();
        const gain = sumOf(leaves, (holding) => holding.gainBase);
        const cost = sumOf(leaves, (holding) => holding.costBase);
        if (gain === null || cost === null) {
          return null;
        }
        const percent = cost.amount.isZero()
          ? 0
          : gain.amount.dividedBy(cost.amount).times(100).toDecimalPlaces(2).toNumber();
        return gainStack(gain, percent);
      },
    },
    {
      id: 'currencyEffect',
      header: 'Currency effect',
      accessorFn: (row) => row.currencyEffectBase.amount.toNumber(),
      meta: numeric('Currency effect'),
      cell: ({ row }) => signedMoney(row.original.currencyEffectBase),
      aggregatedCell: ({ row }) => {
        const total = sumOf(row.getLeafRows(), (holding) => holding.currencyEffectBase);
        return total === null ? null : signedMoney(total);
      },
    },
    {
      id: 'weight',
      header: 'Weight',
      accessorFn: (row) => row.weightPercent,
      meta: numeric('Portfolio weight'),
      cell: ({ row }) => (
        <span className={styles.valueStack}>
          <span>{row.original.weightPercent.toFixed(1)}%</span>
          <span className={styles.sizeTrack} aria-hidden="true">
            <span
              className={styles.sizeFill}
              style={{ width: `${Math.round(row.original.sizeRatio * 100)}%` }}
            />
          </span>
        </span>
      ),
      aggregatedCell: ({ row }) =>
        `${row
          .getLeafRows()
          .reduce((sum, leaf) => sum + leaf.original.weightPercent, 0)
          .toFixed(1)}%`,
    },
    {
      id: 'daysHeld',
      header: 'Held',
      accessorFn: (row) => row.daysHeld,
      meta: numeric('Days held'),
      cell: ({ row }) => pluralize(row.original.daysHeld, 'day'),
    },
    {
      id: 'tax',
      header: 'Tax status',
      accessorFn: (row) => row.tax.kind,
      meta: { label: 'Holding-period tax status' },
      cell: ({ row }) => <TaxStatusBadge status={row.original.tax} />,
    },
    {
      id: 'exit',
      header: 'Exit level',
      accessorFn: (row) => row.exit?.distancePercent ?? Number.POSITIVE_INFINITY,
      meta: numeric('Exit level and distance'),
      cell: ({ row }) => {
        const { exit } = row.original;
        if (exit === null) {
          return <span className={styles.meta}>Not set</span>;
        }
        return (
          <span className={styles.valueStack}>
            <span>{formatMoney(exit.level, { showCurrency: 'code' })}</span>
            <span className={styles.exitDistance}>
              {exit.distancePercent.toFixed(1)}% away
              {exit.proximity !== 'clear' && (
                <Badge variant={exit.proximity === 'near' ? 'critical' : 'warning'}>
                  {exit.proximity === 'near' ? 'Near exit' : 'Watch'}
                </Badge>
              )}
            </span>
          </span>
        );
      },
    },
    {
      id: 'news',
      header: 'News',
      accessorFn: (row) => row.newsStories,
      meta: { label: 'News stories' },
      cell: ({ row }) =>
        row.original.newsStories === 0 ? (
          <span className={styles.meta}>None</span>
        ) : (
          <Badge variant={row.original.hasHighImportanceNews ? 'warning' : 'neutral'}>
            {pluralize(row.original.newsStories, 'story', 'stories')}
          </Badge>
        ),
    },
  ];
}
