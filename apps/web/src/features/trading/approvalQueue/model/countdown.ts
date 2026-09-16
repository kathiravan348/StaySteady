// Countdown for time-sensitive approvals (UI spec 7.12). An opportunity that expires needs the time
// left stated plainly, not a timestamp the reader has to subtract from.

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

// Under an hour the seconds matter, so the label ticks; beyond that they do not.
export const URGENT_MS = HOUR_MS;

export interface Countdown {
  readonly label: string;
  readonly msRemaining: number;
  readonly isExpired: boolean;
  readonly isUrgent: boolean;
}

function plural(value: number, unit: string): string {
  return `${String(value)} ${unit}${value === 1 ? '' : 's'}`;
}

export function countdownTo(expiresAt: string, nowMs: number): Countdown {
  const msRemaining = new Date(expiresAt).getTime() - nowMs;
  if (msRemaining <= 0) {
    const ago = Math.abs(msRemaining);
    const label =
      ago >= DAY_MS
        ? `Expired ${plural(Math.floor(ago / DAY_MS), 'day')} ago`
        : ago >= HOUR_MS
          ? `Expired ${plural(Math.floor(ago / HOUR_MS), 'hour')} ago`
          : `Expired ${plural(Math.max(Math.floor(ago / MINUTE_MS), 1), 'minute')} ago`;
    return { label, msRemaining, isExpired: true, isUrgent: false };
  }

  if (msRemaining < URGENT_MS) {
    const minutes = Math.floor(msRemaining / MINUTE_MS);
    const seconds = Math.floor((msRemaining % MINUTE_MS) / 1000);
    return {
      label: `Expires in ${String(minutes)}m ${String(seconds).padStart(2, '0')}s`,
      msRemaining,
      isExpired: false,
      isUrgent: true,
    };
  }

  if (msRemaining < DAY_MS) {
    const hours = Math.floor(msRemaining / HOUR_MS);
    const minutes = Math.floor((msRemaining % HOUR_MS) / MINUTE_MS);
    return {
      label: `Expires in ${String(hours)}h ${String(minutes)}m`,
      msRemaining,
      isExpired: false,
      isUrgent: false,
    };
  }

  return {
    label: `Expires in ${plural(Math.floor(msRemaining / DAY_MS), 'day')}`,
    msRemaining,
    isExpired: false,
    isUrgent: false,
  };
}
