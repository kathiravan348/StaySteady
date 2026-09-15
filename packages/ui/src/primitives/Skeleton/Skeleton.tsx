import type { CSSProperties, HTMLAttributes, ReactElement } from 'react';
import { cx } from '../../utils/cx';
import styles from './Skeleton.module.scss';

export type SkeletonShape = 'text' | 'circle' | 'card' | 'rect';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: SkeletonShape;
  readonly width?: string | number;
  readonly height?: string | number;
}

export function Skeleton({
  shape = 'text',
  width,
  height,
  style,
  className,
  ...props
}: SkeletonProps): ReactElement {
  const dynamicStyle: CSSProperties = {
    ...style,
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
  };

  return (
    <div
      aria-hidden="true"
      style={dynamicStyle}
      className={cx(styles.skeleton, styles[shape], className)}
      {...props}
    />
  );
}
