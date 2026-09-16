// Typed requests for the StaySteady API — the mock layer today, a real backend later. Every response
// is validated against its M-02 schema at runtime (standards 6.3), so bad data fails loudly here.

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

// Write requests surface the server's own explanation (e.g. "name already exists") when it has one.
async function serverError(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    return typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'string'
      ? body.error
      : null;
  } catch {
    return null;
  }
}

async function readValidated<S extends z.ZodType>(
  response: Response,
  path: string,
  schema: S,
): Promise<z.output<S>> {
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
  return readValidated(response, path, schema);
}

export async function apiSend<S extends z.ZodType>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body: unknown,
  schema: S,
): Promise<z.output<S>> {
  const response = await fetch(path, {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const message = await serverError(response);
    throw new ApiError(
      message ?? `${method} ${path} responded with status ${response.status}`,
      response.status,
      path,
    );
  }
  return readValidated(response, path, schema);
}
