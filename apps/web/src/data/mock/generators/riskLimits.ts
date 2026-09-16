// Risk limits and what they are measured against (UI spec 7.14). Usage is derived from the same
// holdings, prices, FX rates, orders and strategy definitions the other screens show, so a limit
// breached here is the reason a signal was blocked or an approval failed its checks there.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type { FxQuote } from '../../../shared/money';
import type { HoldingDto, OrderDto, RiskLimitDto } from '../../schemas';
import { RiskLimitSchema } from '../../schemas';
import { generateCurrentFxRates } from './fxHistory';
import { getInstrumentById } from './instruments';
import { getMarketById } from './markets';
import type { MockGeneratorContext } from './mockContext';
import { generatePortfolioData } from './portfolio';
import { groupLimitSpecs, type LimitSpec } from './riskGroupLimits';
import { BASE, largest, losses, pct, sumBy } from './riskMeasures';
import { parseGeneratedList } from './validated';

type LimitInput = z.input<typeof RiskLimitSchema>;

function limit(spec: LimitSpec, overrides: ReadonlyMap<string, number>): LimitInput {
  const threshold = overrides.get(spec.id) ?? spec.threshold;
  const direction = spec.direction ?? 'maximum';
  const isBreached =
    spec.used === null
      ? false
      : direction === 'maximum'
        ? spec.used > threshold
        : spec.used < threshold;
  return { ...spec, threshold, direction, isBreached, isEditable: spec.isEditable ?? true };
}

export interface RiskLimitInputs {
  readonly orders: readonly OrderDto[];
  readonly overrides: ReadonlyMap<string, number>;
  // The safety-breach developer scenario simulates a weekly loss past its limit.
  readonly isSafetyBreach: boolean;
}

