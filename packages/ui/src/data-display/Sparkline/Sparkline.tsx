import type { HTMLAttributes, ReactElement } from 'react';
import { cx } from '../../utils/cx';
import styles from './Sparkline.module.scss';

export interface SparklineProps extends HTMLAttributes<SVGSVGElement> {
  readonly data: readonly number[];
  readonly width?: number;
  readonly height?: number;
  readonly strokeWidth?: number;
  readonly direction?: 'positive' | 'negative' | 'neutral';
  readonly showArea?: boolean;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  strokeWidth = 1.5,
  direction,
  showArea = false,
  className,
  ...props
}: SparklineProps): ReactElement | null {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = strokeWidth;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * usableWidth;
    const y = padding + usableHeight - ((val - min) / range) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;

  const derivedDirection =
    direction ?? ((data[data.length - 1] ?? 0) >= (data[0] ?? 0) ? 'positive' : 'negative');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cx(styles.sparkline, styles[derivedDirection], className)}
      {...props}
    >
      {showArea && <path d={areaD} fill="currentColor" opacity={0.15} />}
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
