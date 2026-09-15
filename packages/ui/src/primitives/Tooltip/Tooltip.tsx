import type { ReactElement, ReactNode } from 'react';
import {
  OverlayArrow,
  Tooltip as RACTooltip,
  TooltipTrigger,
  type TooltipProps as RACTooltipProps,
} from 'react-aria-components';
import { cx } from '../../utils/cx';
import styles from './Tooltip.module.scss';

export interface TooltipProps extends Omit<RACTooltipProps, 'children'> {
  readonly content: ReactNode;
  readonly children: ReactElement;
  readonly showArrow?: boolean;
}

export function Tooltip({
  content,
  children,
  showArrow = true,
  className,
  ...props
}: TooltipProps): ReactElement {
  return (
    <TooltipTrigger delay={200}>
      {children}
      <RACTooltip
        {...props}
        className={(renderProps) =>
          cx(styles.tooltip, typeof className === 'function' ? className(renderProps) : className)
        }
      >
        {showArrow && (
          <OverlayArrow>
            <svg width={8} height={8} viewBox="0 0 8 8" className={styles.arrow}>
              <path d="M0 0 L4 4 L8 0" />
            </svg>
          </OverlayArrow>
        )}
        {content}
      </RACTooltip>
    </TooltipTrigger>
  );
}
