// Builds the decision journal (requirements 29; UI spec 19.1) from the seeded history, the limit
// changes made on the risk panel and the approval decisions made in the queue. Outcomes and context
// come from the same price history and holdings the portfolio screens use.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type { JournalSchema, RiskChangeDto } from '../../schemas';
import type { JournalSeed } from './journalSeeds';
import { portfolioValue } from './journalSeeds';
import type { ValuationContext } from './reportValuation';
import { addDays, daysBetween } from './reportValuation';

type Journal = z.input<typeof JournalSchema>;
type Entry = Journal['entries'][number];

const WINDOW_DAYS = 30;
const LOSS_PERCENT = -3;
const PATTERN_DAYS = 180;

export interface JournalDecision {
  readonly id: string;
  readonly at: string;
  readonly status: 'approved' | 'rejected';
  readonly reason: string | null;
  readonly instrumentId: string;
  readonly side: 'buy' | 'sell';
  readonly quantity: string;
  readonly strategyName: string | null;
}

export interface JournalInputs {
  readonly v: ValuationContext;
  readonly today: string;
  readonly now: string;
  readonly seeds: readonly JournalSeed[];
  readonly riskChanges: readonly RiskChangeDto[];
  readonly decisions: readonly JournalDecision[];
  readonly typeTargets: ReadonlyMap<string, number>;
  readonly tolerancePercent: number;
  readonly reviews: ReadonlyMap<string, { note: string; at: string }>;
}

const pct = (from: Decimal | null, to: Decimal | null): number | null =>
  from === null || to === null || from.isZero()
    ? null
    : Number(to.minus(from).dividedBy(from).times(100).toFixed(1));

const moved = (change: number): string =>
  `${change >= 0 ? 'risen' : 'fallen'} ${Math.abs(change).toFixed(1)}%`;

function outcome(
  v: ValuationContext,
  instrumentId: string | null,
  side: 'buy' | 'sell',
  date: string,
  today: string,
  what: string,
): Entry['outcome'] {
  const symbol = instrumentId === null ? undefined : v.instrument(instrumentId)?.symbol;
  const start = instrumentId === null ? null : v.close(instrumentId, date);
  if (instrumentId === null || symbol === undefined || start === null) {
    return {
      status: 'not_measured',
      summary: 'Not measured by a price: this applied to the whole portfolio.',
      changePercent: null,
      verdict: null,
      windowDays: WINDOW_DAYS,
    };
  }
  const age = daysBetween(date, today);
  if (age < WINDOW_DAYS) {
    const sofar = pct(start, v.close(instrumentId, today)) ?? 0;
    return {
      status: 'pending',
      summary: `Known in ${String(WINDOW_DAYS - age)} days. So far ${symbol} has ${moved(sofar)}.`,
      changePercent: sofar,
      verdict: null,
      windowDays: WINDOW_DAYS,
    };
  }
  const change = pct(start, v.close(instrumentId, addDays(date, WINDOW_DAYS))) ?? 0;
  const withIt = side === 'buy' ? change > 0 : change < 0;
  return {
    status: 'known',
    summary: `${symbol} had ${moved(change)} ${String(WINDOW_DAYS)} days after ${what}.`,
    changePercent: change,
    verdict: withIt ? 'with' : 'against',
    windowDays: WINDOW_DAYS,
  };
}

function context(
  inputs: JournalInputs,
  instrumentId: string | null,
  side: 'buy' | 'sell' | null,
  date: string,
): Entry['context'] {
  const { v } = inputs;
  const change = pct(portfolioValue(v, addDays(date, -7)), portfolioValue(v, date));
  const instrument = instrumentId === null ? undefined : v.instrument(instrumentId);
  let againstTargets = false;
  if (instrument !== undefined && side !== null) {
    const values = v.holdings.map((holding) => ({
      type: v.instrument(String(holding.instrumentId))?.type,
      value: v.holdingValue(holding, date, 'USD'),
    }));
    const total = values.reduce((sum, item) => sum.plus(item.value), new Decimal(0));
    const ofType = values
      .filter((item) => item.type === instrument.type)
      .reduce((sum, item) => sum.plus(item.value), new Decimal(0));
    const share = total.isZero() ? 0 : ofType.dividedBy(total).times(100).toNumber();
    const target = inputs.typeTargets.get(instrument.type) ?? 0;
    againstTargets =
      side === 'buy'
        ? share > target + inputs.tolerancePercent
        : share < target - inputs.tolerancePercent;
  }
  return {
    portfolioChange7dPercent: change,
    afterLoss: change !== null && change <= LOSS_PERCENT,
    againstTargets,
  };
}

