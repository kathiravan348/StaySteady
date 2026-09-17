import { Badge, Button, DataTable, NoResultsState, cx } from '@staysteady/ui';
import type { BadgeVariant, ColumnDef } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { formatMoney, formatPercentage } from '../../../../shared/format';
import type { BaseCurrencyCode } from '../../../../shared/types/currency';
import type { IsoUtcTimestamp } from '../../../../shared/types/dateTime';
import { PriceFreshnessBar } from '../../../../shared/ui/PriceFreshnessBar';
import { positionDetailPath } from '../../../../routes/routes';
import type { ExitHandling, PositionRow, StopProximity } from '../model/positionRows';
import { EXIT_HANDLINGS, EXIT_HANDLING_LABELS, sumBase } from '../model/positionRows';
import { AttentionBanner } from './AttentionBanner';
import { PositionDetail } from './PositionDetail';
import styles from '../Positions.module.scss';

const ALL = 'all';
const HANDLING_VARIANT: Readonly<Record<ExitHandling, BadgeVariant>> = {
  automatic: 'positive',
  approval: 'info',
  none: 'warning',
};
const PROXIMITY_VARIANT: Readonly<Record<StopProximity, BadgeVariant>> = {
  near: 'critical',
  watch: 'warning',
  clear: 'neutral',
  'no-stop': 'neutral',
};

const getRowId = (row: PositionRow): string => row.id;

export interface PositionsViewProps {
  readonly rows: readonly PositionRow[];
  readonly baseCurrency: BaseCurrencyCode;
  readonly heldMarketIds: ReadonlySet<string>;
  readonly oldestQuoteTimestamp: IsoUtcTimestamp | null;
  readonly ordersUnavailable: boolean;
}

