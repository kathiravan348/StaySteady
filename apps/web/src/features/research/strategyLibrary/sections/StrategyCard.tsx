import { Badge, Button, Card } from '@staysteady/ui';
import type { BadgeVariant } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { moneyFromDto } from '../../../../data/api';
import type {
  DivergenceSeverityDto,
  StrategyLibraryEntryDto,
  StrategyRunStatusDto,
  StrategyStageDto,
} from '../../../../data/schemas';
import {
  formatMoney,
  formatRelativeTime,
  formatSignedMoney,
  formatSignedPercent,
  humanizeToken,
  pluralize,
} from '../../../../shared/format';
import { strategyEditorPath } from '../../../../routes/routes';
import { toIsoUtcTimestamp } from '../../../../shared/types/dateTime';
import { STAGE_LABELS } from '../model/libraryFilters';
import { describePromotion } from '../model/promotion';
import type { PromotionRequest } from '../useStrategyPromotions';
import styles from '../StrategyLibrary.module.scss';

export interface StrategyCardProps {
  readonly entry: StrategyLibraryEntryDto;
  readonly request: PromotionRequest | undefined;
  readonly onPromote: () => void;
  readonly onWithdraw: () => void;
  readonly onDuplicate: () => void;
}

// Stage colour rises with how much the strategy may do unattended, so fully automatic stands out.
const STAGE_VARIANT: Readonly<Record<StrategyStageDto, BadgeVariant>> = {
  draft: 'neutral',
  backtested: 'info',
  observation: 'info',
  semi_automatic: 'warning',
  fully_automatic: 'positive',
};

const RUN_VARIANT: Readonly<Record<StrategyRunStatusDto, BadgeVariant>> = {
  succeeded: 'positive',
  failed: 'critical',
  running: 'info',
  never_run: 'neutral',
};

const DIVERGENCE_VARIANT: Readonly<Record<DivergenceSeverityDto, BadgeVariant>> = {
  aligned: 'positive',
  watch: 'warning',
  diverged: 'critical',
  unproven: 'neutral',
};

function DivergenceLine({ entry }: { readonly entry: StrategyLibraryEntryDto }): ReactElement {
  if (entry.divergence === null) {
    return <p className={styles.meta}>No backtest to compare live performance against.</p>;
  }
  return (
    <div className={styles.statusRow}>
      <Badge variant={DIVERGENCE_VARIANT[entry.divergence.severity]}>
        {humanizeToken(entry.divergence.severity)}
      </Badge>
      <span className={styles.meta}>{entry.divergence.explanation}</span>
    </div>
  );
}

// UI spec 7.7 — one entry: what it is, what it is allowed to do, what it holds, how it was proven,
// how it is actually doing, and when it last ran.
export function StrategyCard({
  entry,
  request,
  onPromote,
  onWithdraw,
  onDuplicate,
}: StrategyCardProps): ReactElement {
  const promotion = describePromotion(entry);
  const live = entry.live;

  return (
    <Card
      title={entry.name}
      extra={<Badge variant={STAGE_VARIANT[entry.stage]}>{STAGE_LABELS[entry.stage]}</Badge>}
    >
      <div className={styles.cardHeader}>
        <p className={styles.description}>{entry.description}</p>
        <p className={styles.meta}>
          v{entry.version} · {entry.timeframe} ·{' '}
          {entry.marketIds.length === 0 ? 'No market' : entry.marketIds.join(', ')} ·{' '}
          {entry.instrumentTypes.map(humanizeToken).join(', ')}
        </p>
        <p className={styles.meta}>
          {entry.instrumentSymbols.length === 0
            ? 'No instruments'
            : entry.instrumentSymbols.join(', ')}
        </p>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Capital allocated</span>
          <span className={styles.metricValue}>
            {formatMoney(moneyFromDto(entry.allocatedCapital))}
            {entry.allocationPercent > 0 && (
              <span className={styles.meta}> · {entry.allocationPercent.toFixed(2)}%</span>
            )}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Backtest</span>
          <span className={styles.metricValue}>
            {entry.backtest === null ? (
              <span className={styles.muted}>Never backtested</span>
            ) : (
              <span
                className={
                  entry.backtest.totalReturnPercent >= 0 ? styles.positive : styles.negative
                }
              >
                {formatSignedPercent(entry.backtest.totalReturnPercent)}
              </span>
            )}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Live to date</span>
          <span className={styles.metricValue}>
            {live === null ? (
              <span className={styles.muted}>Not live</span>
            ) : (
              <>
                <span className={live.returnPercent >= 0 ? styles.positive : styles.negative}>
                  {formatSignedPercent(live.returnPercent)}
                </span>
                <span className={styles.meta}>
                  {' '}
                  · {formatSignedMoney(moneyFromDto(live.gainLoss))}
                </span>
              </>
            )}
          </span>
          {live !== null && (
            <span className={styles.meta}>{pluralize(live.openPositions, 'open position')}</span>
          )}
        </div>
      </div>

      <DivergenceLine entry={entry} />

      {entry.lastRun !== null && (
        <div className={styles.statusRow}>
          <Badge variant={RUN_VARIANT[entry.lastRun.status]}>
            {humanizeToken(entry.lastRun.status)}
          </Badge>
          <span className={styles.meta}>
            {entry.lastRun.status === 'never_run'
              ? entry.lastRun.message
              : `${formatRelativeTime(entry.lastRun.at)} — ${entry.lastRun.message}`}
          </span>
        </div>
      )}

      <div className={styles.inline}>
        <Link to={strategyEditorPath(String(entry.strategyId))} className={styles.link}>
          {entry.stage === 'draft' ? 'Edit rules' : 'View and edit rules'}
        </Link>
        <button type="button" className={styles.link} onClick={onDuplicate}>
          Duplicate
        </button>
      </div>

      <div className={styles.inline}>
        {promotion === null ? (
          <span className={styles.meta}>Fully automatic. There is no further stage.</span>
        ) : request === undefined ? (
          <Button variant="secondary" onPress={onPromote}>
            Promote: {promotion}
          </Button>
        ) : (
          <>
            <Badge variant="warning">Promotion requested</Badge>
            <span className={styles.meta}>
              {formatRelativeTime(toIsoUtcTimestamp(request.requestedAt))}
            </span>
            <button type="button" className={styles.link} onClick={onWithdraw}>
              Withdraw
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
