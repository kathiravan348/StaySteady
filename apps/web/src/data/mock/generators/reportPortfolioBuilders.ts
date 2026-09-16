// Performance and allocation reports (UI spec 7.16; attribution is in reportAttribution.ts), valued from lots, price
// history and FX history. Returns are time-weighted: each step's return excludes money added.

import { Decimal } from 'decimal.js';

import type { HoldingDto } from '../../schemas';
import { instrumentTypeLabel } from '../../../shared/format';
import { CANONICAL_BROKERS } from './brokers';
import type { BuildInput, ReportParts, TableInput } from './reportParts';
import { column, dayOf, metric, moneyCell, percentCell, textCell } from './reportParts';
import { sampleDates } from './reportValuation';

const ZERO = new Decimal(0);
const BENCHMARK_ID = 'inst-us-spy';
export const BENCHMARK_NAME = 'S&P 500 (SPY)';

// Money added to a holding in (after, through]: purchases at cost including fees, converted on the day.
export function contributions(
  input: BuildInput,
  holding: HoldingDto | null,
  after: string,
  through: string,
): Decimal {
  const { v, currency } = input;
  return v.transactions
    .filter(
      (tx) =>
        tx.type === 'buy' &&
        (holding === null || String(tx.instrumentId) === String(holding.instrumentId)) &&
        dayOf(tx.timestamp) > after &&
        dayOf(tx.timestamp) <= through,
    )
    .reduce(
      (sum, tx) =>
        sum.plus(
          new Decimal(tx.netAmount.amount).times(
            v.fx(tx.netAmount.currency, currency, dayOf(tx.timestamp)),
          ),
        ),
      ZERO,
    );
}

const portfolioValue = (input: BuildInput, date: string): Decimal =>
  input.v.holdings.reduce(
    (sum, holding) => sum.plus(input.v.holdingValue(holding, date, input.currency)),
    ZERO,
  );

function benchmarkReturn(input: BuildInput): Decimal | null {
  const { v, from, to, currency } = input;
  const start = v.close(BENCHMARK_ID, from);
  const end = v.close(BENCHMARK_ID, to);
  if (start === null || end === null || start.isZero()) return null;
  return end
    .times(v.fx('USD', currency, to))
    .dividedBy(start.times(v.fx('USD', currency, from)))
    .minus(1)
    .times(100);
}

export function performanceReport(input: BuildInput): ReportParts {
  const { v, from, to, currency } = input;
  const dates = sampleDates(from, to);
  const values = dates.map((date) => portfolioValue(input, date));
  const index: number[] = [100];
  for (let i = 1; i < dates.length; i += 1) {
    const previous = values[i - 1] ?? ZERO;
    const current = values[i] ?? ZERO;
    const last = index[i - 1] ?? 100;
    const flow = contributions(input, null, dates[i - 1] ?? from, dates[i] ?? to);
    const step = previous.isZero() ? ZERO : current.minus(flow).dividedBy(previous).minus(1);
    index.push(Number(new Decimal(last).times(step.plus(1)).toFixed(4)));
  }
  const startValue = values[0] ?? ZERO;
  const endValue = values[values.length - 1] ?? ZERO;
  const added = contributions(input, null, from, to);
  const gain = endValue.minus(startValue).minus(added);
  const twr = new Decimal(index[index.length - 1] ?? 100).minus(100);

  // Currency effect on units held for the whole period: the price at the end, revalued at the end
  // exchange rate instead of the start rate.
  const currencyEffect = v.holdings.reduce((sum, holding) => {
    const instrument = v.instrument(String(holding.instrumentId));
    const price = v.close(String(holding.instrumentId), to);
    if (instrument === undefined || price === null) return sum;
    const units = v.quantity(holding, from);
    return sum.plus(
      units
        .times(price)
        .times(
          v.fx(instrument.currency, currency, to).minus(v.fx(instrument.currency, currency, from)),
        ),
    );
  }, ZERO);

  const benchmark = input.withBenchmark ? benchmarkReturn(input) : null;
  const benchmarkIndex = input.withBenchmark
    ? dates.map((date) => {
        const start = v.close(BENCHMARK_ID, from);
        const price = v.close(BENCHMARK_ID, date);
        if (start === null || price === null || start.isZero()) return 100;
        return Number(
          price
            .times(v.fx('USD', currency, date))
            .dividedBy(start.times(v.fx('USD', currency, from)))
            .times(100)
            .toFixed(4),
        );
      })
    : [];

  const returnMetric = metric(
    'twr',
    'Time-weighted return',
    percentCell(twr, true),
    'Chain-linked daily (weekly beyond six months), excluding money added, so it measures the investments rather than the timing of deposits.',
  );
  const table: TableInput = {
    id: 'holdings',
    title: 'By holding',
    columns: [
      column('instrument', 'Instrument', 'start'),
      column('start', 'Start value'),
      column('added', 'Added'),
      column('end', 'End value'),
      column('gain', 'Gain'),
      column('return', 'Return on capital'),
    ],
    rows: v.holdings.map((holding) => {
      const id = String(holding.instrumentId);
      const start = v.holdingValue(holding, from, currency);
      const end = v.holdingValue(holding, to, currency);
      const inflow = contributions(input, holding, from, to);
      const rowGain = end.minus(start).minus(inflow);
      const capital = start.plus(inflow);
      return {
        id,
        cells: {
          instrument: textCell(v.instrument(id)?.symbol ?? id),
          start: moneyCell(start, currency),
          added: moneyCell(inflow, currency),
          end: moneyCell(end, currency),
          gain: moneyCell(rowGain, currency),
          return: capital.isZero()
            ? textCell('—')
            : percentCell(rowGain.dividedBy(capital).times(100), true),
        },
      };
    }),
    total: {
      instrument: textCell('Portfolio'),
      start: moneyCell(startValue, currency),
      added: moneyCell(added, currency),
      end: moneyCell(endValue, currency),
      gain: moneyCell(gain, currency),
      return: textCell(''),
    },
  };

  return {
    title: 'Performance',
    metrics: [
      metric('start', 'Value at start', moneyCell(startValue, currency)),
      metric('end', 'Value at end', moneyCell(endValue, currency)),
      metric(
        'added',
        'Money added',
        moneyCell(added, currency),
        'Purchases at cost, including fees.',
      ),
      metric(
        'gain',
        'Investment gain',
        moneyCell(gain, currency),
        'Change in value less money added.',
      ),
      benchmark === null
        ? returnMetric
        : { ...returnMetric, benchmark: percentCell(benchmark, true) },
      metric(
        'currency',
        'Currency effect',
        moneyCell(currencyEffect, currency),
        `The part of the gain that came from exchange rates against ${currency}, on units held throughout.`,
      ),
    ],
    chart: {
      kind: 'comparison',
      title: input.withBenchmark ? `Growth of 100 against ${BENCHMARK_NAME}` : 'Growth of 100',
      dates: [...dates],
      series: [
        { name: 'Portfolio', values: index },
        ...(input.withBenchmark ? [{ name: BENCHMARK_NAME, values: benchmarkIndex }] : []),
      ],
      baseline: 100,
    },
    tables: [table],
    notes: [
      'Values use daily closing prices and that day’s exchange rate.',
      'Cash balances are not included; the report covers invested holdings.',
    ],
  };
}

