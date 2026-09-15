import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { formatIsoDate, formatMoney } from '../../../../shared/format';
import { toIsoDate } from '../../../../shared/types/dateTime';
import type { CashFlowSummary } from '../model/positionTypes';
import styles from '../PositionPage.module.scss';

export interface CashFlowListProps {
  readonly title: string;
  readonly summary: CashFlowSummary;
  readonly emptyText: string;
}

// Each item shows its own currency and the base-currency amount at that date's exchange rate.
export function CashFlowList({ title, summary, emptyText }: CashFlowListProps): ReactElement {
  return (
    <Card
      title={title}
      extra={<span className={styles.total}>Total {formatMoney(summary.totalBase)}</span>}
    >
      {summary.items.length === 0 ? (
        <p className={styles.note}>{emptyText}</p>
      ) : (
        <ul className={styles.list}>
          {summary.items.map((item) => (
            <li key={item.id} className={styles.listRow}>
              <span className={styles.stack}>
                <span className={styles.wrapText}>{item.label}</span>
                <span className={styles.meta}>
                  {formatIsoDate(toIsoDate(item.date))}
                  {item.isManual && (
                    <>
                      {' '}
                      <Badge variant="info">Manual</Badge>
                    </>
                  )}
                </span>
              </span>
              <span className={styles.amountStack}>
                <span>{formatMoney(item.amountBase)}</span>
                {item.amount.currency !== item.amountBase.currency && (
                  <span className={styles.meta}>
                    {formatMoney(item.amount, { showCurrency: 'code' })}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
