import type { ReactElement, ReactNode } from 'react';
import { Button as RACButton, type ButtonProps as RACButtonProps } from 'react-aria-components';
import { cx } from '../../utils/cx';
import styles from './Button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<RACButtonProps, 'children'> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly isLoading?: boolean;
  readonly icon?: ReactNode;
  readonly children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  children,
  isDisabled,
  ...props
}: ButtonProps): ReactElement {
  return (
    <RACButton
      {...props}
      isDisabled={isDisabled || isLoading}
      className={(renderProps) =>
        cx(
          styles.button,
          styles[variant],
          styles[size],
          renderProps.isFocusVisible && styles.focused,
          typeof className === 'function' ? className(renderProps) : className,
        )
      }
    >
      {isLoading ? (
        <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        icon
      )}
      {children}
    </RACButton>
  );
}
