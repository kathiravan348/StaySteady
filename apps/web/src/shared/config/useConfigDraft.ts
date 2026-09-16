import { useMemo, useState } from 'react';
import type { z } from 'zod';

import { errorsByPath, visibleError } from './configFields';

export interface ConfigDraft<T> {
  readonly draft: T;
  readonly errors: Readonly<Record<string, string>>;
  readonly errorCount: number;
  readonly isDirty: boolean;
  readonly submitted: boolean;
  readonly reason: string;
  readonly setReason: (reason: string) => void;
  // The error to show beside a field: only once it has been touched, or after a save attempt.
  readonly error: (path: string) => string | undefined;
  // Every change names the field it touched, so its error is shown from then on.
  readonly update: (path: string, change: (draft: T) => T) => void;
  // Marks the form submitted and returns the trimmed reason when the draft can be saved.
  readonly attemptSave: () => string | null;
}

// The editing state every configuration form shares (UI spec 7.18, decision 38). Validation runs on
// every change with the area's schema, which is the same schema the server saves with.
export function useConfigDraft<T>(initial: T, schema: z.ZodType): ConfigDraft<T> {
  const [draft, setDraft] = useState<T>(initial);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState('');

  const errors = useMemo(() => {
    const result = schema.safeParse(draft);
    return errorsByPath(result.success ? undefined : result.error);
  }, [schema, draft]);
  const errorCount = Object.keys(errors).length;

  return {
    draft,
    errors,
    errorCount,
    isDirty: JSON.stringify(draft) !== JSON.stringify(initial),
    submitted,
    reason,
    setReason,
    error: (path) => visibleError(errors, path, touched, submitted),
    update: (path, change) => {
      setDraft(change);
      setTouched((current) => new Set([...current, path]));
    },
    attemptSave: () => {
      setSubmitted(true);
      return errorCount > 0 || reason.trim() === '' ? null : reason.trim();
    },
  };
}
