// Strategy attribution report (UI spec 7.16): how much of the gain came from each strategy that
// opened a position, and from manual decisions.

import { Decimal } from 'decimal.js';

import type { BuildInput, ReportParts } from './reportParts';
import { column, metric, moneyCell, percentCell, textCell } from './reportParts';
import { contributions } from './reportPortfolioBuilders';

const ZERO = new Decimal(0);

export function attributionReport(input: BuildInput): ReportParts {
  const { v, from, to, currency } = input;
  const groups = new Map<string, { start: Decimal; end: Decimal; added: Decimal }>();
  v.holdings.forEach((holding) => {
    const key =
      holding.openedByStrategyId === undefined ? 'manual' : String(holding.openedByStrategyId);
    const current = groups.get(key) ?? { start: ZERO, end: ZERO, added: ZERO };
    groups.set(key, {
      start: current.start.plus(v.holdingValue(holding, from, currency)),
      end: current.end.plus(v.holdingValue(holding, to, currency)),
      added: current.added.plus(contributions(input, holding, from, to)),
    });
  });
  const rows = [...groups.entries()].map(([key, group]) => ({
    key,
    ...group,
    gain: group.end.minus(group.start).minus(group.added),
  }));
  const totalGain = rows.reduce((sum, row) => sum.plus(row.gain), ZERO);
  const name = (key: string): string =>
    key === 'manual' ? 'Manual decisions' : (v.strategyNames.get(key) ?? key);
  const strategyGain = rows
    .filter((row) => row.key !== 'manual')
    .reduce((sum, row) => sum.plus(row.gain), ZERO);

  return {
    title: 'Strategy attribution',
    metrics: [
      metric('gain', 'Investment gain', moneyCell(totalGain, currency)),
      metric('strategies', 'From strategies', moneyCell(strategyGain, currency)),
      metric(
        'manual',
        'From manual decisions',
        moneyCell(totalGain.minus(strategyGain), currency),
        'Holdings opened by hand, not by a strategy.',
      ),
    ],
    chart: null,
    tables: [
      {
        id: 'strategies',
        title: 'By strategy that opened the position',
        columns: [
          column('name', 'Opened by', 'start'),
          column('start', 'Start value'),
          column('added', 'Added'),
          column('end', 'End value'),
          column('gain', 'Gain'),
          column('share', 'Share of gain'),
        ],
        rows: rows
          .sort((a, b) => b.gain.comparedTo(a.gain))
          .map((row) => ({
            id: row.key,
            cells: {
              name: textCell(name(row.key)),
              start: moneyCell(row.start, currency),
              added: moneyCell(row.added, currency),
              end: moneyCell(row.end, currency),
              gain: moneyCell(row.gain, currency),
              share: totalGain.isZero()
                ? textCell('—')
                : percentCell(row.gain.dividedBy(totalGain).times(100)),
            },
          })),
        total: null,
      },
    ],
    notes: [
      'A holding is attributed to the strategy that opened it for its whole life.',
      'Shares of gain can exceed 100% when another group lost money.',
    ],
  };
}
