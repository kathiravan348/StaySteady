import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { moneyFromDto } from '../../../data/api';
import type {
  AllocationDimensionDto,
  AllocationViewDto,
  ReportCurrencyDto,
} from '../../../data/schemas';
import { formatMoney } from '../../../shared/format';
import { BASE_CURRENCIES } from '../../../shared/types/currency';
import { ToggleGroup } from '../../../shared/ui/ToggleGroup';
import { ROUTES } from '../../../routes/routes';
import { DIMENSION_LABELS, DIMENSION_OPTIONS } from '../model/planningModel';
import styles from '../Planning.module.scss';
import { AllocationTargets } from './AllocationTargets';

export function AllocationView({
  view,
  currency,
  onCurrencyChange,
}: {
  readonly view: AllocationViewDto;
  readonly currency: ReportCurrencyDto | null;
  readonly onCurrencyChange: (currency: ReportCurrencyDto) => void;
}): ReactElement {
  const [dimension, setDimension] = useState<AllocationDimensionDto>('type');

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.stack}>
          <span className={styles.fieldLabel}>Invested value at {view.asOf}</span>
          <span className={styles.value}>{formatMoney(moneyFromDto(view.total))}</span>
        </span>
        <span className={styles.inline}>
          <ToggleGroup
            label="Allocation dimension"
            options={DIMENSION_OPTIONS}
            value={dimension}
            onChange={setDimension}
            formatOption={(option) => DIMENSION_LABELS[option]}
          />
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Currency</span>
            <select
              className={styles.input}
              value={currency ?? view.currency}
              onChange={(event) => {
                const next = BASE_CURRENCIES.find((code) => code === event.target.value);
                if (next !== undefined) onCurrencyChange(next);
              }}
            >
              {BASE_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </span>
      </div>

      <AllocationTargets
        key={`${dimension}-${view.savedAt}`}
        view={view}
        dimension={dimension}
        currency={currency}
      />

      <Card
        title="Suggested corrective trades"
        extra={<span className={styles.meta}>{view.suggestions.length} suggestions</span>}
      >
        {view.suggestions.length === 0 ? (
          <p className={styles.note}>
            Everything with a target is within tolerance. No trades are suggested.
          </p>
        ) : (
          <ul className={styles.list}>
            {view.suggestions.map((trade) => (
              <li key={trade.id} className={styles.item}>
                <span className={styles.inline}>
                  <Badge variant={trade.side === 'buy' ? 'info' : 'warning'}>
                    {trade.side === 'buy' ? 'Buy' : 'Sell'}
                  </Badge>
                  <strong className={styles.note}>
                    {trade.symbol === null
                      ? `${formatMoney(moneyFromDto(trade.value))} of ${trade.bucket}`
                      : `${trade.quantity ?? ''} ${trade.symbol}`}
                  </strong>
                  <span className={styles.meta}>
                    {DIMENSION_LABELS[trade.dimension]} · about{' '}
                    {formatMoney(moneyFromDto(trade.value))} · estimated cost{' '}
                    {formatMoney(moneyFromDto(trade.estimatedCost))}
                  </span>
                </span>
                <p className={styles.meta}>{trade.reason}</p>
                {trade.instrumentId !== null && trade.quantity !== null && (
                  <Link
                    className={styles.meta}
                    to={`${ROUTES.PLANNING_SCENARIOS}?instrument=${encodeURIComponent(trade.instrumentId)}&side=${trade.side}&quantity=${encodeURIComponent(trade.quantity)}`}
                  >
                    Preview this trade&apos;s effect on every dimension
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="About these numbers">
        <ul className={styles.list}>
          {view.notes.map((note) => (
            <li key={note} className={styles.note}>
              {note}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
