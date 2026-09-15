import { functionalUpdate, type Updater } from '@tanstack/react-table';
import { useCallback, useState } from 'react';

// Uses the controlled value when one is passed, otherwise internal state. Changes are always reported.
export function useControllableState<T>(
  value: T | undefined,
  onChange: ((next: T) => void) | undefined,
  initial: T,
): readonly [T, (updater: Updater<T>) => void] {
  const [internal, setInternal] = useState<T>(initial);
  const current = value === undefined ? internal : value;

  const update = useCallback(
    (updater: Updater<T>) => {
      const next = functionalUpdate(updater, current);
      if (value === undefined) {
        setInternal(next);
      }
      onChange?.(next);
    },
    [current, value, onChange],
  );

  return [current, update] as const;
}
