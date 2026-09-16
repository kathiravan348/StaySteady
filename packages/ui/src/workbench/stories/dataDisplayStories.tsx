import { DataList } from '../../data-display/DataList/DataList';
import { KeyValuePair } from '../../data-display/KeyValuePair/KeyValuePair';
import { MetricDisplay } from '../../data-display/MetricDisplay/MetricDisplay';
import { Sparkline } from '../../data-display/Sparkline/Sparkline';
import { UsageMeter } from '../../data-display/UsageMeter/UsageMeter';
import type { ComponentStory } from '../types';

export const dataDisplayStories: readonly ComponentStory[] = [
  {
    id: 'metric-display',
    name: 'MetricDisplay',
    category: 'Data Display',
    description:
      'Headline financial metric with tabular numbers, percentage badges, and direction indicators.',
    render: () => (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <MetricDisplay
          label="Total Portfolio Value"
          value="$482,910.40"
          size="lg"
          changeValue="+2.45%"
          direction="positive"
          subLabel="+$11,540.20 Today"
        />
        <MetricDisplay
          label="Max Drawdown"
          value="-14.20%"
          size="md"
          changeValue="-0.80%"
          direction="negative"
          subLabel="Peak: 2024-03-15"
        />
        <MetricDisplay
          label="Sharpe Ratio"
          value="1.84"
          size="md"
          direction="neutral"
          subLabel="Risk-Free Rate: 4.25%"
        />
      </div>
    ),
  },
  {
    id: 'key-value-pair',
    name: 'KeyValuePair',
    category: 'Data Display',
    description: 'Dense label/value pair in horizontal and stacked orientations.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
        <KeyValuePair label="Day Range" value="$181.20 - $184.95" layout="horizontal" isMono />
        <KeyValuePair label="52-Week Range" value="$164.08 - $199.62" layout="horizontal" isMono />
        <KeyValuePair label="Volume" value="48,290,144" layout="horizontal" isMono />
        <KeyValuePair label="Exchange" value="NASDAQ (US)" layout="stacked" />
      </div>
    ),
  },
  {
    id: 'sparkline',
    name: 'Sparkline',
    category: 'Data Display',
    description: 'Lightweight SVG micro-chart for tables with gain/loss convention and area fill.',
    render: () => (
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>AAPL (+4.2%):</span>
          <Sparkline
            data={[175, 176, 174, 178, 180, 179, 182.5]}
            width={100}
            height={28}
            showArea
            direction="positive"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>TSLA (-2.8%):</span>
          <Sparkline
            data={[250, 248, 252, 246, 242, 244, 238.4]}
            width={100}
            height={28}
            showArea
            direction="negative"
          />
        </div>
      </div>
    ),
  },
  {
    id: 'usage-meter',
    name: 'UsageMeter',
    category: 'Data Display',
    description:
      'Usage against a limit with headroom; escalates at 80% and 95% with colour, symbol and words.',
    render: () => (
      <div style={{ display: 'grid', gap: '1.25rem', maxWidth: 420 }}>
        <UsageMeter label="API requests this month" used={62_000} limit={100_000} />
        <UsageMeter label="Order count today" used={42} limit={50} />
        <UsageMeter
          label="Data cost this month"
          used={86.4}
          limit={90}
          formatValue={(value) => `USD ${value.toFixed(2)}`}
          description="Budget resets on the first of the month."
        />
      </div>
    ),
  },
  {
    id: 'data-list',
    name: 'DataList',
    category: 'Data Display',
    description: 'Dense list with dividers, hover highlighting, and item actions.',
    render: () => (
      <div style={{ maxWidth: 400 }}>
        <DataList
          items={[
            {
              id: 1,
              content: 'Apple Inc. (AAPL)',
              extra: <span style={{ color: 'var(--domain-gain)' }}>+$4,210.00</span>,
            },
            {
              id: 2,
              content: 'Tesla Inc. (TSLA)',
              extra: <span style={{ color: 'var(--domain-loss)' }}>-$1,120.50</span>,
            },
            {
              id: 3,
              content: 'Microsoft Corp. (MSFT)',
              extra: <span style={{ color: 'var(--domain-gain)' }}>+$2,940.80</span>,
            },
          ]}
        />
      </div>
    ),
  },
];
