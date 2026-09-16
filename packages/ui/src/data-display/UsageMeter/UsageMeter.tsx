import type { ReactElement } from 'react';

import { cx } from '../../utils/cx';
import styles from './UsageMeter.module.scss';

export type UsageLevel = 'ok' | 'warning' | 'critical';

export interface UsageMeterProps {
  readonly label: string;
  readonly used: number;
  readonly limit: number;
  readonly formatValue?: (value: number) => string;
  // Fractions of the limit where the meter escalates. Defaults: 0.8 and 0.95.
  readonly warningAt?: number;
  readonly criticalAt?: number;
  readonly description?: string;
  readonly className?: string;
}

const LEVEL_TEXT: Readonly<Record<UsageLevel, { readonly icon: string; readonly text: string }>> = {
  ok: { icon: '●', text: 'Within limit' },
  warning: { icon: '▲', text: 'Approaching limit' },
  critical: { icon: '■', text: 'At or near limit' },
};

export function usageLevel(ratio: number, warningAt = 0.8, criticalAt = 0.95): UsageLevel {
  if (ratio >= criticalAt) return 'critical';
  return ratio >= warningAt ? 'warning' : 'ok';
}

// Usage against a limit with headroom, escalating visually and in words (UI spec 7.14, 7.15).
export function UsageMeter({
  label,
  used,
  limit,
  formatValue = (value) => value.toLocaleString('en'),
  warningAt = 0.8,
  criticalAt = 0.95,
  description,
  className,
}: UsageMeterProps): ReactElement {
  const ratio = limit <= 0 ? 1 : used / limit;
  const percent = Math.round(ratio * 100);
  const headroom = Math.max(0, limit - used);
  const level = usageLevel(ratio, warningAt, criticalAt);
  const summary = `${percent}% used, ${formatValue(headroom)} headroom`;

  return (
    <div className={cx(styles.meter, styles[level], className)}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.values}>
          {formatValue(used)} of {formatValue(limit)}
        </span>
      </div>
      <div
        className={styles.track}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(used, limit)}
        aria-valuetext={`${summary}. ${LEVEL_TEXT[level].text}.`}
      >
        <span
          className={styles.fill}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
        <span
          className={styles.marker}
          style={{ left: `${warningAt * 100}%` }}
          aria-hidden="true"
        />
      </div>
      <div className={styles.footer}>
        <span className={styles.level}>
          <span aria-hidden="true">{LEVEL_TEXT[level].icon}</span> {LEVEL_TEXT[level].text}
        </span>
        <span>{summary}</span>
      </div>
      {description !== undefined && <p className={styles.description}>{description}</p>}
    </div>
  );
}
