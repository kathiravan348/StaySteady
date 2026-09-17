// How much of the portfolio each broker or custodian holds, against the over-weight share and the
// protection scheme's cover (E-04; requirements 32; UI spec 19.2; decision 44).

import { Badge, Card, EmptyState, ErrorState, LoadingState, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { moneyFromDto, useCounterpartyExposure } from '../../../data/api';
import type { CounterpartyExposureRowDto } from '../../../data/schemas';
import { ROUTES } from '../../../routes/routes';
import { formatMoney, humanizeToken } from '../../../shared/format';
import riskStyles from '../Risk.module.scss';
import styles from './RiskPanels.module.scss';

function CounterpartyFact({
  row,
  maxSharePercent,
}: {
  readonly row: CounterpartyExposureRowDto;
  readonly maxSharePercent: number;
}): ReactElement {
  const uncovered = row.uncovered === null ? null : moneyFromDto(row.uncovered);
  return (
    <div className={cx(styles.fact, row.isOverWeight ? styles.alert : undefined)}>
      <div className={styles.head}>
        <span className={styles.name}>{row.name}</span>
        {row.isOverWeight ? (
          <Badge variant="warning">Over {String(maxSharePercent)}%</Badge>
        ) : (
          <Badge variant="neutral">{humanizeToken(row.kind)}</Badge>
        )}
      </div>
      <span className={styles.value}>{row.sharePercent.toFixed(1)}%</span>
      <p className={styles.text}>
        {formatMoney(moneyFromDto(row.value))} in {String(row.positions)}{' '}
        {row.positions === 1 ? 'position' : 'positions'} · {row.jurisdiction}
      </p>
      <p className={styles.meta}>
        {row.protectionScheme === null
          ? 'No protection scheme.'
          : row.protectionLimit === null
            ? `${row.protectionScheme}: no fixed limit.`
            : `${row.protectionScheme} covers up to ${formatMoney(moneyFromDto(row.protectionLimit))}${uncovered !== null && uncovered.amount.gt(0) ? `; ${formatMoney(uncovered)} is above it` : ''}.`}{' '}
        {row.protectionNote}
      </p>
    </div>
  );
}

export function CounterpartyExposureSection(): ReactElement {
  const exposure = useCounterpartyExposure();

  const body = ((): ReactElement => {
    if (exposure.isError) {
      return (
        <ErrorState
          title="Counterparty exposure unavailable"
          message={exposure.error.message}
          onRetry={() => {
            void exposure.refetch();
          }}
        />
      );
    }
    if (exposure.data === undefined) return <LoadingState layout="cards" count={3} />;
    if (exposure.data.rows.length === 0) {
      return (
        <EmptyState
          title="Nothing held"
          description="Counterparty exposure appears once a broker holds a position."
        />
      );
    }
    const { rows, maxSharePercent } = exposure.data;
    return (
      <div className={styles.grid}>
        {rows.map((row) => (
          <CounterpartyFact key={row.id} row={row} maxSharePercent={maxSharePercent} />
        ))}
      </div>
    );
  })();

  const overWeight = exposure.data?.rows.filter((row) => row.isOverWeight) ?? [];
  return (
    <Card
      title="Counterparty exposure"
      extra={
        <Link to={ROUTES.SETTINGS_ASSUMPTIONS} className={riskStyles.link}>
          Change the over-weight share
        </Link>
      }
    >
      <div className={styles.stack}>
        <p className={styles.meta}>
          {exposure.data === undefined
            ? 'Share of the portfolio held by each broker or custodian.'
            : overWeight.length > 0
              ? `${overWeight.map((row) => row.name).join(', ')} ${overWeight.length === 1 ? 'holds' : 'hold'} more than ${String(exposure.data.maxSharePercent)}% of the ${formatMoney(moneyFromDto(exposure.data.portfolioValue))} portfolio. A failure there would affect that share at once.`
              : `No counterparty holds more than ${String(exposure.data.maxSharePercent)}% of the portfolio.`}
        </p>
        {body}
      </div>
    </Card>
  );
}
