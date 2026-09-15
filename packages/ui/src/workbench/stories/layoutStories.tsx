import { Card } from '../../layout/Card/Card';
import { Grid } from '../../layout/Grid/Grid';
import { PageShell } from '../../layout/PageShell/PageShell';
import { ScrollArea } from '../../layout/ScrollArea/ScrollArea';
import { SplitPanel } from '../../layout/SplitPanel/SplitPanel';
import { Stack } from '../../layout/Stack/Stack';
import { Button } from '../../primitives/Button/Button';
import type { ComponentStory } from '../types';

export const layoutStories: readonly ComponentStory[] = [
  {
    id: 'stack',
    name: 'Stack',
    category: 'Layout',
    description:
      'Flex layout container supporting horizontal and vertical directions, alignments, and gap tokens.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Stack direction="horizontal" gap={3} align="center">
          <Button size="sm">Action 1</Button>
          <Button size="sm" variant="secondary">
            Action 2
          </Button>
          <Button size="sm" variant="outline">
            Action 3
          </Button>
        </Stack>
        <Stack direction="vertical" gap={2}>
          <div
            style={{ padding: '0.5rem', background: 'var(--surface-raised)', borderRadius: '4px' }}
          >
            Item 1
          </div>
          <div
            style={{ padding: '0.5rem', background: 'var(--surface-raised)', borderRadius: '4px' }}
          >
            Item 2
          </div>
        </Stack>
      </div>
    ),
  },
  {
    id: 'grid',
    name: 'Grid',
    category: 'Layout',
    description: 'CSS Grid container with responsive column presets and gap tokens.',
    render: () => (
      <Grid cols={3} gap={4}>
        <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: '8px' }}>
          Column 1
        </div>
        <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: '8px' }}>
          Column 2
        </div>
        <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: '8px' }}>
          Column 3
        </div>
      </Grid>
    ),
  },
  {
    id: 'split-panel',
    name: 'SplitPanel',
    category: 'Layout',
    description: 'Draggable resizable split container supporting horizontal and vertical dividers.',
    render: () => (
      <div style={{ height: 200, border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
        <SplitPanel
          direction="horizontal"
          defaultRatio={0.4}
          first={
            <div style={{ padding: '1rem', background: 'var(--surface-base)' }}>
              Left Workspace Panel
            </div>
          }
          second={
            <div style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
              Right Chart Panel
            </div>
          }
        />
      </div>
    ),
  },
  {
    id: 'scroll-area',
    name: 'ScrollArea',
    category: 'Layout',
    description: 'Custom scrollbar container adhering to theme tokens.',
    render: () => (
      <ScrollArea
        maxHeight={140}
        style={{ width: 280, border: '1px solid var(--border-subtle)', padding: '0.75rem' }}
      >
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{ padding: '0.25rem 0' }}>
            Transaction log entry #{i + 1}
          </div>
        ))}
      </ScrollArea>
    ),
  },
  {
    id: 'card',
    name: 'Card',
    category: 'Layout',
    description:
      'Acrylic glassmorphic elevated card with header, body, footer, and interactive state.',
    render: () => (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card
          title="Portfolio Summary"
          extra={
            <Button size="sm" variant="ghost">
              Export
            </Button>
          }
          footer={<span>Last sync: 2m ago</span>}
        >
          <p style={{ margin: 0 }}>Total value: $482,910.40</p>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--domain-gain)' }}>+2.45% Today</p>
        </Card>
        <Card title="Clickable Position" isInteractive>
          <p style={{ margin: 0 }}>AAPL • Apple Inc.</p>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
            120 Shares @ $182.40
          </p>
        </Card>
      </div>
    ),
  },
  {
    id: 'page-shell',
    name: 'PageShell',
    category: 'Layout',
    description: 'Layout template with header, sidebar, content area, and status strip.',
    render: () => (
      <div
        style={{
          height: 220,
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <PageShell
          header={
            <div
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--surface-raised)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              TopBar Navigation Header
            </div>
          }
          sidebar={
            <div
              style={{
                width: 140,
                padding: '1rem',
                background: 'var(--surface-overlay)',
                height: '100%',
              }}
            >
              Sidebar
            </div>
          }
          statusStrip={
            <div
              style={{
                padding: '0.25rem 1rem',
                background: 'var(--surface-raised)',
                fontSize: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              Market Strip: US OPEN • IN CLOSED
            </div>
          }
        >
          <div style={{ padding: '1rem' }}>Main Content Canvas</div>
        </PageShell>
      </div>
    ),
  },
];
