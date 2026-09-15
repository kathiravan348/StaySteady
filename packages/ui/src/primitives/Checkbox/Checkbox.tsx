import type { ReactElement, ReactNode } from 'react';
import {
  Checkbox as RACCheckbox,
  type CheckboxProps as RACCheckboxProps,
} from 'react-aria-components';
import { cx } from '../../utils/cx';
import styles from './Checkbox.module.scss';

export interface CheckboxProps extends Omit<RACCheckboxProps, 'children'> {
  readonly children?: ReactNode;
}

export function Checkbox({ children, className, ...props }: CheckboxProps): ReactElement {
  return (
    <RACCheckbox
      {...props}
      className={(renderProps) =>
        cx(styles.checkbox, typeof className === 'function' ? className(renderProps) : className)
      }
    >
      {({ isSelected, isIndeterminate }) => (
        <>
          <div className={styles.box}>
            {isIndeterminate ? (
              <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            ) : isSelected ? (
              <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : null}
          </div>
          {children}
        </>
      )}
    </RACCheckbox>
  );
}
