// Always-visible warnings on a backtest result (UI spec 7.10). Pure.
// These exist to stop a good-looking result being trusted more than it deserves.

import { Decimal } from 'decimal.js';

import type { BacktestDetailDto, BacktestResultDto } from '../../../../data/schemas';
import { pluralize } from '../../../../shared/format';

export type ResultWarningLevel = 'critical' | 'warning' | 'note';

export interface ResultWarning {
  readonly id: string;
  readonly level: ResultWarningLevel;
  readonly title: string;
  readonly detail: string;
}

// Thresholds chosen to flag the cases that most often mislead a single owner reading one result.
const FEW_TRADES = 40;
const HIGH_ANNUAL_RETURN = 25;
const OUTLIER_SHARE = 40;
const LOW_COST_PERCENT = 1;

export function resultWarnings(
  result: BacktestResultDto,
  detail: BacktestDetailDto,
): readonly ResultWarning[] {
  const warnings: ResultWarning[] = [];
  const { validation, costs } = detail;

  if (validation.topTradeSharePercent >= OUTLIER_SHARE) {
    warnings.push({
      id: 'outlier-dependency',
      level: 'critical',
      title: `${validation.topTradeSharePercent.toFixed(0)}% of the profit came from ${pluralize(validation.topTradeCount, 'trade')}`,
      detail: `Half the profit came from about ${pluralize(validation.tradesNeededForHalfProfit, 'trade')}. Without those, this result looks ordinary; do not treat it as repeatable.`,
    });
  }

  if (result.metrics.totalTrades < FEW_TRADES) {
    warnings.push({
      id: 'few-trades',
      level: 'warning',
      title: `Only ${pluralize(result.metrics.totalTrades, 'trade')} in the whole test`,
      detail: 'Win rate, profit factor and the risk ratios are all unreliable at this sample size.',
    });
  }

  if (result.metrics.cagr >= HIGH_ANNUAL_RETURN) {
    warnings.push({
      id: 'high-return',
      level: 'warning',
      title: `An annualised ${result.metrics.cagr.toFixed(1)}% is high enough to be suspicious`,
      detail:
        'Check the cost assumptions, the out-of-sample section and whether a few trades carry the result before believing it.',
    });
  }

  if (costs.costsAsPercentOfGross < LOW_COST_PERCENT) {
    warnings.push({
      id: 'low-costs',
      level: 'warning',
      title: `Costs are only ${costs.costsAsPercentOfGross.toFixed(2)}% of the gross return`,
      detail:
        'That is low for real trading. If the modelled fees or slippage are optimistic, the net result is overstated.',
    });
  }

  if (detail.estimatedBars > 0) {
    warnings.push({
      id: 'estimated-bars',
      level: 'warning',
      title: `${pluralize(detail.estimatedBars, 'estimated bar')} inside the tested range`,
      detail: 'Filled-in prices are not real trades, so results that depend on them are weaker.',
    });
  }

  // A large gap between the two halves usually means the settings were fitted to the first half.
  const degradation = validation.inSample.returnPercent - validation.outOfSample.returnPercent;
  if (degradation > 20) {
    warnings.push({
      id: 'out-of-sample',
      level: 'warning',
      title: 'Out-of-sample performance is much weaker',
      detail: `The later period returned ${validation.outOfSample.returnPercent.toFixed(1)}% against ${validation.inSample.returnPercent.toFixed(1)}% earlier, which often means the settings were fitted to the past.`,
    });
  }

  if (new Decimal(costs.netReturn.amount).lessThanOrEqualTo(0)) {
    warnings.push({
      id: 'negative-net',
      level: 'critical',
      title: 'The strategy lost money after costs',
      detail: 'Gross profit did not cover fees, slippage and conversion.',
    });
  }

  return warnings;
}
