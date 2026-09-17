import { Badge, Card } from '@staysteady/ui';
import type { BadgeVariant } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import type { StrategyDto } from '../../../../data/schemas';
import { humanizeToken } from '../../../../shared/format';
import { strategyEditorPath } from '../../../../routes/routes';
import styles from '../Automation.module.scss';
import type {
  StageEffect,
  StrategyInstrumentPermission,
} from '../../../../shared/automation/permissionLayers';
import { stageEffect } from '../../../../shared/automation/permissionLayers';

const EFFECT: Readonly<Record<StageEffect, { variant: BadgeVariant; label: string }>> = {
  'without-approval': { variant: 'positive', label: 'Orders without asking' },
  'with-approval': { variant: 'info', label: 'Orders after approval' },
  'no-orders': { variant: 'neutral', label: 'Places no orders' },
};

export interface StrategyRow {
  readonly strategy: StrategyDto;
  readonly instruments: readonly StrategyInstrumentPermission[];
}

// The strategy is the last layer: what each strategy can actually trade, instrument by instrument.
export function StrategyPermissions({
  rows,
}: {
  readonly rows: readonly StrategyRow[];
}): ReactElement {
  return (
    <Card title="By strategy">
      <ul className={styles.layers}>
        {rows.map(({ strategy, instruments }) => {
          const effect = EFFECT[stageEffect(strategy.stage)];
          return (
            <li key={String(strategy.id)} className={styles.stack}>
              <span className={styles.inline}>
                <Link className={styles.layerName} to={strategyEditorPath(String(strategy.id))}>
                  {strategy.name}
                </Link>
                <Badge variant="neutral">{humanizeToken(strategy.stage)}</Badge>
                <Badge variant={effect.variant}>{effect.label}</Badge>
              </span>
              <ul className={styles.layers}>
                {instruments.map((item) => (
                  <li key={item.instrumentId} className={styles.layer}>
                    <Badge variant={item.canTrade ? 'positive' : 'neutral'}>{item.symbol}</Badge>
                    <p className={styles.note}>{item.result}</p>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
