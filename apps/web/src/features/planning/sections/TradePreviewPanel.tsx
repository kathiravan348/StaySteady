import { Badge, Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { moneyFromDto, useTradePreview } from '../../../data/api';
import type { AllocationRowDto, InstrumentDto, TradePreviewDto } from '../../../data/schemas';
import { formatMoney } from '../../../shared/format';
import { DIMENSION_LABELS, STATUS } from '../model/planningModel';
import styles from '../Planning.module.scss';

export interface TradeDraft {
  readonly instrumentId: string;
  readonly side: 'buy' | 'sell';
  readonly quantity: string;
}

function Shift({
  before,
  after,
}: {
  readonly before: readonly AllocationRowDto[];
  readonly after: readonly AllocationRowDto[];
}): ReactElement {
  const keys = [...new Set([...before, ...after].map((row) => row.key))];
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Bucket</th>
            <th scope="col" className={styles.end}>
              Now
            </th>
            <th scope="col" className={styles.end}>
              After
            </th>
            <th scope="col" className={styles.end}>
              Target
            </th>
            <th scope="col">Status after</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const old = before.find((row) => row.key === key);
            const next = after.find((row) => row.key === key);
            const row = next ?? old;
            if (row === undefined) return null;
            return (
              <tr key={key}>
                <th scope="row">{row.label}</th>
                <td className={styles.end}>{(old?.actualPercent ?? 0).toFixed(1)}%</td>
                <td className={styles.end}>{(next?.actualPercent ?? 0).toFixed(1)}%</td>
                <td className={styles.end}>
                  {row.targetPercent === null ? '—' : `${row.targetPercent.toFixed(1)}%`}
                </td>
                <td>
                  {next === undefined ? (
                    'None held'
                  ) : (
                    <Badge variant={STATUS[next.status].variant}>{STATUS[next.status].label}</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// UI spec 7.17 — model a proposed trade before committing: its cost and its effect on every
// allocation dimension against the targets. A preview only; there is no order button.
export function TradePreviewPanel({
  instruments,
  initial,
}: {
  readonly instruments: readonly InstrumentDto[];
  readonly initial: TradeDraft;
}): ReactElement {
  const preview = useTradePreview();
  const [draft, setDraft] = useState<TradeDraft>(initial);
  const valid =
    draft.instrumentId !== '' &&
    /^\d+(\.\d{1,8})?$/.test(draft.quantity) &&
    Number(draft.quantity) > 0;
  const data: TradePreviewDto | undefined = preview.data;

  return (
    <Card
      title="Preview a trade"
      extra={<span className={styles.meta}>Nothing is ordered from here</span>}
    >
      <div className={styles.stack}>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Instrument</span>
            <select
              className={styles.input}
              value={draft.instrumentId}
              onChange={(event) => {
                setDraft({ ...draft, instrumentId: event.target.value });
              }}
            >
              <option value="">Choose an instrument</option>
              {instruments.map((item) => (
                <option key={String(item.id)} value={String(item.id)}>
                  {item.symbol} · {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Direction</span>
            <select
              className={styles.input}
              value={draft.side}
              onChange={(event) => {
                setDraft({ ...draft, side: event.target.value === 'sell' ? 'sell' : 'buy' });
              }}
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Quantity</span>
            <input
              className={styles.input}
              inputMode="decimal"
              value={draft.quantity}
              onChange={(event) => {
                setDraft({ ...draft, quantity: event.target.value });
              }}
            />
          </label>
          <Button
            isDisabled={!valid}
            isLoading={preview.isPending}
            onPress={() => {
              preview.mutate({ currency: 'USD', ...draft });
            }}
          >
            Preview
          </Button>
        </div>
        {!valid && <p className={styles.meta}>Choose an instrument and a quantity above zero.</p>}
        {preview.isError && <p className={styles.warning}>{preview.error.message}</p>}

        {data !== undefined && (
          <div className={styles.stack}>
            <p className={styles.note}>
              {data.side === 'buy' ? 'Buying' : 'Selling'} {data.quantity} {data.symbol} at the
              latest close of {formatMoney(moneyFromDto(data.price))} is about{' '}
              <strong>{formatMoney(moneyFromDto(data.value))}</strong>, with an estimated cost of{' '}
              <strong>{formatMoney(moneyFromDto(data.estimatedCost))}</strong>.
            </p>
            <ul className={styles.list}>
              {data.costBreakdown.map((item) => (
                <li key={item.label} className={styles.meta}>
                  {item.label}: {formatMoney(moneyFromDto(item.amount))}
                </li>
              ))}
            </ul>
            {data.warnings.length > 0 && (
              <ul className={styles.list} aria-label="Warnings">
                {data.warnings.map((warning) => (
                  <li key={warning} className={styles.warning}>
                    {warning}
                  </li>
                ))}
              </ul>
            )}
            {data.after.map((dimension) => (
              <div key={dimension.dimension} className={styles.stack}>
                <strong className={styles.note}>{DIMENSION_LABELS[dimension.dimension]}</strong>
                <Shift
                  before={
                    data.before.find((item) => item.dimension === dimension.dimension)?.rows ?? []
                  }
                  after={dimension.rows}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
