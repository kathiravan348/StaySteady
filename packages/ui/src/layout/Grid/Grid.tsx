import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Grid.module.scss';

export type GridCols = 1 | 2 | 3 | 4 | 6 | 12;
export type GridGap = 1 | 2 | 3 | 4 | 6 | 8;

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  readonly cols?: GridCols;
  readonly minItemWidth?: string;
  readonly gap?: GridGap;
  readonly children: ReactNode;
}

const COLS_CLASS: Record<GridCols, string> = {
  1: styles.cols1 ?? '',
  2: styles.cols2 ?? '',
  3: styles.cols3 ?? '',
  4: styles.cols4 ?? '',
  6: styles.cols6 ?? '',
  12: styles.cols12 ?? '',
};

const GAP_CLASS: Record<GridGap, string> = {
  1: styles.gap1 ?? '',
  2: styles.gap2 ?? '',
  3: styles.gap3 ?? '',
  4: styles.gap4 ?? '',
  6: styles.gap6 ?? '',
  8: styles.gap8 ?? '',
};

export function Grid({
  cols = 3,
  minItemWidth,
  gap = 4,
  style,
  className,
  children,
  ...props
}: GridProps): ReactElement {
  const dynamicStyle: CSSProperties = {
    ...style,
    ...(minItemWidth && {
      gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}, 1fr))`,
    }),
  };

  return (
    <div
      style={dynamicStyle}
      className={cx(styles.grid, !minItemWidth && COLS_CLASS[cols], GAP_CLASS[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
}
