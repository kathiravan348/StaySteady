// What could become cash and when, known commitments against it, the withdrawal phase and the
// automation ceiling (E-07; requirements 29, 30; owner question 18).

import { Badge, Button, Card, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { moneyFromDto, useLiquidityPlan } from '../../../data/api';
import type { LadderBucketDto, LiquidityViewDto } from '../../../data/schemas';
import { formatMoney } from '../../../shared/format';
import { createMoney } from '../../../shared/money';
import styles from '../Planning.module.scss';
import { LiquidityPlanForm } from './LiquidityPlanForm';

const BUCKET_LABEL: Readonly<Record<LadderBucketDto, string>> = {
  cash: 'Trading cash, now',
  days: 'Within days',
  weeks: 'Within weeks',
  months: 'Months or longer',
};

function LiquidityFacts({ view }: { readonly view: LiquidityViewDto }): ReactElement {
  const { plan, withdrawal, automation } = view;
  const short = view.commitments.filter((item) => !item.isCovered);
  return (
    <div className={styles.stack}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Could be cash</th>
              <th scope="col" className={styles.end}>
                Amount
              </th>
              <th scope="col" className={styles.end}>
                Running total
              </th>
            </tr>
          </thead>
          <tbody>
            {view.ladder.map((row) => (
              <tr key={row.bucket}>
                <td>{BUCKET_LABEL[row.bucket]}</td>
                <td className={styles.end}>{formatMoney(moneyFromDto(row.value))}</td>
                <td className={styles.end}>{formatMoney(moneyFromDto(row.cumulative))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className={styles.note}>Known commitments</h3>
      {short.length > 0 && (
        <p className={styles.warning}>
          Not enough reachable in time for: {short.map((item) => item.label).join(', ')}.
        </p>
      )}
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Commitment</th>
              <th scope="col">Due</th>
              <th scope="col" className={styles.end}>
                Amount
              </th>
              <th scope="col" className={styles.end}>
                Reachable by then
              </th>
              <th scope="col">Covered</th>
            </tr>
          </thead>
          <tbody>
            {view.commitments.map((item) => (
              <tr key={item.id}>
                <td>{item.label}</td>
                <td>
                  {String(item.dueDate)} ({String(item.daysUntil)} days)
                </td>
                <td className={styles.end}>{formatMoney(moneyFromDto(item.amount))}</td>
                <td className={styles.end}>{formatMoney(moneyFromDto(item.availableBy))}</td>
                <td>
                  <Badge variant={item.isCovered ? 'positive' : 'critical'}>
                    {item.isCovered ? 'Yes' : 'Short'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className={styles.note}>Withdrawal phase</h3>
      <p className={styles.note}>
        {plan.withdrawal.enabled && plan.withdrawal.startDate !== null
          ? `From ${String(plan.withdrawal.startDate)}: `
          : 'Not started; modelled for planning: '}
        {formatMoney(createMoney(plan.withdrawal.annualAmount, plan.currency))} a year is{' '}
        {withdrawal.withdrawalRatePercent === null
          ? 'not measurable with nothing invested'
          : `${withdrawal.withdrawalRatePercent.toFixed(2)}% of today's portfolio, about ${String(withdrawal.yearsCovered ?? 0)} years before growth and inflation`}
        .
      </p>

      <h3 className={styles.note}>Automation ceiling</h3>
      <p className={automation.isAboveCeiling ? styles.warning : styles.note}>
        Automated strategies manage {formatMoney(moneyFromDto(automation.automatedValue))},{' '}
        {automation.sharePercent.toFixed(1)}% of the portfolio against a ceiling of{' '}
        {String(plan.automationCeilingPercent)}%.{' '}
        {automation.isAboveCeiling ? 'Reduce automation before adding more.' : ''}
      </p>
    </div>
  );
}

export function LiquidityLadderSection(): ReactElement {
  const liquidity = useLiquidityPlan();
  const [isEditing, setEditing] = useState(false);

  const body = ((): ReactElement => {
    if (liquidity.isError) {
      return (
        <ErrorState
          title="Liquidity plan unavailable"
          message={liquidity.error.message}
          onRetry={() => {
            void liquidity.refetch();
          }}
        />
      );
    }
    if (liquidity.data === undefined) return <LoadingState layout="detail" count={3} />;
    return isEditing ? (
      <LiquidityPlanForm
        initial={structuredClone(liquidity.data.plan)}
        onDone={() => {
          setEditing(false);
        }}
      />
    ) : (
      <LiquidityFacts view={liquidity.data} />
    );
  })();

  return (
    <Card
      title="Liquidity, commitments and withdrawals"
      extra={
        liquidity.data !== undefined && !isEditing ? (
          <Button
            variant="secondary"
            size="sm"
            onPress={() => {
              setEditing(true);
            }}
          >
            Edit plan
          </Button>
        ) : undefined
      }
    >
      {body}
    </Card>
  );
}
