import type { ReactElement } from 'react';

import styles from './sections.module.scss';

interface ToggleGroupProps<T extends string> {
  readonly label: string;
  readonly options: readonly T[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly formatOption?: ((option: T) => string) | undefined;
}

// Single-choice toggle buttons; the pressed state is exposed to assistive technology.
export function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  formatOption,
}: ToggleGroupProps<T>): ReactElement {
  return (
    <div className={styles.toggleGroup} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={styles.toggle}
          aria-pressed={option === value}
          onClick={() => {
            onChange(option);
          }}
        >
          {formatOption === undefined ? option : formatOption(option)}
        </button>
      ))}
    </div>
  );
}
