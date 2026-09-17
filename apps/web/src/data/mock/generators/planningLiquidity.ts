// Liquidity plan seed and the view built from it (E-07; requirements 29, 30). The ladder uses the
// same liquidity classes as Holdings (days, weeks, months or longer) plus trading cash; the reserve is
// held outside the trading accounts and never added to the ladder. Pure.

import { Decimal } from 'decimal.js';

import type {
  HoldingDto,
  InstrumentDto,
  InstrumentTypeConfigInput,
  LiquidityPlanInput,
  LiquidityViewDto,
  MarketConfigInput,
  StrategyDto,
} from '../../schemas';
import { LiquidityViewSchema } from '../../schemas';
import type { FxQuote } from '../../../shared/money';
import { convertMoneyWithTable, createMoney } from '../../../shared/money';
import { liquidityOf } from '../../../shared/liquidity/liquidityClass';
import type { CurrencyCode } from '../../../shared/types/currency';
import { addDays } from './reportValuation';
import { parseGenerated } from './validated';

const DAY_MS = 86_400_000;
// Settling a sale takes a few business days; weeks and months buckets become available later.
const BUCKET_READY_DAYS = { cash: 0, days: 3, weeks: 30, months: 180 } as const;

export function seedLiquidityPlan(today: string): LiquidityPlanInput {
  return {
    currency: 'USD',
    reserve: {
      monthlyExpenses: '3500.00',
      targetMonths: 6,
      heldAmount: '16000.00',
      heldWhere: 'Savings account outside the brokers',
    },
    commitments: [
      {
        id: 'commit-renovation',
        label: 'Home renovation',
        dueDate: addDays(today, 45),
        amount: '12000.00',
      },
      {
        id: 'commit-tuition',
        label: 'Tuition fees',
        dueDate: addDays(today, 200),
        amount: '25000.00',
      },
      {
        id: 'commit-car',
        label: 'Car replacement',
        dueDate: addDays(today, 420),
        amount: '30000.00',
      },
    ],
    withdrawal: { enabled: false, startDate: null, annualAmount: '24000.00' },
    automationCeilingPercent: 30,
  };
}

export interface LiquidityInputs {
  readonly today: string;
  readonly holdings: readonly HoldingDto[];
  readonly cash: { readonly amount: string; readonly currency: CurrencyCode };
  readonly instrument: (id: string) => InstrumentDto | undefined;
  readonly markets: readonly MarketConfigInput[];
  readonly instrumentTypes: readonly InstrumentTypeConfigInput[];
  readonly strategies: readonly StrategyDto[];
  readonly fxTable: readonly FxQuote[];
}

export function buildLiquidityView(
  plan: LiquidityPlanInput,
  inputs: LiquidityInputs,
): LiquidityViewDto {
  const currency: CurrencyCode = plan.currency;
  const money = (value: Decimal): { amount: string; currency: CurrencyCode } => ({
    amount: value.toFixed(2),
    currency,
  });
  const inPlan = (amount: string, from: CurrencyCode): Decimal =>
    convertMoneyWithTable(createMoney(amount, from), currency, inputs.fxTable).amount;

  const buckets = {
    cash: inPlan(inputs.cash.amount, inputs.cash.currency),
    days: new Decimal(0),
    weeks: new Decimal(0),
    months: new Decimal(0),
  };
  let automated = new Decimal(0);
  let invested = new Decimal(0);
  for (const holding of inputs.holdings) {
    const instrument = inputs.instrument(String(holding.instrumentId));
    const value = inPlan(holding.currentValue.amount, holding.currentValue.currency);
    invested = invested.plus(value);
    const typeConfig = inputs.instrumentTypes.find((item) => item.type === instrument?.type);
    const market = inputs.markets.find((item) => item.marketId === String(instrument?.marketId));
    const { liquidityClass } = liquidityOf({
      settlementDays: typeConfig?.settlementDays ?? market?.settlementDays ?? 2,
      manualOnly: typeConfig?.manualOnly ?? false,
    });
    buckets[liquidityClass] = buckets[liquidityClass].plus(value);
    const stage = inputs.strategies.find(
      (item) => String(item.id) === holding.openedByStrategyId,
    )?.stage;
    if (stage === 'semi_automatic' || stage === 'fully_automatic')
      automated = automated.plus(value);
  }

  let running = new Decimal(0);
  const ladder = (['cash', 'days', 'weeks', 'months'] as const).map((bucket) => {
    running = running.plus(buckets[bucket]);
    return { bucket, value: money(buckets[bucket]), cumulative: money(running) };
  });

  let committed = new Decimal(0);
  const commitments = [...plan.commitments]
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
    .map((item) => {
      const daysUntil = Math.round(
        (Date.parse(`${String(item.dueDate)}T00:00:00Z`) -
          Date.parse(`${inputs.today}T00:00:00Z`)) /
          DAY_MS,
      );
      const reachable = (Object.keys(BUCKET_READY_DAYS) as (keyof typeof BUCKET_READY_DAYS)[])
        .filter((bucket) => daysUntil >= BUCKET_READY_DAYS[bucket])
        .reduce((sum, bucket) => sum.plus(buckets[bucket]), new Decimal(0));
      const availableBy = Decimal.max(reachable.minus(committed), 0);
      const due = new Decimal(item.amount);
      committed = committed.plus(due);
      return {
        id: item.id,
        label: item.label,
        dueDate: item.dueDate,
        daysUntil,
        amount: money(due),
        availableBy: money(availableBy),
        isCovered: availableBy.gte(due),
      };
    });

  const monthly = new Decimal(plan.reserve.monthlyExpenses);
  const held = new Decimal(plan.reserve.heldAmount);
  const target = monthly.times(plan.reserve.targetMonths);
  const annual = new Decimal(plan.withdrawal.annualAmount);
  const total = invested.plus(buckets.cash);
  const share = total.isZero() ? new Decimal(0) : automated.dividedBy(total).times(100);

  return parseGenerated(
    LiquidityViewSchema,
    {
      plan,
      reserve: {
        monthsCovered: monthly.isZero() ? 0 : held.dividedBy(monthly).toDecimalPlaces(1).toNumber(),
        shortfall: money(Decimal.max(target.minus(held), 0)),
        status: held.gte(target) ? 'funded' : 'below_target',
      },
      ladder,
      commitments,
      withdrawal: {
        yearsCovered: annual.isZero()
          ? null
          : total.dividedBy(annual).toDecimalPlaces(1).toNumber(),
        withdrawalRatePercent: total.isZero()
          ? null
          : annual.dividedBy(total).times(100).toDecimalPlaces(2).toNumber(),
      },
      automation: {
        automatedValue: money(automated),
        sharePercent: share.toDecimalPlaces(1).toNumber(),
        isAboveCeiling: share.gt(plan.automationCeilingPercent),
      },
    },
    'liquidity view',
  );
}
