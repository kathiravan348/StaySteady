// Market configuration seeds and health (UI spec 7.18). Identity, hours and calendars come from the
// canonical markets; commission comes from the cost defaults the backtest setup already uses, so a
// market's fees are the same number on both screens.

import type { ConfigHealthDto, MarketConfigInput } from '../../schemas';
import { generateMarketCostDefaults } from './backtestSetup';
import { getCanonicalMarkets } from './markets';

const DAY_MS = 86_400_000;
const CALENDAR_WARNING_DAYS = 60;

interface MarketSeed {
  readonly exchangeFeeBps: number;
  readonly transactionTaxBps: number;
  readonly dividendWithholdingPercent: number;
  // Only dates after the canonical calendar's last entry: earlier ones would change price history.
  readonly upcomingHolidays: readonly { date: string; name: string }[];
}

// Withholding rates are what each market deducts at source from dividends paid to a non-resident.
const SEEDS: Readonly<Record<string, MarketSeed>> = {
  US: {
    exchangeFeeBps: 0.3,
    transactionTaxBps: 0,
    dividendWithholdingPercent: 25,
    upcomingHolidays: [
      { date: '2026-11-26', name: 'Thanksgiving Day' },
      { date: '2026-12-25', name: 'Christmas Day' },
    ],
  },
  IN: {
    exchangeFeeBps: 0.35,
    transactionTaxBps: 10,
    dividendWithholdingPercent: 10,
    upcomingHolidays: [
      { date: '2026-10-02', name: 'Gandhi Jayanti' },
      { date: '2026-12-25', name: 'Christmas' },
    ],
  },
  UK: {
    exchangeFeeBps: 0.45,
    transactionTaxBps: 50,
    dividendWithholdingPercent: 0,
    upcomingHolidays: [],
  },
  JP: {
    exchangeFeeBps: 0.2,
    transactionTaxBps: 0,
    dividendWithholdingPercent: 15.315,
    upcomingHolidays: [],
  },
  SG: {
    exchangeFeeBps: 0.75,
    transactionTaxBps: 0,
    dividendWithholdingPercent: 0,
    upcomingHolidays: [],
  },
};

export function seedMarketConfigs(): readonly MarketConfigInput[] {
  const costs = generateMarketCostDefaults();
  return getCanonicalMarkets().map((market) => {
    const id = String(market.marketId);
    const seed = SEEDS[id] ?? SEEDS['SG'];
    const cost = costs.find((item) => String(item.marketId) === id);
    const holidays = [
      ...market.holidays.map((holiday) => ({
        date: String(holiday.date),
        name: holiday.name,
        isHalfDay: holiday.isHalfDay,
      })),
      ...(seed?.upcomingHolidays ?? []).map((holiday) => ({ ...holiday, isHalfDay: false })),
    ];
    return {
      marketId: id,
      name: market.name,
      country: market.country,
      exchangeName: market.exchangeName,
      currency: market.currency,
      timezone: market.timezone as MarketConfigInput['timezone'],
      regularHours: market.regularHours.map((session) => ({ ...session })),
      preMarket: market.preMarket ?? null,
      postMarket: market.postMarket ?? null,
      weekendDays: [...market.weekendDays],
      holidays,
      settlementDays: market.settlementDays,
      fees: {
        commissionBps: cost?.costs.commissionBps ?? 5,
        minimumCommission: cost?.costs.minimumCommission.amount ?? '0.00',
        exchangeFeeBps: seed?.exchangeFeeBps ?? 0,
        transactionTaxBps: seed?.transactionTaxBps ?? 0,
      },
      tax: { dividendWithholdingPercent: seed?.dividendWithholdingPercent ?? 0 },
      permittedInstrumentTypes: [...market.permittedInstrumentTypes],
      automationPermitted: market.automationPermitted,
      enabled: true,
      mode: 'live',
    };
  });
}

// Earlier versions whose differences are real events, so diff and revert have something true to
// show: the US move to T+1 settlement, and the treaty rate on US dividends.
export function seedMarketHistory(
  current: MarketConfigInput,
): readonly { version: number; savedAt: string; reason: string; snapshot: MarketConfigInput }[] {
  if (current.marketId === 'US') {
    return [
      {
        version: 2,
        savedAt: '2024-05-28T00:00:00.000Z',
        reason: 'US equities moved to T+1 settlement.',
        snapshot: current,
      },
      {
        version: 1,
        savedAt: '2024-01-02T00:00:00.000Z',
        reason: 'Initial configuration.',
        snapshot: { ...current, settlementDays: 2 },
      },
    ];
  }
  if (current.marketId === 'IN') {
    return [
      {
        version: 2,
        savedAt: '2024-07-23T00:00:00.000Z',
        reason: 'Treaty rate applied: Indian dividends to non-residents withheld at 10%, was 20%.',
        snapshot: current,
      },
      {
        version: 1,
        savedAt: '2024-01-02T00:00:00.000Z',
        reason: 'Initial configuration.',
        snapshot: {
          ...current,
          tax: { dividendWithholdingPercent: 20 },
        },
      },
    ];
  }
  return [
    {
      version: 1,
      savedAt: '2024-01-02T00:00:00.000Z',
      reason: 'Initial configuration.',
      snapshot: current,
    },
  ];
}

// A market without future holidays cannot know when it will be closed, so the calendar's reach is
// the health check that matters most.
export function marketConfigHealth(config: MarketConfigInput, nowMs: number): ConfigHealthDto {
  const today = new Date(nowMs).toISOString().slice(0, 10);
  const dates = config.holidays.map((holiday) => holiday.date).sort();
  const lastDate = dates[dates.length - 1];
  if (lastDate === undefined) {
    return { status: 'critical', summary: 'No holiday calendar, so closures are unknown.' };
  }
  if (lastDate <= today) {
    return {
      status: 'critical',
      summary: `Holiday calendar ran out on ${lastDate}; upcoming closures are unknown.`,
    };
  }
  const daysLeft = Math.floor((new Date(`${lastDate}T00:00:00Z`).getTime() - nowMs) / DAY_MS);
  return daysLeft < CALENDAR_WARNING_DAYS
    ? { status: 'warning', summary: `Holiday calendar only runs to ${lastDate}.` }
    : { status: 'healthy', summary: `Holiday calendar runs to ${lastDate}.` };
}
