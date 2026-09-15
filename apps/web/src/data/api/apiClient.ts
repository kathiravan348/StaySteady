// Typed GET for the StaySteady API — the mock layer today, a real backend later. Every response is
// validated against its M-02 schema at runtime (standards 6.3), so bad data fails loudly here.

import type { z } from 'zod';

export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly status: number;
  readonly path: string;

  constructor(message: string, status: number, path: string) {
    super(message);
    this.status = status;
    this.path = path;
  }
}

export async function apiGet<S extends z.ZodType>(
  path: string,
  schema: S,
  signal?: AbortSignal,
): Promise<z.output<S>> {
  const response = await fetch(path, {
    headers: { Accept: 'application/json' },
    ...(signal === undefined ? {} : { signal }),
  });
  if (!response.ok) {
    throw new ApiError(`${path} responded with status ${response.status}`, response.status, path);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(`${path} did not return JSON`, response.status, path);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue === undefined || issue.path.length === 0 ? '(root)' : issue.path.join('.');
    throw new ApiError(
      `${path} returned data that failed validation at ${where}: ${issue?.message ?? 'unknown issue'}`,
      response.status,
      path,
    );
  }
  return parsed.data;
}
