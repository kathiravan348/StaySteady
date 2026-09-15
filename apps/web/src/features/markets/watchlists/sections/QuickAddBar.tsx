import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import type { InstrumentDto, MarketDto } from '../../../../data/schemas';
import { humanizeToken } from '../../../../shared/format';
import styles from '../Watchlists.module.scss';

export interface QuickAddBarProps {
  readonly listName: string;
  readonly instruments: readonly InstrumentDto[];
  readonly markets: readonly MarketDto[];
  readonly existingIds: readonly string[];
  readonly onAdd: (instrumentId: string) => void;
  readonly isBusy: boolean;
}

const RESULT_LIMIT = 8;

// UI spec 7.5 — quick-add search with market and instrument type filters.
export function QuickAddBar({
  listName,
  instruments,
  markets,
  existingIds,
  onAdd,
  isBusy,
}: QuickAddBarProps): ReactElement {
  const [search, setSearch] = useState('');
  const [marketId, setMarketId] = useState('all');
  const [type, setType] = useState('all');
  const types = useMemo(
    () => [...new Set(instruments.map((instrument) => instrument.type))].sort(),
    [instruments],
  );
  const needle = search.trim().toLowerCase();
  const isFiltering = needle !== '' || marketId !== 'all' || type !== 'all';
  const results = instruments
    .filter(
      (instrument) =>
        (marketId === 'all' || instrument.marketId === marketId) &&
        (type === 'all' || instrument.type === type) &&
        (needle === '' ||
          instrument.symbol.toLowerCase().includes(needle) ||
          instrument.name.toLowerCase().includes(needle)),
    )
    .slice(0, RESULT_LIMIT);

  return (
    <section className={styles.quickAdd} aria-label={`Add instruments to ${listName}`}>
      <div className={styles.filterRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Add instrument</span>
          <input
            type="search"
            className={styles.input}
            value={search}
            placeholder="Search symbol or name"
            onChange={(event) => {
              setSearch(event.target.value);
            }}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Market</span>
          <select
            className={styles.input}
            value={marketId}
            onChange={(event) => {
              setMarketId(event.target.value);
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
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Type</span>
          <select
            className={styles.input}
            value={type}
            onChange={(event) => {
              setType(event.target.value);
            }}
          >
            <option value="all">All types</option>
            {types.map((option) => (
              <option key={option} value={option}>
                {humanizeToken(option)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {isFiltering &&
        (results.length === 0 ? (
          <p className={styles.note}>No instruments match. Try another symbol, market or type.</p>
        ) : (
          <ul className={styles.results}>
            {results.map((instrument) => {
              const isInList = existingIds.includes(instrument.id);
              return (
                <li key={instrument.id} className={styles.resultRow}>
                  <span className={styles.stack}>
                    <strong>{instrument.symbol}</strong>
                    <span className={styles.meta}>
                      {instrument.name} · {instrument.marketId} · {humanizeToken(instrument.type)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={styles.textButton}
                    disabled={isInList || isBusy}
                    aria-label={
                      isInList
                        ? `${instrument.symbol} is already in ${listName}`
                        : `Add ${instrument.symbol} to ${listName}`
                    }
                    onClick={() => {
                      onAdd(instrument.id);
                    }}
                  >
                    {isInList ? 'In list' : 'Add'}
                  </button>
                </li>
              );
            })}
          </ul>
        ))}
    </section>
  );
}
