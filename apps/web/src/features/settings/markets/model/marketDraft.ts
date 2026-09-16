// Editing a market configuration (UI spec 7.18): a blank new market, time conversion for the form,
// and a description of a version in the screen's own words for the version diff.

import type { MarketConfigInput } from '../../../../data/schemas';
import { humanizeToken } from '../../../../shared/format';

type Time = MarketConfigInput['regularHours'][number]['start'];

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export const pad = (value: number): string => String(value).padStart(2, '0');

export function timeText(time: Time): string {
  return `${pad(time.hour)}:${pad(time.minute)}`;
}

export function parseTime(text: string): Time | null {
  const match = /^(\d{2}):(\d{2})$/.exec(text);
  if (match === null) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

// A new market is deliberately incomplete in the places that need a real decision (identity,
// calendar), and conservative everywhere else: disabled from automation and in simulation.
export function blankMarket(): MarketConfigInput {
  return {
    marketId: '',
    name: '',
    country: '',
    exchangeName: '',
    currency: 'USD',
    timezone: 'UTC',
    regularHours: [{ start: { hour: 9, minute: 0 }, end: { hour: 16, minute: 0 } }],
    preMarket: null,
    postMarket: null,
    weekendDays: ['saturday', 'sunday'],
    holidays: [],
    settlementDays: 2,
    fees: { commissionBps: 5, minimumCommission: '0.00', exchangeFeeBps: 0, transactionTaxBps: 0 },
    tax: {
      longTermThresholdDays: null,
      shortTermRatePercent: 30,
      longTermRatePercent: 30,
      dividendWithholdingPercent: 0,
    },
    permittedInstrumentTypes: ['long_term'],
    automationPermitted: false,
    enabled: true,
    mode: 'simulation',
  };
}

const session = (value: { start: Time; end: Time } | null): string =>
  value === null ? 'None' : `${timeText(value.start)} to ${timeText(value.end)}`;

// One line per setting, and one per holiday and session, so a diff shows exactly which item changed.
export function describeMarket(config: MarketConfigInput): Record<string, string> {
  const lines: Record<string, string> = {
    Name: config.name,
    Country: config.country,
    Exchange: config.exchangeName,
    Currency: config.currency,
    Timezone: config.timezone,
    'Pre-market': session(config.preMarket),
    'Post-market': session(config.postMarket),
    'Weekend days': config.weekendDays.map(humanizeToken).join(', ') || 'None',
    Settlement: `T+${String(config.settlementDays)}`,
    Commission: `${String(config.fees.commissionBps)} bps, minimum ${config.fees.minimumCommission} ${config.currency}`,
    'Exchange fee': `${String(config.fees.exchangeFeeBps)} bps`,
    'Transaction tax': `${String(config.fees.transactionTaxBps)} bps`,
    'Long-term holding period':
      config.tax.longTermThresholdDays === null
        ? 'No distinction'
        : `${String(config.tax.longTermThresholdDays)} days`,
    'Short-term gains tax': `${String(config.tax.shortTermRatePercent)}%`,
    'Long-term gains tax': `${String(config.tax.longTermRatePercent)}%`,
    'Dividend withholding': `${String(config.tax.dividendWithholdingPercent)}%`,
    'Permitted instrument types': config.permittedInstrumentTypes.map(humanizeToken).join(', '),
    'Automation permitted': config.automationPermitted ? 'Yes' : 'No',
    Enabled: config.enabled ? 'Yes' : 'No',
    Mode: humanizeToken(config.mode),
  };
  config.regularHours.forEach((item, index) => {
    lines[`Session ${String(index + 1)}`] = session(item);
  });
  config.holidays.forEach((holiday) => {
    lines[`Holiday ${holiday.date}`] = `${holiday.name}${holiday.isHalfDay ? ' (half day)' : ''}`;
  });
  return lines;
}

// Holidays on a weekend day are allowed (exchange calendars list them) but worth pointing out.
export function weekendHolidays(config: MarketConfigInput): readonly string[] {
  return config.holidays
    .filter((holiday) => {
      const day = new Date(`${holiday.date}T00:00:00Z`)
        .toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
        .toLowerCase();
      return config.weekendDays.includes(day as MarketConfigInput['weekendDays'][number]);
    })
    .map((holiday) => holiday.date);
}