function entries(inputs: JournalInputs): Entry[] {
  const { v, today } = inputs;
  const review = (id: string): Entry['review'] => inputs.reviews.get(id) ?? null;
  const seeded = inputs.seeds.map((seed): Entry => {
    const date = addDays(today, -seed.daysAgo);
    const instrument = seed.instrumentId === null ? undefined : v.instrument(seed.instrumentId);
    const price = seed.instrumentId === null ? null : v.close(seed.instrumentId, date);
    const base = {
      id: seed.id,
      at: `${date}T10:30:00.000Z`,
      reason: seed.reason,
      instrumentId: seed.instrumentId,
      symbol: instrument?.symbol ?? null,
      strategyName: null,
      price:
        price === null || instrument === undefined
          ? null
          : { amount: price.toFixed(2), currency: instrument.currency },
      review: review(seed.id),
    };
    if (seed.kind === 'limit_override') {
      return {
        ...base,
        kind: 'limit_override',
        title: `${seed.limitName} overridden. ${seed.detail}`,
        side: null,
        quantity: null,
        limitName: seed.limitName,
        override: true,
        outcome: outcome(v, seed.instrumentId, 'buy', date, today, 'the override'),
        context: context(inputs, null, null, date),
      };
    }
    return {
      ...base,
      kind: 'manual_trade',
      title: `${seed.side === 'buy' ? 'Bought' : 'Sold'} ${seed.quantity} ${instrument?.symbol ?? seed.instrumentId}`,
      side: seed.side,
      quantity: seed.quantity,
      limitName: null,
      override: false,
      outcome: outcome(
        v,
        seed.instrumentId,
        seed.side,
        date,
        today,
        seed.side === 'buy' ? 'the purchase' : 'the sale',
      ),
      context: context(inputs, seed.instrumentId, seed.side, date),
    };
  });

  const limitChanges = inputs.riskChanges
    .filter((change) => change.kind === 'limit_changed')
    .map((change): Entry => {
      const limitName = change.title.split(' changed')[0] ?? change.title;
      return {
        id: change.id,
        at: String(change.at),
        kind: 'limit_override',
        title: `${change.title}. ${change.detail}`,
        reason: change.reason,
        instrumentId: null,
        symbol: null,
        strategyName: null,
        side: null,
        quantity: null,
        price: null,
        limitName,
        override: true,
        outcome: outcome(v, null, 'buy', today, today, ''),
        context: context(inputs, null, null, today),
        review: review(change.id),
      };
    });

  const decided = inputs.decisions.map((decision): Entry => {
    const instrument = v.instrument(decision.instrumentId);
    const price = v.close(decision.instrumentId, today);
    const verb = decision.status === 'approved' ? 'Approved' : 'Rejected';
    return {
      id: decision.id,
      at: decision.at,
      kind: 'approval_decision',
      title: `${verb}: ${decision.side} ${decision.quantity} ${instrument?.symbol ?? decision.instrumentId}`,
      reason: decision.reason,
      instrumentId: decision.instrumentId,
      symbol: instrument?.symbol ?? null,
      strategyName: decision.strategyName,
      side: decision.side,
      quantity: decision.quantity,
      price:
        price === null || instrument === undefined
          ? null
          : { amount: price.toFixed(2), currency: instrument.currency },
      limitName: null,
      override: false,
      outcome: outcome(v, decision.instrumentId, decision.side, today, today, ''),
      context: context(inputs, decision.instrumentId, decision.side, today),
      review: review(decision.id),
    };
  });

  return [...seeded, ...limitChanges, ...decided].sort((a, b) => b.at.localeCompare(a.at));
}

function patterns(all: readonly Entry[], today: string): Journal['patterns'] {
  const recent = all.filter((entry) => daysBetween(entry.at.slice(0, 10), today) <= PATTERN_DAYS);
  const found: Journal['patterns'] = [];

  const byLimit = new Map<string, Entry[]>();
  recent
    .filter((entry) => entry.override && entry.limitName !== null)
    .forEach((entry) => {
      const key = entry.limitName ?? '';
      byLimit.set(key, [...(byLimit.get(key) ?? []), entry]);
    });
  byLimit.forEach((items, limit) => {
    if (items.length < 2) return;
    found.push({
      id: `repeat-${limit}`,
      kind: 'override_repetition',
      title: `${limit} overridden ${String(items.length)} times`,
      detail: `In the last ${String(PATTERN_DAYS)} days. Each override was a one-off at the time; together they move the limit for good.`,
      entryIds: items.map((item) => item.id),
    });
  });

  const afterLoss = recent.filter(
    (entry) => entry.kind === 'manual_trade' && entry.context.afterLoss,
  );
  if (afterLoss.length >= 2) {
    found.push({
      id: 'post-loss',
      kind: 'post_loss_clustering',
      title: `${String(afterLoss.length)} manual trades within a week of a portfolio fall`,
      detail: `Each came after the portfolio fell ${String(Math.abs(LOSS_PERCENT))}% or more in the previous seven days.`,
      entryIds: afterLoss.map((item) => item.id),
    });
  }

  const drift = recent.filter(
    (entry) => entry.kind === 'manual_trade' && entry.context.againstTargets,
  );
  if (drift.length >= 2) {
    found.push({
      id: 'target-drift',
      kind: 'target_drift',
      title: `${String(drift.length)} manual trades moved away from your allocation targets`,
      detail:
        'Each bought a type already above its target, or sold one already below it, beyond the tolerance.',
      entryIds: drift.map((item) => item.id),
    });
  }
  return found;
}

export function buildJournal(inputs: JournalInputs): Journal {
  const all = entries(inputs);
  return { asOf: inputs.now, entries: all, patterns: patterns(all, inputs.today) };
}
