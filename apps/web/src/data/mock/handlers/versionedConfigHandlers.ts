// A factory for the list, save and revert endpoints every configuration area repeats (UI spec 7.18,
// decisions 33 and 38): writes validate with the area's schema, keep a full version, never rewrite
// history, and return the whole list. Areas built before session 40 still have their own files.

import { http, HttpResponse, type HttpHandler } from 'msw';
import type { z } from 'zod';

import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import type { VersionStore } from '../stores/configStore';
import { appendVersion } from '../stores/configStore';
import { RevertRequestSchema } from '../../schemas';
import { nowUtc } from '../../../shared/types/dateTime';

export interface VersionedConfigArea<T> {
  // e.g. "/api/v1/config/instruments"
  readonly path: string;
  // e.g. "Instrument type", used in error messages.
  readonly noun: string;
  readonly idOf: (config: T) => string;
  readonly store: () => VersionStore<T>;
  readonly listSchema: z.ZodType;
  readonly saveSchema: z.ZodType;
  // The list entries, health included, built from the store.
  readonly entries: () => unknown[];
  // Whether POST may create new entries; fixed lists (instrument types, currencies) cannot grow.
  readonly allowCreate: boolean;
  // Rules that need other areas' data; returns the message to reject with, or null.
  readonly check?: (config: T) => string | null;
}

export const failure = (message: string, status: number): Response =>
  HttpResponse.json({ error: message }, { status });

export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  const where =
    issue === undefined || issue.path.length === 0 ? '' : ` (${issue.path.map(String).join('.')})`;
  return `${issue?.message ?? 'Invalid configuration'}${where}`;
}

export function versionedConfigHandlers<T>(area: VersionedConfigArea<T>): HttpHandler[] {
  const list = (): Response => {
    const parsed = area.listSchema.safeParse(area.entries());
    return parsed.success
      ? new HttpResponse(JSON.stringify(parsed.data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      : failure(`Mock ${area.noun} data is invalid: ${firstIssue(parsed.error)}`, 500);
  };

  const readSave = async (request: Request): Promise<{ config: T; reason: string } | Response> => {
    const body: unknown = await request.json().catch(() => null);
    const parsed = area.saveSchema.safeParse(body);
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    // Keep the submitted input shape, which is what versions store.
    const raw = body as { config: T; reason: string };
    const rejected = area.check?.(raw.config) ?? null;
    if (rejected !== null) return failure(rejected, 400);
    return { config: raw.config, reason: raw.reason.trim() };
  };

  const same = (a: T, b: T): boolean => JSON.stringify(a) === JSON.stringify(b);

  const handlers: HttpHandler[] = [
    http.get(area.path, () =>
      getActiveDeveloperScenario() === 'loading-error'
        ? failure(`Failed to load ${area.noun} configuration`, 500)
        : list(),
    ),

    http.put(`${area.path}/:id`, async ({ params, request }) => {
      const id = String(params['id']);
      const existing = area.store().get(id)?.[0]?.snapshot;
      if (existing === undefined) return failure(`${area.noun} not found`, 404);
      const save = await readSave(request);
      if (save instanceof Response) return save;
      if (area.idOf(save.config) !== id) return failure(`The ${area.noun} id cannot change`, 400);
      if (same(existing, save.config)) {
        return failure('Nothing has changed since the current version', 400);
      }
      appendVersion(area.store(), id, save.config, save.reason, nowUtc());
      return list();
    }),

    http.post(`${area.path}/:id/revert`, async ({ params, request }) => {
      const id = String(params['id']);
      const versions = area.store().get(id);
      if (versions === undefined) return failure(`${area.noun} not found`, 404);
      const parsed = RevertRequestSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return failure(firstIssue(parsed.error), 400);
      const target = versions.find((item) => item.version === parsed.data.version);
      if (target === undefined) return failure('That version does not exist', 404);
      const existing = versions[0]?.snapshot;
      if (existing !== undefined && same(existing, target.snapshot)) {
        return failure('The current configuration already matches that version', 400);
      }
      const rejected = area.check?.(target.snapshot) ?? null;
      if (rejected !== null) return failure(rejected, 400);
      appendVersion(
        area.store(),
        id,
        target.snapshot,
        `Reverted to version ${String(target.version)}. ${parsed.data.reason}`,
        nowUtc(),
      );
      return list();
    }),
  ];

  if (area.allowCreate) {
    handlers.push(
      http.post(area.path, async ({ request }) => {
        const save = await readSave(request);
        if (save instanceof Response) return save;
        const id = area.idOf(save.config);
        if (area.store().has(id)) return failure(`${area.noun} ${id} already exists`, 409);
        appendVersion(area.store(), id, save.config, save.reason, nowUtc());
        return list();
      }),
    );
  }
  return handlers;
}
