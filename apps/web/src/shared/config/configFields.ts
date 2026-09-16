// Field-level helpers shared by every configuration form (UI spec 7.18): inline errors from the same
// schema the server validates with, and a readable diff between two versions.

import type { z } from 'zod';

// Errors keyed by dotted path ("fees.commissionBps", "regularHours.0.end"), first message per path.
export function errorsByPath(error: z.ZodError | undefined): Readonly<Record<string, string>> {
  const errors: Record<string, string> = {};
  error?.issues.forEach((issue) => {
    const path = issue.path.map(String).join('.');
    // An emptied number box reaches the schema as NaN; say that plainly rather than in Zod's words.
    const message = /expected number/i.test(issue.message) ? 'Enter a number' : issue.message;
    errors[path] ??= message;
  });
  return errors;
}

// Errors are shown for a field once it has been touched, or for everything after a save attempt,
// so a new form does not open covered in complaints.
export function visibleError(
  errors: Readonly<Record<string, string>>,
  path: string,
  touched: ReadonlySet<string>,
  submitted: boolean,
): string | undefined {
  const message = errors[path];
  if (message === undefined) return undefined;
  const isTouched = [...touched].some((key) => path === key || path.startsWith(`${key}.`));
  return submitted || isTouched ? message : undefined;
}

export interface DiffRow {
  readonly key: string;
  readonly before: string | null;
  readonly after: string | null;
}

// Each area describes a version as labelled lines ("Settlement": "T+1"), so the diff reads in the
// screen's own words and added or removed items (one holiday, one session) show up individually.
export function diffDescriptions(
  before: Readonly<Record<string, string>>,
  after: Readonly<Record<string, string>>,
): readonly DiffRow[] {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  return keys
    .map((key) => ({ key, before: before[key] ?? null, after: after[key] ?? null }))
    .filter((row) => row.before !== row.after);
}
