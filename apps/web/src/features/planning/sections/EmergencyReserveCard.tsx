// The emergency reserve, tracked apart from trading cash (E-07; requirements 30; owner question 18).
// Automation never counts or uses it; the figures are edited with the liquidity plan on Scenarios.

import { Badge, Card, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { moneyFromDto, useLiquidityPlan } from '../../../data/api';
import { ROUTES } from '../../../routes/routes';
import { formatMoney } from '../../../shared/format';
import { createMoney } from '../../../shared/money';
import styles from '../Planning.module.scss';

export function EmergencyReserveCard(): ReactElement {
  const liquidity = useLiquidityPlan();

  const body = ((): ReactElement => {
    if (liquidity.isError) {
      return (
        <ErrorState
          title="Emergency reserve unavailable"
          message={liquidity.error.message}
          onRetry={() => {
            void liquidity.refetch();
          }}
        />
      );
    }
    if (liquidity.data === undefined) return <LoadingState layout="detail" count={1} />;
    const { plan, reserve } = liquidity.data;
    const held = createMoney(plan.reserve.heldAmount, plan.currency);
    return (
      <div className={styles.stack}>
        <div className={styles.toolbar}>
          <span className={styles.value}>{reserve.monthsCovered.toFixed(1)} months</span>
          <Badge variant={reserve.status === 'funded' ? 'positive' : 'warning'}>
            {reserve.status === 'funded'
              ? 'At target'
              : `${formatMoney(moneyFromDto(reserve.shortfall))} below target`}
          </Badge>
        </div>
        <p className={styles.note}>
          {formatMoney(held)} held in {plan.reserve.heldWhere}, against{' '}
          {String(plan.reserve.targetMonths)} months of{' '}
          {formatMoney(createMoney(plan.reserve.monthlyExpenses, plan.currency))} a month.
        </p>
        <p className={styles.meta}>
          Kept outside the trading accounts: automation never counts it or spends it.
        </p>
      </div>
    );
  })();

  return (
    <Card
      title="Emergency reserve"
      extra={
        <Link to={ROUTES.PLANNING_SCENARIOS} className={styles.meta}>
          Edit on Scenarios
        </Link>
      }
    >
      {body}
    </Card>
  );
}
