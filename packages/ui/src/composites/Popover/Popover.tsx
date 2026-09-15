import type { ReactElement, ReactNode } from 'react';
import {
  Dialog,
  DialogTrigger,
  OverlayArrow,
  Popover as RACPopover,
  type PopoverProps as RACPopoverProps,
} from 'react-aria-components';
import { cx } from '../../utils/cx';
import styles from './Popover.module.scss';

export interface PopoverProps extends Omit<RACPopoverProps, 'children' | 'trigger'> {
  readonly trigger: ReactElement;
  readonly children: ReactNode;
  readonly showArrow?: boolean;
}

export function Popover({
  trigger,
  children,
  showArrow = true,
  className,
  ...props
}: PopoverProps): ReactElement {
  return (
    <DialogTrigger>
      {trigger}
      <RACPopover
        {...props}
        className={(renderProps) =>
          cx(styles.popover, typeof className === 'function' ? className(renderProps) : className)
        }
      >
        {showArrow && (
          <OverlayArrow>
            <svg width={10} height={10} viewBox="0 0 10 10" className={styles.arrow}>
              <path d="M0 0 L5 5 L10 0" />
            </svg>
          </OverlayArrow>
        )}
        <Dialog className={styles.dialog ?? ''}>{children}</Dialog>
      </RACPopover>
    </DialogTrigger>
  );
}