export function generateRiskLimits(
  ctx: MockGeneratorContext,
  inputs: RiskLimitInputs,
): readonly RiskLimitDto[] {
  const { orders, overrides, isSafetyBreach } = inputs;
  const { holdings, summary } = generatePortfolioData(ctx);
  const fx: readonly FxQuote[] = generateCurrentFxRates(ctx).map((rate) => ({
    from: rate.from,
    to: rate.to,
    rate: new Decimal(rate.rate),
  }));
  const invested = new Decimal(summary.totalValue.amount);
  const cash = new Decimal(summary.cashBalance.amount);
  const capital = invested.plus(cash);

  const symbolOf = (holding: HoldingDto): string =>
    getInstrumentById(String(holding.instrumentId))?.symbol ?? String(holding.instrumentId);
  const marketOf = (holding: HoldingDto): string =>
    String(getInstrumentById(String(holding.instrumentId))?.marketId ?? 'unknown');
  const typeOf = (holding: HoldingDto): string =>
    getInstrumentById(String(holding.instrumentId))?.type ?? 'unknown';
  const countryOf = (holding: HoldingDto): string =>
    getMarketById(marketOf(holding))?.country ?? 'Unknown';

  const topInstrument = largest(sumBy(holdings, symbolOf));
  const topCountry = largest(sumBy(holdings, countryOf));
  const loss = losses(ctx, holdings, cash, fx);
  const weeklyLoss = isSafetyBreach ? 5.6 : loss.weekly;
  const today = String(ctx.referenceTime).slice(0, 10);
  const ordersToday = orders.filter((order) => String(order.createdAt).startsWith(today)).length;
  const deployed = capital.isZero() ? 0 : Number(invested.dividedBy(capital).times(100).toFixed(2));

  const specs: LimitSpec[] = [
    {
      id: 'global-instrument',
      group: 'global',
      scopeLabel: 'Whole portfolio',
      name: 'Maximum in any one instrument',
      unit: 'percent',
      threshold: 45,
      used: topInstrument.share,
      currency: null,
      measuredBy: `${topInstrument.key}, ${pct(topInstrument.share)} of holdings`,
      consequence: 'New buys in that instrument are blocked.',
      minimum: 1,
      maximum: 100,
    },
    {
      id: 'global-sector',
      group: 'global',
      scopeLabel: 'Whole portfolio',
      name: 'Maximum in any one sector',
      unit: 'percent',
      threshold: 35,
      used: null,
      currency: null,
      measuredBy:
        'Instruments carry no sector classification yet, so sector exposure cannot be measured.',
      consequence: 'Would block new buys in the sector once sectors are recorded.',
      isEditable: false,
      minimum: 1,
      maximum: 100,
    },
    {
      id: 'global-country',
      group: 'global',
      scopeLabel: 'Whole portfolio',
      name: 'Maximum in any one country',
      unit: 'percent',
      threshold: 97,
      used: topCountry.share,
      currency: null,
      measuredBy: `${topCountry.key}, ${pct(topCountry.share)} of holdings. Each market here is one country, so this matches that market's exposure.`,
      consequence: 'New buys in that country are blocked.',
      minimum: 1,
      maximum: 100,
    },
    {
      id: 'global-deployed',
      group: 'global',
      scopeLabel: 'Whole portfolio',
      name: 'Total deployed capital ceiling',
      unit: 'percent',
      threshold: 95,
      used: deployed,
      currency: null,
      measuredBy: `${pct(deployed)} of ${capital.toFixed(2)} ${BASE} capital is invested`,
      consequence: 'All new buys are blocked.',
      minimum: 10,
      maximum: 100,
    },
    {
      id: 'global-cash-reserve',
      group: 'global',
      scopeLabel: 'Whole portfolio',
      name: 'Mandatory cash reserve',
      unit: 'money',
      direction: 'minimum',
      threshold: 10000,
      used: Number(cash.toFixed(2)),
      currency: BASE,
      measuredBy: `${cash.toFixed(2)} ${BASE} held in cash`,
      consequence: 'A buy that would take cash below the reserve is blocked.',
      minimum: 0,
      maximum: Number(capital.toFixed(0)),
    },
    {
      id: 'global-loss-daily',
      group: 'global',
      scopeLabel: 'Whole portfolio',
      name: 'Daily loss limit',
      unit: 'percent',
      threshold: 2,
      used: loss.daily,
      currency: null,
      measuredBy:
        loss.daily === 0
          ? 'Today is a gain, so nothing counts against this limit'
          : `Down ${pct(loss.daily)} today`,
      consequence: 'New buying pauses across every strategy for the rest of the day.',
      minimum: 0.5,
      maximum: 50,
    },
    {
      id: 'global-loss-weekly',
      group: 'global',
      scopeLabel: 'Whole portfolio',
      name: 'Weekly loss limit',
      unit: 'percent',
      threshold: 5,
      used: weeklyLoss,
      currency: null,
      measuredBy: isSafetyBreach
        ? 'Down 5.60% over five sessions (simulated by the safety-breach developer scenario)'
        : weeklyLoss === 0
          ? 'The last five sessions were a gain'
          : `Down ${pct(weeklyLoss)} over five sessions`,
      consequence: 'All automation stops until the owner resumes it.',
      minimum: 0.5,
      maximum: 50,
    },
    {
      id: 'global-loss-monthly',
      group: 'global',
      scopeLabel: 'Whole portfolio',
      name: 'Monthly loss limit',
      unit: 'percent',
      threshold: 8,
      used: loss.monthly,
      currency: null,
      measuredBy:
        loss.monthly === 0
          ? 'The last 21 sessions were a gain'
          : `Down ${pct(loss.monthly)} over 21 sessions`,
      consequence: 'All automation stops and every strategy drops to observation.',
      minimum: 0.5,
      maximum: 50,
    },
    {
      id: 'global-orders-day',
      group: 'global',
      scopeLabel: 'Whole portfolio',
      name: 'Orders per day',
      unit: 'count',
      threshold: 20,
      used: ordersToday,
      currency: null,
      measuredBy: `${String(ordersToday)} orders created today`,
      consequence: 'Further orders today are refused.',
      minimum: 1,
      maximum: 500,
    },
    {
      id: 'global-cooldown',
      group: 'global',
      scopeLabel: 'Whole portfolio',
      name: 'Repeat-action cooldown',
      unit: 'minutes',
      threshold: 30,
      used: null,
      currency: null,
      measuredBy: 'Minutes before the same instrument can be traded in the same direction again.',
      consequence: 'A repeat order inside the window is refused.',
      minimum: 0,
      maximum: 1440,
    },
  ];

  specs.push(...groupLimitSpecs(ctx, holdings, { symbolOf, marketOf, typeOf }));

  return parseGeneratedList(
    RiskLimitSchema,
    specs.map((spec) => limit(spec, overrides)),
    'RiskLimit',
  );
}
