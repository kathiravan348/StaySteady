import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { moneyFromDto } from '../../../../data/api/mappers';
import { useQuotes } from '../../../../data/api';
import type { InstrumentDto, MarketDto } from '../../../../data/schemas';
import { workspaceTickerPath } from '../../../../routes/routes';
import { formatMoney, formatSignedPercent, humanizeToken } from '../../../../shared/format';
import styles from '../WorkspacePage.module.scss';

export interface InstrumentPanelProps {
  readonly id: string;
  readonly instruments: readonly InstrumentDto[];
  readonly markets: readonly MarketDto[];
  readonly currentId: string;
}

// UI spec 7.4 — collapsible left instrument panel with search and market/type filters.
export function InstrumentPanel({
  id,
  instruments,
  markets,
  currentId,
}: InstrumentPanelProps): ReactElement {
  const [search, setSearch] = useState('');
  const [marketId, setMarketId] = useState('all');
  const [type, setType] = useState('all');
  const ids = useMemo(() => instruments.map((instrument) => instrument.id), [instruments]);
  const quotes = useQuotes(ids);
  const types = useMemo(
    () => [...new Set(instruments.map((instrument) => instrument.type))].sort(),
    [instruments],
  );

  const needle = search.trim().toLowerCase();
  const visible = instruments.filter(
    (instrument) =>
      (marketId === 'all' || instrument.marketId === marketId) &&
      (type === 'all' || instrument.type === type) &&
      (needle === '' ||
        instrument.symbol.toLowerCase().includes(needle) ||
        instrument.name.toLowerCase().includes(needle)),
  );

  return (
    <aside id={id} className={styles.sidePanel} aria-label="Instruments">
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Search instruments</span>
        <input
          type="search"
          className={styles.input}
          value={search}
          placeholder="Symbol or name"
          onChange={(event) => {
            setSearch(event.target.value);
          }}
        />
      </label>
      <div className={styles.filterRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Market</span>
          <select
            className={styles.select}
            value={marketId}
            onChange={(event) => setMarketId(event.target.value)}
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
            className={styles.select}
            value={type}
            onChange={(event) => setType(event.target.value)}
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
      {visible.length === 0 ? (
        <p className={styles.note}>No instruments match these filters.</p>
      ) : (
        <ul className={styles.instrumentList}>
          {visible.map((instrument) => {
            const quote = quotes.data?.find((item) => item.instrumentId === instrument.id);
            const isCurrent = instrument.id === currentId;
            return (
              <li key={instrument.id}>
                <Link
                  to={workspaceTickerPath(instrument.symbol)}
                  className={styles.instrumentLink}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  <span className={styles.stack}>
                    <strong>{instrument.symbol}</strong>
                    <span className={styles.meta}>{instrument.name}</span>
                  </span>
                  {quote !== undefined && (
                    <span className={styles.quoteStack}>
                      <span>
                        {formatMoney(moneyFromDto(quote.lastPrice), { showCurrency: 'code' })}
                      </span>
                      <span className={styles[quote.direction]}>
                        {quote.direction === 'positive'
                          ? '▲'
                          : quote.direction === 'negative'
                            ? '▼'
                            : '■'}{' '}
                        {formatSignedPercent(quote.changePercent)}
                      </span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