type Dimension = 'type' | 'market' | 'currency' | 'broker';
const DIMENSION_LABELS: Readonly<Record<Dimension, string>> = {
  type: 'Instrument type',
  market: 'Market',
  currency: 'Currency',
  broker: 'Broker',
};

export function allocationReport(input: BuildInput): ReportParts {
  const { v, to, currency } = input;
  const valued = v.holdings
    .map((holding) => ({
      holding,
      instrument: v.instrument(String(holding.instrumentId)),
      value: v.holdingValue(holding, to, currency),
    }))
    .filter((item) => !item.value.isZero());
  const total = valued.reduce((sum, item) => sum.plus(item.value), ZERO);
  const keyOf = (item: (typeof valued)[number], dimension: Dimension): string => {
    if (item.instrument === undefined) return 'Unknown';
    if (dimension === 'type') return instrumentTypeLabel(item.instrument.type);
    if (dimension === 'market') return String(item.instrument.marketId);
    if (dimension === 'currency') return item.instrument.currency;
    const brokerId = String(item.holding.brokerId);
    return CANONICAL_BROKERS.find((broker) => String(broker.id) === brokerId)?.name ?? brokerId;
  };
  const groups = (dimension: Dimension): [string, Decimal][] => {
    const map = new Map<string, Decimal>();
    valued.forEach((item) => {
      const key = keyOf(item, dimension);
      map.set(key, (map.get(key) ?? ZERO).plus(item.value));
    });
    return [...map.entries()].sort((a, b) => b[1].comparedTo(a[1]));
  };
  const share = (value: Decimal): Decimal =>
    total.isZero() ? ZERO : value.dividedBy(total).times(100);
  const largest = [...valued].sort((a, b) => b.value.comparedTo(a.value))[0];

  return {
    title: 'Allocation',
    metrics: [
      metric('total', 'Value at end', moneyCell(total, currency)),
      metric('positions', 'Positions', { kind: 'count', value: valued.length }),
      metric(
        'largest',
        'Largest position',
        largest === undefined ? textCell('None') : percentCell(share(largest.value)),
        largest?.instrument === undefined
          ? null
          : `${largest.instrument.symbol} is the largest single holding.`,
      ),
    ],
    chart: {
      kind: 'donut',
      title: 'By instrument type',
      items: groups('type').map(([name, value]) => ({ name, value: Number(value.toFixed(2)) })),
    },
    tables: (['type', 'market', 'currency', 'broker'] as const).map((dimension) => ({
      id: dimension,
      title: `By ${DIMENSION_LABELS[dimension].toLowerCase()}`,
      columns: [
        column('name', DIMENSION_LABELS[dimension], 'start'),
        column('value', 'Value'),
        column('share', 'Share'),
      ],
      rows: groups(dimension).map(([name, value]) => ({
        id: name,
        cells: {
          name: textCell(name),
          value: moneyCell(value, currency),
          share: percentCell(share(value)),
        },
      })),
      total: {
        name: textCell('Total'),
        value: moneyCell(total, currency),
        share: percentCell(total.isZero() ? 0 : 100),
      },
    })),
    notes: [
      `Allocation is as at ${to}, valued at that day’s close and exchange rate.`,
      'Cash is not included.',
    ],
  };
}
