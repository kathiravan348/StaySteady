import { AnalyticalChart } from '../../charts/analytical/AnalyticalChart';
import { PriceChart } from '../../charts/price/PriceChart';
import type { PriceBarData, VolumeBarData } from '../../charts/price/types';
import type { ComponentStory } from '../types';

const SAMPLE_PRICE_DATA: readonly PriceBarData[] = [
  { time: '2024-01-02', open: 180.2, high: 184.5, low: 179.8, close: 183.4 },
  { time: '2024-01-03', open: 183.4, high: 185.0, low: 182.1, close: 184.2 },
  { time: '2024-01-04', open: 184.2, high: 186.2, low: 183.0, close: 185.8 },
  { time: '2024-01-05', open: 185.8, high: 187.0, low: 184.2, close: 186.4 },
  { time: '2024-01-08', open: 186.4, high: 189.5, low: 185.8, close: 188.9 },
  { time: '2024-01-09', open: 188.9, high: 190.2, low: 187.4, close: 189.8 },
];

const SAMPLE_VOLUME_DATA: readonly VolumeBarData[] = [
  { time: '2024-01-02', value: 45000000 },
  { time: '2024-01-03', value: 38000000 },
  { time: '2024-01-04', value: 42000000 },
  { time: '2024-01-05', value: 51000000 },
  { time: '2024-01-08', value: 62000000 },
  { time: '2024-01-09', value: 48000000 },
];

export const chartStories: readonly ComponentStory[] = [
  {
    id: 'price-chart',
    name: 'PriceChart (TradingView)',
    category: 'Charts',
    description:
      'Financial candlestick chart with stacked volume histogram and dynamic theme synchronization.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <PriceChart data={SAMPLE_PRICE_DATA} volumeData={SAMPLE_VOLUME_DATA} height={320} />
      </div>
    ),
  },
  {
    id: 'analytical-chart',
    name: 'AnalyticalChart (ECharts)',
    category: 'Charts',
    description:
      'Analytical chart wrapper supporting equity curves, drawdowns, monthly return heatmaps, and allocation donuts.',
    render: () => (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <div>
          <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
            Strategy Equity Curve vs Benchmark
          </h5>
          <AnalyticalChart
            preset="equity-curve"
            data={{
              dates: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              equity: [100, 104, 102, 108, 114, 118],
              benchmark: [100, 101, 100, 103, 105, 107],
            }}
            height={260}
          />
        </div>
        <div>
          <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
            Asset Class Allocation Donut
          </h5>
          <AnalyticalChart
            preset="allocation-donut"
            data={{
              items: [
                { name: 'US Equities', value: 45 },
                { name: 'India Equities', value: 25 },
                { name: 'Sovereign Debt', value: 15 },
                { name: 'Digital Assets', value: 10 },
                { name: 'Cash', value: 5 },
              ],
            }}
            height={260}
          />
        </div>
      </div>
    ),
  },
];
