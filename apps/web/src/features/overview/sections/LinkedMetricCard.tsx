import { Card, MetricDisplay } from '@staysteady/ui';
import type { MetricDirection } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import styles from './sections.module.scss';

export interface LinkedMetricCardProps {
  readonly to: string;
  readonly label: string;
  readonly value: string;
  readonly changeValue?: string | undefined;
  readonly direction?: MetricDirection | undefined;
  readonly subLabel?: string | undefined;
}

// UI spec 7.1 — every headline card links through to its detailed screen.
export function LinkedMetricCard({
  to,
  label,
  value,
  changeValue,
  direction,
  subLabel,
}: LinkedMetricCardProps): ReactElement {
  return (
    <Link to={to} className={styles.cardLink}>
      <Card isInteractive>
        <MetricDisplay
          label={label}
          value={value}
          size="lg"
          {...(changeValue === undefined ? {} : { changeValue })}
          {...(direction === undefined ? {} : { direction })}
          {...(subLabel === undefined ? {} : { subLabel })}
        />
      </Card>
    </Link>
  );
}
