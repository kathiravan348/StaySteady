// In-memory scheduled reports and their run history for the page load (decisions 33 and 37).

import type { z } from 'zod';

import type { ReportRunSchema, ScheduledReportSchema } from '../../schemas';
import { seedReportRuns, seedReportSchedules } from '../generators';

type Schedule = z.input<typeof ScheduledReportSchema>;
type Run = z.input<typeof ReportRunSchema>;

let schedules: Schedule[] | null = null;
let runs: Run[] | null = null;

export function getSchedules(): Schedule[] {
  schedules ??= seedReportSchedules(new Date().toISOString().slice(0, 10));
  return schedules;
}

export function setSchedules(next: Schedule[]): void {
  schedules = next;
}

// Newest first.
export function getRuns(): Run[] {
  runs ??= seedReportRuns();
  return runs;
}

export function addRun(run: Run): void {
  runs = [run, ...getRuns()];
}
