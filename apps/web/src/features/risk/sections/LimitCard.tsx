import { Badge, Button, UsageMeter, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { CooldownDto, RiskLimitDto } from '../../../data/schemas';
import { formatRelativeTime } from '../../../shared/format';
import { closenessOf, formatLimitValue, meterValues } from '../model/limitDisplay';
import styles from '../Risk.module.scss';

export interface LimitCardProps {
  readonly limit: RiskLimitDto;
  readonly cooldowns: readonly CooldownDto[];
  readonly onChange: () => void;
}

// UI spec 7.14 — threshold, current usage and headroom as a bar, escalating as usage approaches the
// limit. An exceeded limit is also marked in words, never by colour alone.
export function LimitCard({ limit, cooldowns, onChange }: LimitCardProps): ReactElement {
  const closeness = closenessOf(limit);
  const meter = meterValues(limit);

  return (
    <li className={cx(styles.limitCard, limit.isBreached ? styles.limitBreached : undefined)}>
      <div className={styles.limitHeader}>
        <span className={styles.limitName}>{limit.name}</span>
        {closeness === 'breached' && <Badge variant="critical">Exceeded</Badge>}
        {closeness === 'near' && <Badge variant="warning">Near limit</Badge>}
        {closeness === 'unmeasured' && <Badge variant="neutral">Not measured</Badge>}
      </div>

      {meter === null ? (
        <p className={styles.unmeasured}>
          Limit {formatLimitValue(limit, limit.threshold)}. {limit.measuredBy}
        </p>
      ) : (
        <UsageMeter
          label={limit.direction === 'minimum' ? 'Held back as reserve' : 'Used'}
          used={meter.used}
          limit={meter.limit}
          formatValue={(value) => formatLimitValue(limit, value)}
          description={
            limit.direction === 'minimum'
              ? `${limit.measuredBy}. A floor of ${formatLimitValue(limit, limit.threshold)}; the headroom is cash that can still be spent.`
              : limit.measuredBy
          }
        />
      )}

      {limit.id === 'global-cooldown' && (
        <p className={styles.meta}>
          {cooldowns.length === 0
            ? 'Nothing is cooling down right now.'
            : cooldowns
                .map(
                  (cooldown) =>
                    `${cooldown.instrumentSymbol} ${cooldown.action} until ${formatRelativeTime(cooldown.endsAt)}`,
                )
                .join(' · ')}
        </p>
      )}

      <p className={styles.meta}>{limit.consequence}</p>

      {limit.isEditable ? (
        <span className={styles.inline}>
          <Button variant="secondary" onPress={onChange}>
            Change limit
          </Button>
        </span>
      ) : (
        <p className={styles.meta}>This limit cannot be changed until it can be measured.</p>
      )}
    </li>
  );
}
