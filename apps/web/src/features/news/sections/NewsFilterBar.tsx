import type { ReactElement } from 'react';

import type { NewsCategoryDto, NewsSentimentDto } from '../../../data/schemas';
import { NewsCategorySchema, NewsSentimentSchema } from '../../../data/schemas';
import type { ImportanceFilter, NewsFilters } from '../model/newsFeed';
import { ALL, CATEGORY_LABELS, sentimentLabel } from '../model/newsFeed';
import styles from '../News.module.scss';

export interface NewsFilterOptions {
  readonly markets: readonly { value: string; label: string }[];
  readonly countries: readonly string[];
  readonly instruments: readonly { value: string; label: string }[];
}

interface SelectProps<T extends string> {
  readonly label: string;
  readonly value: T;
  readonly options: readonly { value: T; label: string }[];
  readonly onChange: (value: T) => void;
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectProps<T>): ReactElement {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <select
        className={styles.input}
        value={value}
        onChange={(event) => {
          const next = options.find((option) => option.value === event.target.value);
          if (next !== undefined) onChange(next.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const any = <T extends string>(label: string): { value: T | typeof ALL; label: string } => ({
  value: ALL,
  label,
});

export function NewsFilterBar({
  filters,
  options,
  onChange,
}: {
  readonly filters: NewsFilters;
  readonly options: NewsFilterOptions;
  readonly onChange: (filters: NewsFilters) => void;
}): ReactElement {
  const set = <K extends keyof NewsFilters>(key: K, value: NewsFilters[K]): void => {
    onChange({ ...filters, [key]: value });
  };
  return (
    <div className={styles.filters} role="search" aria-label="Filter news">
      <FilterSelect
        label="Market"
        value={filters.market}
        options={[any('All markets'), ...options.markets]}
        onChange={(value) => {
          set('market', value);
        }}
      />
      <FilterSelect
        label="Country"
        value={filters.country}
        options={[
          any('All countries'),
          ...options.countries.map((country) => ({ value: country, label: country })),
        ]}
        onChange={(value) => {
          set('country', value);
        }}
      />
      <FilterSelect
        label="Instrument"
        value={filters.instrument}
        options={[any('All instruments'), ...options.instruments]}
        onChange={(value) => {
          set('instrument', value);
        }}
      />
      <FilterSelect<NewsCategoryDto | typeof ALL>
        label="Category"
        value={filters.category}
        options={[
          any('All categories'),
          ...NewsCategorySchema.options.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
        ]}
        onChange={(value) => {
          set('category', value);
        }}
      />
      <FilterSelect<NewsSentimentDto | typeof ALL>
        label="Estimated sentiment"
        value={filters.sentiment}
        options={[
          any('Any sentiment'),
          ...NewsSentimentSchema.options.map((value) => ({ value, label: sentimentLabel(value) })),
        ]}
        onChange={(value) => {
          set('sentiment', value);
        }}
      />
      <FilterSelect<ImportanceFilter>
        label="Importance"
        value={filters.importance}
        options={[
          any('Any importance'),
          { value: 'medium', label: 'Medium or high' },
          { value: 'high', label: 'High only' },
        ]}
        onChange={(value) => {
          set('importance', value);
        }}
      />
      <label className={styles.checkOption}>
        <input
          type="checkbox"
          checked={filters.heldOnly}
          onChange={(event) => {
            set('heldOnly', event.target.checked);
          }}
        />
        Held instruments only
      </label>
    </div>
  );
}