export function PositionsView({
  rows,
  baseCurrency,
  heldMarketIds,
  oldestQuoteTimestamp,
  ordersUnavailable,
}: PositionsViewProps): ReactElement {
  const [strategy, setStrategy] = useState<string>(ALL);
  const [handling, setHandling] = useState<ExitHandling | typeof ALL>(ALL);
  const strategies = [
    ...new Map(rows.map((row) => [String(row.strategy.id), row.strategy])).values(),
  ];
  const visible = rows.filter(
    (row) =>
      (strategy === ALL || String(row.strategy.id) === strategy) &&
      (handling === ALL || row.exitHandling === handling),
  );
  const dropToStops = sumBase(
    rows.flatMap((row) => (row.dropToStopBase === null ? [] : [row.dropToStopBase])),
    baseCurrency,
  );

  const columns = useMemo<ColumnDef<PositionRow, unknown>[]>(
    () => [
      {
        id: 'instrument',
        header: 'Instrument',
        accessorFn: (row) => row.instrument.symbol,
        cell: ({ row }) => (
          <Link className={styles.link} to={positionDetailPath(String(row.original.instrument.id))}>
            {row.original.instrument.symbol}
          </Link>
        ),
      },
      { id: 'strategy', header: 'Strategy', accessorFn: (row) => row.strategy.name },
      {
        id: 'handling',
        header: 'At the stop',
        accessorFn: (row) => row.exitHandling,
        cell: ({ row }) => (
          <Badge variant={HANDLING_VARIANT[row.original.exitHandling]}>
            {EXIT_HANDLING_LABELS[row.original.exitHandling]}
          </Badge>
        ),
      },
      {
        id: 'value',
        header: `Value (${baseCurrency})`,
        accessorFn: (row) => row.valueBase.amount.toNumber(),
        meta: { align: 'end', label: 'Value' },
        cell: ({ row }) => formatMoney(row.original.valueBase),
      },
      {
        id: 'gain',
        header: 'Gain or loss',
        accessorFn: (row) => row.gainPercent,
        meta: { align: 'end', label: 'Gain or loss' },
        cell: ({ row }) => (
          <span
            className={
              row.original.gainLocal.amount.isNegative() ? styles.negative : styles.positive
            }
          >
            {formatMoney(row.original.gainLocal, { signed: true })} (
            {formatPercentage(row.original.gainPercent, { decimals: 2, signed: true })})
          </span>
        ),
      },
      {
        id: 'stop',
        header: 'Stop',
        accessorFn: (row) => row.stop?.amount.toNumber() ?? 0,
        meta: { align: 'end', label: 'Stop' },
        cell: ({ row }) => (row.original.stop === null ? '—' : formatMoney(row.original.stop)),
      },
      {
        id: 'distance',
        header: 'Above the stop',
        accessorFn: (row) => row.stopDistancePercent ?? Number.POSITIVE_INFINITY,
        meta: { align: 'end', label: 'Distance to the stop' },
        cell: ({ row }) =>
          row.original.stopDistancePercent === null ? (
            <span className={styles.muted}>No stop</span>
          ) : (
            <Badge variant={PROXIMITY_VARIANT[row.original.proximity]}>
              {row.original.stopDistancePercent < 0
                ? 'Through the stop'
                : formatPercentage(row.original.stopDistancePercent, {
                    decimals: 1,
                    signed: false,
                  })}
            </Badge>
          ),
      },
      {
        id: 'drop',
        header: 'Drop to the stop',
        accessorFn: (row) => row.dropToStopBase?.amount.toNumber() ?? 0,
        meta: { align: 'end', label: 'Value lost if the stop is reached' },
        cell: ({ row }) =>
          row.original.dropToStopBase === null ? '—' : formatMoney(row.original.dropToStopBase),
      },
      {
        id: 'working',
        header: 'Working orders',
        accessorFn: (row) => row.workingOrders.length,
        meta: { align: 'end', label: 'Working orders' },
        cell: ({ row }) =>
          ordersUnavailable ? (
            <span className={styles.muted}>Unknown</span>
          ) : (
            row.original.workingOrders.length
          ),
      },
    ],
    [baseCurrency, ordersUnavailable],
  );

  return (
    <div className={styles.page}>
      <PriceFreshnessBar
        oldestQuoteTimestamp={oldestQuoteTimestamp}
        heldMarketIds={heldMarketIds}
      />
      {ordersUnavailable && (
        <p className={styles.note} role="status">
          Order history is unavailable, so orders still working in these instruments are unknown.
        </p>
      )}
      <AttentionBanner rows={rows} />

      <div className={styles.summary}>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Open positions</span>
          <span className={styles.summaryValue}>{rows.length}</span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Value</span>
          <span className={styles.summaryValue}>
            {formatMoney(
              sumBase(
                rows.map((row) => row.valueBase),
                baseCurrency,
              ),
            )}
          </span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Lost if every stop is reached</span>
          <span
            className={cx(
              styles.summaryValue,
              dropToStops.amount.isNegative() ? styles.negative : undefined,
            )}
          >
            {formatMoney(dropToStops)}
          </span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Near the stop</span>
          <span className={styles.summaryValue}>
            {rows.filter((row) => row.proximity === 'near').length}
          </span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>No automated exit</span>
          <span className={styles.summaryValue}>
            {rows.filter((row) => row.exitHandling === 'none').length}
          </span>
        </span>
      </div>
      <p className={styles.meta}>
        Only positions a strategy opened are here; Holdings lists everything you own. Values use the
        live price and today&apos;s exchange rate; gain or loss is in each instrument&apos;s
        currency.
      </p>

      <div className={styles.filterBar}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Strategy</span>
          <select
            className={styles.input}
            value={strategy}
            onChange={(event) => {
              setStrategy(event.target.value);
            }}
          >
            <option value={ALL}>Any strategy</option>
            {strategies.map((item) => (
              <option key={String(item.id)} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>At the stop</span>
          <select
            className={styles.input}
            value={handling}
            onChange={(event) => {
              const next = EXIT_HANDLINGS.find((key) => key === event.target.value);
              setHandling(next ?? ALL);
            }}
          >
            <option value={ALL}>Any exit handling</option>
            {EXIT_HANDLINGS.map((key) => (
              <option key={key} value={key}>
                {EXIT_HANDLING_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <span className={styles.meta}>
          Showing {visible.length} of {rows.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <NoResultsState
          title="No positions match these filters"
          description="Clear the filters to see every automated position."
          action={
            <Button
              variant="secondary"
              onPress={() => {
                setStrategy(ALL);
                setHandling(ALL);
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <DataTable
          data={visible}
          columns={columns}
          getRowId={getRowId}
          ariaLabel="Automated positions"
          pageSize={20}
          renderRowDetails={(row) => <PositionDetail row={row} />}
        />
      )}
    </div>
  );
}
