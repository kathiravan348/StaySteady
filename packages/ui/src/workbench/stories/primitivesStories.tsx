import type { ReactElement, SVGProps } from 'react';
import { Badge } from '../../primitives/Badge/Badge';
import { Button } from '../../primitives/Button/Button';
import { Checkbox } from '../../primitives/Checkbox/Checkbox';
import { Icon } from '../../primitives/Icon/Icon';
import { Input } from '../../primitives/Input/Input';
import { Select } from '../../primitives/Select/Select';
import { Skeleton } from '../../primitives/Skeleton/Skeleton';
import { Spinner } from '../../primitives/Spinner/Spinner';
import { Toggle } from '../../primitives/Toggle/Toggle';
import { Tooltip } from '../../primitives/Tooltip/Tooltip';
import type { ComponentStory } from '../types';

function DummyIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="12 8 8 12 12 16 16 12 12 8" />
    </svg>
  );
}

export const primitivesStories: readonly ComponentStory[] = [
  {
    id: 'button',
    name: 'Button',
    category: 'Primitives',
    description:
      'Accessible button with variants (primary, secondary, outline, ghost, danger), sizes, and loading state.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" isLoading>
            Loading
          </Button>
          <Button variant="secondary" isDisabled>
            Disabled
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button size="sm">Small (sm)</Button>
          <Button size="md">Medium (md)</Button>
          <Button size="lg">Large (lg)</Button>
        </div>
      </div>
    ),
  },
  {
    id: 'input',
    name: 'Input',
    category: 'Primitives',
    description:
      'Accessible text field with leading/trailing icons, error messages, and descriptions.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 360 }}>
        <Input label="Instrument Search" placeholder="e.g. AAPL, RELIANCE..." />
        <Input label="API Key (Disabled)" defaultValue="sec_live_998124" isDisabled />
        <Input
          label="Position Limit"
          defaultValue="150000"
          errorMessage="Amount exceeds account risk ceiling"
        />
      </div>
    ),
  },
  {
    id: 'select',
    name: 'Select',
    category: 'Primitives',
    description: 'Keyboard-accessible select dropdown with popover and listbox options.',
    render: () => {
      const options = [
        { id: 'USD', label: 'USD — US Dollar ($)' },
        { id: 'INR', label: 'INR — Indian Rupee (₹)' },
        { id: 'GBP', label: 'GBP — British Pound (£)' },
        { id: 'JPY', label: 'JPY — Japanese Yen (¥)' },
      ];
      return (
        <div style={{ maxWidth: 320 }}>
          <Select label="Base Currency" options={options} defaultSelectedKey="USD" />
        </div>
      );
    },
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'Primitives',
    description: 'Accessible checkbox supporting checked, unchecked, and indeterminate states.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Checkbox defaultSelected>Require manual approval for equity trades</Checkbox>
        <Checkbox isIndeterminate>Notify on abnormal volatility (3 of 5 active)</Checkbox>
        <Checkbox isDisabled>Enforce 2FA verification (Locked by admin)</Checkbox>
      </div>
    ),
  },
  {
    id: 'toggle',
    name: 'Toggle (Switch)',
    category: 'Primitives',
    description: 'Accessible toggle switch for instant mode activations.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Toggle defaultSelected>Live market ticking simulator</Toggle>
        <Toggle>Extended hours pre/post-market quotes</Toggle>
        <Toggle isDisabled>Automated stop-loss execution</Toggle>
      </div>
    ),
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'Primitives',
    description: 'Semantic badges across gain, loss, severity, neutral, and info variants.',
    render: () => (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Badge variant="positive">+4.82%</Badge>
        <Badge variant="negative">-1.45%</Badge>
        <Badge variant="warning">DEGRADED</Badge>
        <Badge variant="critical">CRITICAL</Badge>
        <Badge variant="info">OBSERVATION</Badge>
        <Badge variant="neutral">NASDAQ</Badge>
        <Badge variant="positive" shape="rounded">
          US EQUITIES
        </Badge>
      </div>
    ),
  },
  {
    id: 'icon',
    name: 'Icon',
    category: 'Primitives',
    description: 'Theme-aware Lucide icon wrapper with size and semantic color mapping.',
    render: () => (
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Icon icon={DummyIcon} size="sm" color="gain" />
        <Icon icon={DummyIcon} size="md" color="primary" />
        <Icon icon={DummyIcon} size="lg" color="loss" />
        <Icon icon={DummyIcon} size="xl" color="warning" />
      </div>
    ),
  },
  {
    id: 'spinner',
    name: 'Spinner',
    category: 'Primitives',
    description: 'Smooth SVG loading indicator matching theme interactive colors.',
    render: () => (
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
      </div>
    ),
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    category: 'Primitives',
    description: 'Accessible floating tooltip with arrow and focus/hover delay.',
    render: () => (
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Tooltip content="Sharpe Ratio measures risk-adjusted return relative to risk-free rate">
          <Button variant="outline" size="sm">
            Hover for Sharpe calculation
          </Button>
        </Tooltip>
      </div>
    ),
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'Primitives',
    description: 'Shimmer placeholder skeleton for text, circular avatars, and cards.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: 280 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Skeleton shape="circle" width={40} height={40} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <Skeleton shape="text" width="80%" height={14} />
            <Skeleton shape="text" width="50%" height={12} />
          </div>
        </div>
        <Skeleton shape="card" width="100%" height={80} />
      </div>
    ),
  },
];
