import { useId } from 'react';
import type { ReactElement } from 'react';

import { matchOption } from './displaySettings';
import styles from './SettingSelect.module.scss';

interface SettingSelectProps<T extends string> {
  readonly label: string;
  readonly value: T;
  readonly options: readonly T[];
  readonly onChange: (value: T) => void;
}

const OPTION_LABELS: Record<string, string> = {
  dark: 'Obsidian Dark (Default)',
  midnight: 'Midnight Navy (Neon Cyan)',
  emerald: 'Emerald Jade (Dark Forest)',
  light: 'Luxury Light (Clean Slate)',
  'high-contrast': 'High Contrast (Accessible)',
  system: 'System Preference',
  jakarta: 'Plus Jakarta Sans (Fintech)',
  inter: 'Inter (Swiss Precision)',
  outfit: 'Outfit (Geometric)',
  comfortable: 'Comfortable',
  compact: 'Compact',
  'green-up': 'Green Up / Red Down (Standard)',
  'red-up': 'Red Up / Green Down (Asian Markets)',
};

// Formats option value with human-friendly descriptions
function formatOption(option: string): string {
  if (option in OPTION_LABELS) {
    return OPTION_LABELS[option] ?? option;
  }
  const words = option.replaceAll('-', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function SettingSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: SettingSelectProps<T>): ReactElement {
  const id = useId();

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <select
        className={styles.select}
        id={id}
        value={value}
        onChange={(event) => {
          const next = matchOption(options, event.target.value);
          if (next !== undefined) {
            onChange(next);
          }
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption(option)}
          </option>
        ))}
      </select>
    </div>
  );
}
