import { Badge, Card, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { moneyFromDto } from '../../../data/api';
import type { NetWorthViewDto } from '../../../data/schemas';
import { formatMoney, formatPercentage } from '../../../shared/format';
import styles from '../NetWorth.module.scss';

function Total({
  label,
  value,
  note,
  isBig = false,
}: {
  readonly label: string;
  readonly value: NetWorthViewDto['totals']['netWorth'];
  readonly note?: string;
  readonly isBig?: boolean;
}): ReactElement {
  return (
    <span className={styles.stack}>
      <span className={styles.label}>{label}</span>
      <span className={isBig ? styles.big : styles.value}>{formatMoney(moneyFromDto(value))}</span>
      {note !== undefined && <span className={styles.meta}>{note}</span>}
    </span>
  );
}

// Totals, the read-only notice and the employer exposure (requirements 25; UI spec 19.1).
export function NetWorthSummary({ view }: { readonly view: NetWorthViewDto }): ReactElement {
  const { totals, employer } = view;
  const assets = Number(totals.assets.amount);
  const share = (amount: string): string =>
    assets <= 0
      ? ''
      : `${formatPercentage((Number(amount) / assets) * 100, { decimals: 0, signed: false })} of assets`;
  const stale = view.assets.filter((row) => row.isStale).length;
  const unverified = view.assets.filter((row) => !row.asset.verified).length;

  return (
    <div className={styles.page}>
      <div className={styles.readOnly} role="note">
        <strong className={styles.note}>Nothing on this screen can be traded.</strong>
        <span className={styles.meta}>
          Strategies, signals and orders never read or act on these records. They are here so the
          whole picture — not just the brokerage slice — is measured.
        </span>
      </div>

      <Card title="What you own and owe">
        <div className={styles.stack}>
          <div className={styles.totals}>
            <Total label="Net worth" value={totals.netWorth} isBig />
            <Total label="Assets" value={totals.assets} />
            <Total label="Liabilities" value={totals.liabilities} />
            <Total
              label="Market-exposed"
              value={totals.marketExposed}
              note={share(totals.marketExposed.amount)}
            />
            <Total
              label="Non-market"
              value={totals.nonMarket}
              note={share(totals.nonMarket.amount)}
            />
            <Total
              label="Brokerage portfolio"
              value={view.brokerage.value}
              note={`${String(view.brokerage.holdings)} holdings, at today's prices`}
            />
          </div>
          <span className={styles.inline}>
            {stale > 0 && (
              <Badge variant="warning">
                {stale === 1
                  ? '1 record due for an update'
                  : `${String(stale)} records due for an update`}
              </Badge>
            )}
            {unverified > 0 && (
              <Badge variant="info">
                {unverified === 1
                  ? '1 value never verified'
                  : `${String(unverified)} values never verified`}
              </Badge>
            )}
            <span className={styles.meta}>
              Market-exposed counts the brokerage portfolio, employer equity and gold. Figures in{' '}
              {view.currency} at today&apos;s rates.
            </span>
          </span>
        </div>
      </Card>

      {employer !== null && (
        <Card
          title={`${employer.employer}: one exposure`}
          extra={
            <Badge variant={employer.breached ? 'critical' : 'positive'}>
              {formatPercentage(employer.combinedSharePercent, { decimals: 1, signed: false })} of
              net worth
            </Badge>
          }
        >
          <div className={styles.stack}>
            <div className={styles.totals}>
              <Total label="Vested equity" value={employer.vestedEquity} />
              <Total label="Unvested equity" value={employer.unvestedEquity} />
              <Total label="A year's salary" value={employer.annualSalary} />
              <Total label="Combined" value={employer.combined} />
            </div>
            <p className={cx(styles.note, employer.breached ? styles.negative : undefined)}>
              If {employer.employer} failed, its shares and your salary would go together, so they
              are counted as one exposure: vested and unvested equity plus a year&apos;s salary.
              {employer.breached
                ? ` That is above the ${String(employer.limitPercent)}% limit.`
                : ` That is within the ${String(employer.limitPercent)}% limit.`}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
