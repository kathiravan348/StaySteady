import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Stack.module.scss';

export type StackDirection = 'horizontal' | 'vertical';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between';
export type StackGap = 1 | 2 | 3 | 4 | 6 | 8;

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  readonly direction?: StackDirection;
  readonly align?: StackAlign;
  readonly justify?: StackJustify;
  readonly gap?: StackGap;
  readonly wrap?: boolean;
  readonly children: ReactNode;
}

const ALIGN_CLASS: Record<StackAlign, string> = {
  start: styles.alignStart ?? '',
  center: styles.alignCenter ?? '',
  end: styles.alignEnd ?? '',
  stretch: styles.alignStretch ?? '',
};

const JUSTIFY_CLASS: Record<StackJustify, string> = {
  start: styles.justifyStart ?? '',
  center: styles.justifyCenter ?? '',
  end: styles.justifyEnd ?? '',
  between: styles.justifyBetween ?? '',
};

const GAP_CLASS: Record<StackGap, string> = {
  1: styles.gap1 ?? '',
  2: styles.gap2 ?? '',
  3: styles.gap3 ?? '',
  4: styles.gap4 ?? '',
  6: styles.gap6 ?? '',
  8: styles.gap8 ?? '',
};

export function Stack({
  direction = 'vertical',
  align = 'stretch',
  justify = 'start',
  gap = 3,
  wrap = false,
  className,
  children,
  ...props
}: StackProps): ReactElement {
  return (
    <div
      className={cx(
        styles.stack,
        styles[direction],
        ALIGN_CLASS[align],
        JUSTIFY_CLASS[justify],
        GAP_CLASS[gap],
        wrap && styles.wrap,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
