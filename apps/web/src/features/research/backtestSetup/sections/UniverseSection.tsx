import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import type {
  BacktestConfigDto,
  DataCoverageDto,
  InstrumentDto,
  MarketDto,
} from '../../../../data/schemas';
import { humanizeToken, pluralize } from '../../../../shared/format';
import styles from '../BacktestSetup.module.scss';

export interface UniverseSectionProps {
  readonly instruments: readonly InstrumentDto[];
  readonly markets: readonly MarketDto[];
  readonly config: BacktestConfigDto;
  readonly coverage: readonly DataCoverageDto[];
  readonly onChange: (instrumentIds: readonly string[]) => void;
}

// UI spec 7.9 — markets and instruments to include, with the history each one actually has.
export function UniverseSection({
  instruments,
  markets,
  config,
  coverage,
  onChange,
}: UniverseSectionProps): ReactElement {
  const [marketFilter, setMarketFilter] = useState('all');
  const selected = config.instrumentIds.map(String);
  const visible = useMemo(
    () =>
      instruments.filter(
        (instrument) => marketFilter === 'all' || instrument.marketId === marketFilter,
      ),
    [instruments, marketFilter],
  );
  const selectedMarkets = [
    ...new Set(
      selected.flatMap((id) => {
        const marketId = instruments.find((item) => item.id === id)?.marketId;
        return marketId === undefined ? [] : [marketId];
      }),
    ),
  ];

  const toggle = (instrumentId: string, checked: boolean): void => {
    onChange(checked ? [...selected, instrumentId] : selected.filter((id) => id !== instrumentId));
  };

  return (
    <Card
      title="Markets and instruments"
      extra={
        <span className={styles.note}>
          {pluralize(selected.length, 'instrument')} in{' '}
          {pluralize(selectedMarkets.length, 'market')}
        </span>
      }
    >
      <div className={styles.toolbar}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Market</span>
          <select
            className={styles.input}
            value={marketFilter}
            onChange={(event) => {
              setMarketFilter(event.target.value);
            }}
          >
            <option value="all">All markets</option>
            {markets.map((market) => (
              <option key={market.marketId} value={market.marketId}>
                {market.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => {
            onChange([...new Set([...selected, ...visible.map((item) => String(item.id))])]);
          }}
        >
          Select all shown
        </button>
        <button
          type="button"
          className={styles.textButton}
          disabled={selected.length === 0}
          onClick={() => {
            onChange([]);
          }}
        >
          Clear selection
        </button>
      </div>
      <ul className={styles.instrumentList}>
        {visible.map((instrument) => {
          const id = String(instrument.id);
          const history = coverage.find((item) => item.instrumentId === instrument.id);
          return (
            <li key={id}>
              <label className={styles.instrumentRow}>
                <input
                  type="checkbox"
                  checked={selected.includes(id)}
                  onChange={(event) => {
                    toggle(id, event.target.checked);
                  }}
                />
                <span className={styles.stack}>
                  <strong>{instrument.symbol}</strong>
                  <span className={styles.meta}>
                    {instrument.name} · {instrument.marketId} · {humanizeToken(instrument.type)}
                  </span>
                </span>
                {history !== undefined && (
                  <span className={styles.badges}>
                    <Badge variant="neutral">
                      {history.firstDate} to {history.lastDate}
                    </Badge>
                    {history.estimatedBars > 0 && (
                      <Badge variant="warning">
                        {pluralize(history.estimatedBars, 'estimated bar')}
                      </Badge>
                    )}
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
