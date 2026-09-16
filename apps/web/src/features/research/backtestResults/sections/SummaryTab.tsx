import { Card, KeyValuePair } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { moneyFromDto } from '../../../../data/api/mappers';
import type { BacktestDetailDto, BacktestResultDto, StrategyDto } from '../../../../data/schemas';
import {
  formatMoney,
  formatSignedMoney,
  formatSignedPercent,
  humanizeToken,
  pluralize,
} from '../../../../shared/format';
import styles from '../BacktestResults.module.scss';

export interface SummaryTabProps {
  readonly result: BacktestResultDto;
  readonly detail: BacktestDetailDto;
  readonly strategy: StrategyDto | undefined;
}

// UI spec 7.10 — the summary tab: what was tested, and what the result says in plain terms.
export function SummaryTab({ result, detail, strategy }: SummaryTabProps): ReactElement {
  const code = { showCurrency: 'code' } as const;
  const { validation } = detail;
  const firstPoint = detail.equityCurve[0];
  const lastPoint = detail.equityCurve[detail.equityCurve.length - 1];
  const benchmarkReturn =
    firstPoint === undefined || lastPoint === undefined || (firstPoint.benchmark ?? 0) === 0
      ? 0
      : (((lastPoint.benchmark ?? 0) - (firstPoint.benchmark ?? 0)) / (firstPoint.benchmark ?? 1)) *
        100;

  return (
    <div className={styles.cardGrid}>
      <Card title="What was tested">
        <div className={styles.keyValues}>
          <KeyValuePair label="Strategy" value={strategy?.name ?? result.strategyId} />
          {strategy !== undefined && (
            <KeyValuePair label="Lifecycle stage" value={humanizeToken(strategy.stage)} />
          )}
          <KeyValuePair label="Period" value={`${result.startDate} to ${result.endDate}`} isMono />
          <KeyValuePair
            label="Instruments"
            value={pluralize(detail.instrumentIds.length, 'instrument')}
          />
          <KeyValuePair
            label="Starting capital"
            value={formatMoney(moneyFromDto(result.initialCapital), code)}
            isMono
          />
          <KeyValuePair
            label="Final capital"
            value={formatMoney(moneyFromDto(result.finalCapital), code)}
            isMono
          />
        </div>
      </Card>

      <Card title="What the result says">
        <ul className={styles.plainList}>
          <li>
            The strategy returned {formatSignedPercent(result.totalReturnPercent)} against{' '}
            {formatSignedPercent(benchmarkReturn)} for the benchmark over the same period.
          </li>
          <li>
            The worst fall from a peak was {result.metrics.maxDrawdown.toFixed(2)}%, so patience
            through a loss of that size was required.
          </li>
          <li>
            {pluralize(result.metrics.totalTrades, 'trade')} at a{' '}
            {result.metrics.winRate.toFixed(1)}% win rate, with a profit factor of{' '}
            {result.metrics.profitFactor.toFixed(2)}.
          </li>
          <li>
            Costs took {formatMoney(moneyFromDto(detail.costs.total), code)}, leaving{' '}
            {formatSignedMoney(moneyFromDto(detail.costs.netReturn))} net.
          </li>
          <li>
            The later, unfitted period returned{' '}
            {formatSignedPercent(validation.outOfSample.returnPercent)} against{' '}
            {formatSignedPercent(validation.inSample.returnPercent)} earlier.
          </li>
        </ul>
      </Card>
    </div>
  );
}
