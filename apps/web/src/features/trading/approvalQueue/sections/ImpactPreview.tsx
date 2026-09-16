import { Badge } from '@staysteady/ui';
import type { BadgeVariant } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { moneyFromDto } from '../../../../data/api';
import type { ApprovalImpactDto, RiskCheckDto, RiskCheckStatusDto } from '../../../../data/schemas';
import { formatMoney } from '../../../../shared/format';
import styles from '../ApprovalQueue.module.scss';

const CHECK_VARIANT: Readonly<Record<RiskCheckStatusDto, BadgeVariant>> = {
  passed: 'positive',
  warning: 'warning',
  failed: 'critical',
};

const CHECK_LABEL: Readonly<Record<RiskCheckStatusDto, string>> = {
  passed: 'Passed',
  warning: 'Watch',
  failed: 'Failed',
};

// UI spec 7.12 — what the portfolio looks like after the action, with the limits left.
export function ImpactPreview({ impact }: { readonly impact: ApprovalImpactDto }): ReactElement {
  return (
    <div className={styles.impactGrid}>
      <span className={styles.impactItem}>
        <span className={styles.impactLabel}>Estimated cost</span>
        <span className={styles.impactValue}>
          {formatMoney(moneyFromDto(impact.estimatedCost))}
        </span>
      </span>
      <span className={styles.impactItem}>
        <span className={styles.impactLabel}>Current price</span>
        <span className={styles.impactValue}>{formatMoney(moneyFromDto(impact.currentPrice))}</span>
      </span>
      <span className={styles.impactItem}>
        <span className={styles.impactLabel}>Position value</span>
        <span className={styles.impactValue}>
          {formatMoney(moneyFromDto(impact.positionValueBefore))}{' '}
          <span className={styles.arrow}>&rarr;</span>{' '}
          {formatMoney(moneyFromDto(impact.positionValueAfter))}
        </span>
      </span>
      <span className={styles.impactItem}>
        <span className={styles.impactLabel}>Allocation</span>
        <span className={styles.impactValue}>
          {impact.allocationPercentBefore.toFixed(2)}% <span className={styles.arrow}>&rarr;</span>{' '}
          {impact.allocationPercentAfter.toFixed(2)}%
        </span>
      </span>
      <span className={styles.impactItem}>
        <span className={styles.impactLabel}>Cash</span>
        <span className={styles.impactValue}>
          {formatMoney(moneyFromDto(impact.cashBefore))}{' '}
          <span className={styles.arrow}>&rarr;</span> {formatMoney(moneyFromDto(impact.cashAfter))}
        </span>
      </span>
      <span className={styles.impactItem}>
        <span className={styles.impactLabel}>Strategy capital used</span>
        <span className={styles.impactValue}>
          {impact.strategyCapitalUsedPercent.toFixed(2)}% of{' '}
          {impact.strategyCapitalLimitPercent.toFixed(0)}%
        </span>
      </span>
      <span className={styles.impactItem}>
        <span className={styles.impactLabel}>Open positions after</span>
        <span className={styles.impactValue}>
          {impact.openPositionsAfter} of {impact.maxConcurrentPositions}
        </span>
      </span>
    </div>
  );
}

export function RiskChecks({ checks }: { readonly checks: readonly RiskCheckDto[] }): ReactElement {
  return (
    <ul className={styles.checkList}>
      {checks.map((check) => (
        <li key={check.id} className={styles.checkRow}>
          <Badge variant={CHECK_VARIANT[check.status]}>{CHECK_LABEL[check.status]}</Badge>
          <span className={styles.checkLabel}>{check.label}</span>
          <p className={styles.checkDetail}>{check.detail}</p>
        </li>
      ))}
    </ul>
  );
}
