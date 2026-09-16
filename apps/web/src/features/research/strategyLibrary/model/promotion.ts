// Stage promotion (UI spec 7.7): "deliberately multi-step, never a single click". Promotion is
// three steps — review what changes, acknowledge every unmet condition one by one, then confirm.

import type { StrategyLibraryEntryDto, StrategyStageDto } from '../../../../data/schemas';
import { STAGE_LABELS } from './libraryFilters';

export const NEXT_STAGE: Readonly<Record<StrategyStageDto, StrategyStageDto | null>> = {
  draft: 'backtested',
  backtested: 'observation',
  observation: 'semi_automatic',
  semi_automatic: 'fully_automatic',
  fully_automatic: null,
};

// What each stage actually means for the owner, so promotion is a decision and not a formality.
export const STAGE_CONSEQUENCE: Readonly<Record<StrategyStageDto, string>> = {
  draft: 'Generates nothing. Editing only.',
  backtested: 'Proven on history only. Still generates nothing live.',
  observation: 'Records the signals it would have raised. Places no orders.',
  semi_automatic: 'Raises signals that wait for your approval before any order is placed.',
  fully_automatic: 'Places orders without asking you first.',
};

const MAX_ACCEPTABLE_DRAWDOWN = 25;

export interface PromotionCheck {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly isMet: boolean;
}

export function promotionChecks(entry: StrategyLibraryEntryDto): readonly PromotionCheck[] {
  const target = NEXT_STAGE[entry.stage];
  const needsLive = target === 'semi_automatic' || target === 'fully_automatic';
  const checks: PromotionCheck[] = [
    {
      id: 'backtest',
      label: 'Backtested at least once',
      detail:
        entry.backtest === null
          ? 'No saved backtest for this strategy.'
          : `Backtested over ${entry.backtest.periodLabel}.`,
      isMet: entry.backtest !== null,
    },
    {
      id: 'last-run',
      label: 'Last run succeeded',
      detail: entry.lastRun === null ? 'Never run.' : entry.lastRun.message,
      isMet: entry.lastRun?.status === 'succeeded',
    },
    {
      id: 'drawdown',
      label: `Backtested drawdown under ${String(MAX_ACCEPTABLE_DRAWDOWN)}%`,
      detail:
        entry.backtest === null
          ? 'No drawdown to judge without a backtest.'
          : `Worst backtested drawdown was ${entry.backtest.maxDrawdown.toFixed(2)}%.`,
      isMet: entry.backtest !== null && entry.backtest.maxDrawdown < MAX_ACCEPTABLE_DRAWDOWN,
    },
  ];

  if (needsLive) {
    checks.push(
      {
        id: 'observed',
        label: 'Observed with real positions',
        detail:
          entry.live === null
            ? 'No live positions have been opened by this strategy.'
            : `${String(entry.live.openPositions)} open position${entry.live.openPositions === 1 ? '' : 's'}.`,
        isMet: entry.live !== null,
      },
      {
        id: 'divergence',
        label: 'Live result tracks the backtest',
        detail: entry.divergence?.explanation ?? 'Nothing to compare yet.',
        isMet: entry.divergence !== null && entry.divergence.severity !== 'diverged',
      },
    );
  }
  return checks;
}

export function describePromotion(entry: StrategyLibraryEntryDto): string | null {
  const target = NEXT_STAGE[entry.stage];
  if (target === null) return null;
  return `${STAGE_LABELS[entry.stage]} to ${STAGE_LABELS[target]}`;
}
