// Checks run before a backtest starts (UI spec 7.9). Pure.
// Blocking problems stop the run; warnings and notes explain what the result will and will not mean.

import { Decimal } from 'decimal.js';

import type {
  BacktestConfigDto,
  CostAssumptionsDto,
  DataCoverageDto,
  MarketCostDefaultsDto,
} from '../../../../data/schemas';
import { pluralize } from '../../../../shared/format';
import { daysBetween, UNUSUAL_PERIODS } from './backtestConfig';

export type CheckLevel = 'blocking' | 'warning' | 'note';

export interface SetupCheck {
  readonly id: string;
  readonly level: CheckLevel;
  readonly title: string;
  readonly detail: string;
}

// Shorter than this, a result says more about one market phase than about the strategy.
const MEANINGFUL_DAYS = 180;

function costDifferences(
  costs: CostAssumptionsDto,
  live: CostAssumptionsDto | undefined,
): readonly string[] {
  if (live === undefined) return [];
  const differences: string[] = [];
  if (costs.commissionBps !== live.commissionBps) {
    differences.push(`commission ${costs.commissionBps} bps instead of ${live.commissionBps} bps`);
  }
  if (costs.slippageBps !== live.slippageBps) {
    differences.push(`slippage ${costs.slippageBps} bps instead of ${live.slippageBps} bps`);
  }
  if (costs.fxConversionBps !== live.fxConversionBps) {
    differences.push(
      `conversion ${costs.fxConversionBps} bps instead of ${live.fxConversionBps} bps`,
    );
  }
  if (!new Decimal(costs.minimumCommission.amount).equals(live.minimumCommission.amount)) {
    differences.push(
      `minimum commission ${costs.minimumCommission.amount} instead of ${live.minimumCommission.amount}`,
    );
  }
  return differences;
}

export interface CheckInput {
  readonly config: BacktestConfigDto;
  readonly coverage: readonly DataCoverageDto[];
  readonly costDefaults: readonly MarketCostDefaultsDto[];
  readonly liveCosts: CostAssumptionsDto | undefined;
}

export function runSetupChecks({
  config,
  coverage,
  costDefaults,
  liveCosts,
}: CheckInput): readonly SetupCheck[] {
  const checks: SetupCheck[] = [];

  if (config.instrumentIds.length === 0) {
    checks.push({
      id: 'no-instruments',
      level: 'blocking',
      title: 'Choose at least one instrument',
      detail: 'A backtest needs an instrument universe to trade.',
    });
  }
  const rangeDays = daysBetween(config.startDate, config.endDate);
  if (rangeDays <= 0) {
    checks.push({
      id: 'range-order',
      level: 'blocking',
      title: 'The start date must be before the end date',
      detail: `The range currently runs from ${config.startDate} to ${config.endDate}.`,
    });
  }
  if (new Decimal(config.initialCapital.amount).lessThanOrEqualTo(0)) {
    checks.push({
      id: 'capital',
      level: 'blocking',
      title: 'Starting capital must be above zero',
      detail: 'Enter the capital the strategy starts the test with.',
    });
  }
  if (rangeDays > 0 && rangeDays < MEANINGFUL_DAYS) {
    checks.push({
      id: 'range-short',
      level: 'warning',
      title: `Range of ${pluralize(rangeDays, 'day')} is too short to be meaningful`,
      detail: 'Results over a few months mostly reflect one market phase. Use a year or more.',
    });
  }

  // History that starts after the requested start date silently shortens the test.
  coverage.forEach((item) => {
    if (item.firstDate > config.startDate) {
      checks.push({
        id: `history-${item.instrumentId}`,
        level: 'warning',
        title: `${item.symbol} history starts ${item.firstDate}`,
        detail: `The test would begin later than ${config.startDate} for this instrument.`,
      });
    }
    if (item.lastDate < config.endDate) {
      checks.push({
        id: `history-end-${item.instrumentId}`,
        level: 'note',
        title: `${item.symbol} history ends ${item.lastDate}`,
        detail: `The test would stop before ${config.endDate} for this instrument.`,
      });
    }
    if (item.estimatedBars > 0) {
      checks.push({
        id: `estimated-${item.instrumentId}`,
        level: 'warning',
        title: `${item.symbol} includes ${pluralize(item.estimatedBars, 'estimated bar')}`,
        detail: 'Filled-in bars are not real trades; results depending on them are less reliable.',
      });
    }
    if (item.missingTradingDays > 0) {
      checks.push({
        id: `gaps-${item.instrumentId}`,
        level: 'note',
        title: `${item.symbol} has ${pluralize(item.missingTradingDays, 'market holiday')} in range`,
        detail: 'Those days have no bars, which is expected for this market.',
      });
    }
  });

  UNUSUAL_PERIODS.forEach((period) => {
    if (period.startDate <= config.endDate && period.endDate >= config.startDate) {
      checks.push({
        id: `period-${period.id}`,
        level: 'note',
        title: `Range includes the ${period.label}`,
        detail: period.note,
      });
    }
  });

  const differences = costDifferences(config.costs, liveCosts);
  if (differences.length > 0) {
    checks.push({
      id: 'costs-differ',
      level: 'warning',
      title: 'Cost assumptions differ from live configuration',
      detail: `Using ${differences.join(', ')}. Lower costs than live make results look better than they would be.`,
    });
  }

  const missingBenchmarks = config.benchmarks.filter(
    (benchmark) => benchmark.instrumentId === null,
  );
  if (missingBenchmarks.length > 0) {
    const names = missingBenchmarks
      .map(
        (benchmark) =>
          costDefaults.find((item) => item.marketId === benchmark.marketId)?.marketName ??
          benchmark.marketId,
      )
      .join(', ');
    checks.push({
      id: 'benchmarks-missing',
      level: 'note',
      title: `No benchmark for ${names}`,
      detail: 'Results for those markets will have nothing to compare against.',
    });
  }

  return checks;
}

export const hasBlockingCheck = (checks: readonly SetupCheck[]): boolean =>
  checks.some((check) => check.level === 'blocking');
