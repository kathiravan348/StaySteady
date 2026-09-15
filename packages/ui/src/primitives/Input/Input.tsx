import type { ReactElement, ReactNode } from 'react';
import {
  FieldError,
  Input as RACInput,
  Label as RACLabel,
  Text as RACText,
  TextField as RACTextField,
  type TextFieldProps as RACTextFieldProps,
} from 'react-aria-components';
import { cx } from '../../utils/cx';
import styles from './Input.module.scss';

export interface InputProps extends Omit<RACTextFieldProps, 'children'> {
  readonly label?: string;
  readonly description?: string;
  readonly errorMessage?: string;
  readonly placeholder?: string;
  readonly leadingIcon?: ReactNode;
  readonly trailingIcon?: ReactNode;
  readonly inputClassName?: string;
}

export function Input({
  label,
  description,
  errorMessage,
  placeholder,
  leadingIcon,
  trailingIcon,
  inputClassName,
  className,
  isInvalid,
  isDisabled,
  ...props
}: InputProps): ReactElement {
  return (
    <RACTextField
      {...props}
      isInvalid={isInvalid || Boolean(errorMessage)}
      {...(isDisabled !== undefined && { isDisabled })}
      className={(renderProps) =>
        cx(styles.textField, typeof className === 'function' ? className(renderProps) : className)
      }
    >
      {label && <RACLabel className={styles.label}>{label}</RACLabel>}
      <div
        className={styles.inputWrapper}
        data-invalid={isInvalid || Boolean(errorMessage)}
        data-disabled={isDisabled}
      >
        {leadingIcon && <span className={styles.leadingIcon}>{leadingIcon}</span>}
        <RACInput
          {...(placeholder !== undefined && { placeholder })}
          className={cx(
            styles.input,
            Boolean(leadingIcon) && styles.withLeading,
            Boolean(trailingIcon) && styles.withTrailing,
            inputClassName,
          )}
        />
        {trailingIcon && <span className={styles.trailingIcon}>{trailingIcon}</span>}
      </div>
      {description && !errorMessage && (
        <RACText slot="description" className={styles.description ?? ''}>
          {description}
        </RACText>
      )}
      {errorMessage && (
        <FieldError className={styles.errorMessage ?? ''}>{errorMessage}</FieldError>
      )}
    </RACTextField>
  );
}
