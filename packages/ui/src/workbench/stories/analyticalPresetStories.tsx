import type { ReactElement, ReactNode } from 'react';

import { AnalyticalChart } from '../../charts/analytical/AnalyticalChart';
import type { ComponentStory } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Deterministic sample returns so the story looks the same on every render.
const SAMPLE_RETURNS = Array.from({ length: 240 }, (_, index) => {
  const wave = Math.sin(index * 1.7) * 2.2 + Math.cos(index * 0.61) * 1.4;
  return Number((0.3 + wave).toFixed(2));
});

function Panel({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <div>
      <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>{title}</h5>
      {children}
    </div>
  );
}

function PresetGrid({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
      }}
    >
      {children}
    </div>
  );
}

export const analyticalPresetStories: readonly ComponentStory[] = [
  {
    id: 'analytical-distribution-presets',
    name: 'AnalyticalChart (distribution and contribution)',
    category: 'Charts',
    description:
      'Returns distribution with a normal curve, signed periodic return bars, a contribution waterfall and a risk against return scatter sized by weight.',
    render: () => (
      <PresetGrid>
        <Panel title="Daily returns distribution">
          <AnalyticalChart
            preset="returns-distribution"
            data={{ returns: SAMPLE_RETURNS }}
            height={260}
          />
        </Panel>
        <Panel title="Monthly returns">
          <AnalyticalChart
            preset="bar"
            data={{
              categories: MONTHS.slice(0, 6),
              series: [{ name: 'Return', values: [2.1, -1.4, 3.2, 0.6, -2.8, 1.9] }],
              signed: true,
              unit: '%',
            }}
            height={260}
          />
        </Panel>
        <Panel title="Contribution to total return">
          <AnalyticalChart
            preset="waterfall"
            data={{
              steps: [
                { name: 'US equities', value: 6.4 },
                { name: 'India equities', value: 3.1 },
                { name: 'Gold', value: -1.2 },
                { name: 'Currency', value: 0.8 },
                { name: 'Costs', value: -0.6 },
                { name: 'Tax', value: -1.4 },
              ],
              totalLabel: 'Net',
              unit: '%',
            }}
            height={260}
          />
        </Panel>
        <Panel title="Risk against return">
          <AnalyticalChart
            preset="scatter"
            data={{
              xLabel: 'Volatility %',
              yLabel: 'Return %',
              points: [
                { name: 'AAPL', x: 24, y: 18, size: 20 },
                { name: 'SPY', x: 15, y: 11, size: 35 },
                { name: 'RELIANCE', x: 22, y: 9, size: 15 },
                { name: 'GOLDBEES', x: 12, y: -3, size: 10 },
                { name: 'NVDA', x: 48, y: 42, size: 8 },
              ],
            }}
            height={260}
          />
        </Panel>
      </PresetGrid>
    ),
  },
  {
    id: 'analytical-composition-presets',
    name: 'AnalyticalChart (composition and relationships)',
    category: 'Charts',
    description:
      'Allocation treemap sized by value and coloured by return, allocation drift as a stacked area, a correlation matrix and rolling metric lines with a threshold.',
    render: () => (
      <PresetGrid>
        <Panel title="Allocation treemap">
          <AnalyticalChart
            preset="allocation-treemap"
            data={{
              items: [
                {
                  name: 'United States',
                  value: 62,
                  children: [
                    { name: 'SPY', value: 30, performance: 11 },
                    { name: 'AAPL', value: 20, performance: 18 },
                    { name: 'TSLA', value: 12, performance: -14 },
                  ],
                },
                {
                  name: 'India',
                  value: 38,
                  children: [
                    { name: 'RELIANCE', value: 22, performance: 6 },
                    { name: 'GOLDBEES', value: 16, performance: -3 },
                  ],
                },
              ],
            }}
            height={260}
          />
        </Panel>
        <Panel title="Allocation drift">
          <AnalyticalChart
            preset="stacked-area"
            data={{
              dates: MONTHS.slice(0, 6),
              percent: true,
              series: [
                { name: 'US equities', values: [45, 47, 49, 52, 50, 53] },
                { name: 'India equities', values: [30, 29, 28, 27, 29, 27] },
                { name: 'Gold', values: [15, 15, 14, 13, 13, 12] },
                { name: 'Cash', values: [10, 9, 9, 8, 8, 8] },
              ],
            }}
            height={260}
          />
        </Panel>
        <Panel title="Correlation matrix">
          <AnalyticalChart
            preset="correlation-matrix"
            data={{
              labels: ['SPY', 'AAPL', 'RELIANCE', 'GOLDBEES'],
              matrix: [
                [1, 0.82, 0.31, -0.12],
                [0.82, 1, 0.27, -0.08],
                [0.31, 0.27, 1, 0.05],
                [-0.12, -0.08, 0.05, 1],
              ],
            }}
            height={280}
          />
        </Panel>
        <Panel title="Rolling 3-month Sharpe ratio">
          <AnalyticalChart
            preset="rolling-metric"
            data={{
              dates: MONTHS,
              threshold: 1,
              series: [
                {
                  name: 'Momentum',
                  values: [null, null, 1.4, 1.2, 0.9, 1.1, 1.5, 1.3, 0.7, 0.6, 0.9, 1.2],
                },
                {
                  name: 'Benchmark',
                  values: [null, null, 0.8, 0.9, 1.0, 0.7, 0.8, 1.1, 0.9, 0.8, 0.7, 0.9],
                },
              ],
            }}
            height={260}
          />
        </Panel>
      </PresetGrid>
    ),
  },
];
