// Every generated object is checked against its M-02 schema, so the mock layer and the future real
// layer share one contract (standards 6.3). A generator bug fails loudly with the exact field path.

import type { z } from 'zod';

export class MockDataError extends Error {
  override readonly name = 'MockDataError';
}

export function parseGenerated<S extends z.ZodType>(
  schema: S,
  candidate: z.input<S>,
  label: string,
): z.output<S> {
  const result = schema.safeParse(candidate);
  if (result.success) {
    return result.data;
  }
  const issue = result.error.issues[0];
  const path = issue === undefined || issue.path.length === 0 ? '(root)' : issue.path.join('.');
  throw new MockDataError(
    `Generated ${label} failed schema validation at ${path}: ${issue?.message ?? 'unknown issue'}`,
  );
}

export function parseGeneratedList<S extends z.ZodType>(
  schema: S,
  candidates: readonly z.input<S>[],
  label: string,
): z.output<S>[] {
  return candidates.map((candidate, index) =>
    parseGenerated(schema, candidate, `${label}[${index}]`),
  );
}
