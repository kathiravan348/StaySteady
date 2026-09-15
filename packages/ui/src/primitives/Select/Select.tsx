import type { ReactElement, ReactNode } from 'react';
import {
  Button as RACButton,
  Label as RACLabel,
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
  Popover as RACPopover,
  Select as RACSelect,
  SelectValue as RACSelectValue,
  type SelectProps as RACSelectProps,
} from 'react-aria-components';
import { cx } from '../../utils/cx';
import styles from './Select.module.scss';

export interface SelectOption {
  readonly id: string | number;
  readonly label: string;
  readonly description?: string;
  readonly isDisabled?: boolean;
}

export interface SelectProps<T extends object = SelectOption> extends Omit<
  RACSelectProps<T>,
  'children'
> {
  readonly label?: string;
  readonly placeholder?: string;
  readonly options: readonly T[];
  readonly getOptionId?: (item: T) => string | number;
  readonly getOptionLabel?: (item: T) => string;
  readonly children?: (item: T) => ReactNode;
}

export function Select<T extends object = SelectOption>({
  label,
  placeholder = 'Select an option',
  options,
  getOptionId = (item: T): string | number =>
    'id' in item ? (item.id as string | number) : String(item),
  getOptionLabel = (item: T): string => ('label' in item ? String(item.label) : String(item)),
  children,
  className,
  ...props
}: SelectProps<T>): ReactElement {
  return (
    <RACSelect
      {...props}
      className={(renderProps) =>
        cx(styles.selectField, typeof className === 'function' ? className(renderProps) : className)
      }
    >
      {label && <RACLabel className={styles.label}>{label}</RACLabel>}
      <RACButton className={styles.trigger ?? ''}>
        <RACSelectValue className={styles.value ?? ''}>
          {({ defaultChildren }) => defaultChildren || placeholder}
        </RACSelectValue>
        <svg className={styles.chevron} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </RACButton>
      <RACPopover className={styles.popover ?? ''}>
        <RACListBox items={options} className={styles.listBox ?? ''}>
          {(item) => (
            <RACListBoxItem
              id={getOptionId(item)}
              textValue={getOptionLabel(item)}
              className={styles.item ?? ''}
            >
              {children ? children(item) : getOptionLabel(item)}
            </RACListBoxItem>
          )}
        </RACListBox>
      </RACPopover>
    </RACSelect>
  );
}
