import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './ScrollArea.module.scss';

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  readonly maxHeight?: string | number;
  readonly children: ReactNode;
}

export function ScrollArea({
  maxHeight,
  style,
  className,
  children,
  ...props
}: ScrollAreaProps): ReactElement {
  return (
    <div style={{ maxHeight, ...style }} className={cx(styles.scrollArea, className)} {...props}>
      {children}
    </div>
  );
}
