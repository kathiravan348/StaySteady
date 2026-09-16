import { MetricDisplay } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { moneyFromDto } from '../../../../data/api/mappers';
import type { BacktestDetailDto, BacktestResultDto } from '../../../../data/schemas';
import {
  directionOfNumber,
  formatMoney,
  formatSignedMoney,
  formatSignedPercent,
  pluralize,
} from '../../../../shared/format';
import styles from '../BacktestResults.module.scss';

export interface HeadlineStripProps {
  readonly result: BacktestResultDto;
  readonly detail: BacktestDetailDto;
}

// UI spec 7.10 — the headline metric strip across the top.
export function HeadlineStrip({ result, detail }: HeadlineStripProps): ReactElement {
  const code = { showCurrency: 'code' } as const;
  return (
    <section className={styles.headline} aria-label="Headline results">
      <MetricDisplay
        label="Total return"
        value={formatSignedMoney(moneyFromDto(result.totalReturn))}
        changeValue={formatSignedPercent(result.totalReturnPercent)}
        direction={directionOfNumber(result.totalReturnPercent)}
        size="lg"
        subLabel={`${formatMoney(moneyFromDto(result.initialCapital), code)} to ${formatMoney(moneyFromDto(result.finalCapital), code)}`}
      />
      <MetricDisplay
        label="Annualised (CAGR)"
        value={`${result.metrics.cagr.toFixed(2)}%`}
        subLabel={`${result.startDate} to ${result.endDate}`}
      />
      <MetricDisplay
        label="Maximum drawdown"
        value={`-${result.metrics.maxDrawdown.toFixed(2)}%`}
        direction="negative"
        subLabel="Deepest fall from a peak"
      />
      <MetricDisplay
        label="Sharpe ratio"
        value={result.metrics.sharpeRatio.toFixed(2)}
        subLabel={`Sortino ${result.metrics.sortinoRatio.toFixed(2)}`}
      />
      <MetricDisplay
        label="Win rate"
        value={`${result.metrics.winRate.toFixed(1)}%`}
        subLabel={pluralize(result.metrics.totalTrades, 'trade')}
      />
      <MetricDisplay
        label="Costs paid"
        value={formatMoney(moneyFromDto(detail.costs.total), code)}
        subLabel={`${detail.costs.costsAsPercentOfGross.toFixed(2)}% of the gross ${formatSignedMoney(moneyFromDto(detail.costs.grossReturn))}`}
      />
    </section>
  );
}
