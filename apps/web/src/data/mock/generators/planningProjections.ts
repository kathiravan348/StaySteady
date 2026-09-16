// Goals and projections (UI spec 7.17): progress of linked holdings towards a goal and when it would
// be reached on stated assumptions, and cautious, expected and hopeful projections for scenarios.
// Monthly compounding; every number is an estimate on the owner's assumptions.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type {
  GoalInput,
  GoalViewSchema,
  ProjectionRequestDto,
  ProjectionSchema,
  ReportCurrencyDto,
} from '../../schemas';
import type { ValuationContext } from './reportValuation';

const ZERO = new Decimal(0);
const MAX_MONTHS = 600;

const monthlyRate = (annualPercent: number): Decimal =>
  new Decimal(1)
    .plus(new Decimal(annualPercent).dividedBy(100))
    .pow(new Decimal(1).dividedBy(12))
    .minus(1);

export const addMonths = (iso: string, months: number): string => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
};

const monthsBetween = (from: string, to: string): number => {
  const a = new Date(`${from}T00:00:00Z`);
  const b = new Date(`${to}T00:00:00Z`);
  return Math.max(
    0,
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth(),
  );
};

// Value after one more month: growth first, then the month's contribution.
const step = (value: Decimal, rate: Decimal, contribution: Decimal): Decimal =>
  value.times(rate.plus(1)).plus(contribution);

export function linkedValue(
  v: ValuationContext,
  instrumentIds: readonly string[],
  currency: string,
  date: string,
): Decimal {
  return v.holdings
    .filter((holding) => instrumentIds.includes(String(holding.instrumentId)))
    .reduce((sum, holding) => {
      const instrument = v.instrument(String(holding.instrumentId));
      const price = v.close(String(holding.instrumentId), date);
      if (instrument === undefined || price === null) return sum;
      return sum.plus(
        v
          .quantity(holding, date)
          .times(price)
          .times(v.fx(instrument.currency, currency, date)),
      );
    }, ZERO);
}

// The whole portfolio's value on the date, the starting point for scenario projections.
export function currentPortfolioValue(
  v: ValuationContext,
  currency: string,
  date: string,
): Decimal {
  return linkedValue(
    v,
    v.holdings.map((holding) => String(holding.instrumentId)),
    currency,
    date,
  );
}

export function buildGoalView(
  goal: GoalInput,
  v: ValuationContext,
  today: string,
): z.input<typeof GoalViewSchema> {
  const currency = goal.targetAmount.currency;
  const current = linkedValue(v, goal.linkedInstrumentIds, currency, today);
  const target = new Decimal(goal.targetAmount.amount);
  const contribution = new Decimal(goal.monthlyContribution.amount);
  const rate = monthlyRate(goal.expectedReturnPercent);
  const horizon = monthsBetween(today, goal.targetDate);

  let value = current;
  let completion: string | null = current.gte(target) ? today : null;
  let atTarget = current;
  const points: { date: string; value: number }[] = [
    { date: today, value: Number(current.toFixed(2)) },
  ];
  // Month by month until both the target date and the goal are reached (or 50 years pass), keeping a
  // point each quarter and at the target date for the chart.
  for (
    let month = 1;
    month <= MAX_MONTHS && (month <= horizon || completion === null);
    month += 1
  ) {
    value = step(value, rate, contribution);
    if (month === horizon) atTarget = value;
    if (completion === null && value.gte(target)) completion = addMonths(today, month);
    if (month % 3 === 0 || month === horizon) {
      points.push({ date: addMonths(today, month), value: Number(value.toFixed(2)) });
    }
  }

  return {
    goal,
    current: { amount: current.toFixed(2), currency },
    progressPercent: target.isZero()
      ? 0
      : Number(Decimal.min(current.dividedBy(target).times(100), 100).toFixed(1)),
    projectedAtTarget: { amount: atTarget.toFixed(2), currency },
    projectedCompletion: completion,
    onTrack: completion !== null && completion <= goal.targetDate,
    projection: points,
  };
}

export function buildProjection(
  request: ProjectionRequestDto,
  start: Decimal,
  today: string,
): z.input<typeof ProjectionSchema> {
  const currency: ReportCurrencyDto = request.currency;
  const months = request.years * 12;
  const contribution = new Decimal(request.monthlyContribution);
  const dates = Array.from({ length: request.years + 1 }, (_, year) => addMonths(today, year * 12));
  const inflation = new Decimal(1)
    .plus(new Decimal(request.inflationPercent).dividedBy(100))
    .pow(request.years);
  const cases = [
    { name: 'Cautious', returnPercent: request.expectedReturnPercent - request.spreadPercent },
    { name: 'Expected', returnPercent: request.expectedReturnPercent },
    { name: 'Hopeful', returnPercent: request.expectedReturnPercent + request.spreadPercent },
  ].map((item) => {
    const rate = monthlyRate(item.returnPercent);
    let value = start;
    const values = [Number(start.toFixed(2))];
    for (let month = 1; month <= months; month += 1) {
      value = step(value, rate, contribution);
      if (month % 12 === 0) values.push(Number(value.toFixed(2)));
    }
    return {
      ...item,
      values,
      final: { amount: value.toFixed(2), currency },
      finalReal: { amount: value.dividedBy(inflation).toFixed(2), currency },
    };
  });
  return {
    currency,
    start: { amount: start.toFixed(2), currency },
    dates,
    cases,
    contributed: { amount: contribution.times(months).toFixed(2), currency },
  };
}

// The seeded goals. Targets are the owner's to set; these are examples to edit or delete.
export function seedGoals(today: string): GoalInput[] {
  return [
    {
      id: 'goal-house-deposit',
      name: 'House deposit',
      targetAmount: { amount: '90000.00', currency: 'USD' },
      targetDate: addMonths(today, 34),
      linkedInstrumentIds: ['inst-us-aapl', 'inst-us-spy'],
      monthlyContribution: { amount: '800.00', currency: 'USD' },
      expectedReturnPercent: 6,
    },
    {
      id: 'goal-retirement',
      name: 'Retirement top-up',
      targetAmount: { amount: '400000.00', currency: 'USD' },
      targetDate: addMonths(today, 12 * 19),
      linkedInstrumentIds: ['inst-us-spy', 'inst-us-gold'],
      monthlyContribution: { amount: '600.00', currency: 'USD' },
      expectedReturnPercent: 7,
    },
  ];
}
