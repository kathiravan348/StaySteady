import { EmptyState } from '../../state/EmptyState/EmptyState';
import { ErrorState } from '../../state/ErrorState/ErrorState';
import { LoadingState } from '../../state/LoadingState/LoadingState';
import { NoResultsState } from '../../state/NoResultsState/NoResultsState';
import { StaleState } from '../../state/StaleState/StaleState';
import { SystemStatusState } from '../../state/SystemStatusState/SystemStatusState';
import { Button } from '../../primitives/Button/Button';
import type { ComponentStory } from '../types';

export const stateStories: readonly ComponentStory[] = [
  {
    id: 'loading-state',
    name: 'LoadingState',
    category: 'State Components',
    description: 'Layout-matching skeleton loaders for table, cards, and charts.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Table Skeleton</h5>
          <LoadingState layout="table" count={3} />
        </div>
        <div>
          <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Card Grid Skeleton</h5>
          <LoadingState layout="cards" count={3} />
        </div>
      </div>
    ),
  },
  {
    id: 'empty-state',
    name: 'EmptyState',
    category: 'State Components',
    description: 'First-use guidance with illustration and call to action.',
    render: () => (
      <EmptyState
        title="No holdings in portfolio"
        description="Add manual positions or connect a broker gateway to begin tracking performance."
        action={
          <Button variant="primary" size="sm">
            Add First Holding
          </Button>
        }
      />
    ),
  },
  {
    id: 'no-results-state',
    name: 'NoResultsState',
    category: 'State Components',
    description: 'Filtered view empty state with clear filters action.',
    render: () => (
      <NoResultsState
        title="No matching instruments"
        description="We could not find any securities matching 'XYZ99' in US or India markets."
        onClearFilters={() => {}}
      />
    ),
  },
  {
    id: 'error-state',
    name: 'ErrorState',
    category: 'State Components',
    description: 'Service failure state with actionable retry trigger.',
    render: () => (
      <ErrorState
        title="Unable to load market quotes"
        message="Market data provider gateway returned 503 Service Unavailable."
        onRetry={() => {}}
      />
    ),
  },
  {
    id: 'stale-state',
    name: 'StaleState',
    category: 'State Components',
    description: 'Data age indicator pill and warning banner.',
    render: () => (
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
      >
        <StaleState ageText="45m old" />
        <StaleState isBanner ageText="45m old" lastUpdated="14:32 EST" onRefresh={() => {}} />
      </div>
    ),
  },
  {
    id: 'system-status-state',
    name: 'SystemStatusState',
    category: 'State Components',
    description: 'Halted safety-breach, degraded provider, and offline emergency banners.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        <SystemStatusState
          status="halted"
          title="AUTOMATION HALTED — SAFETY BREACH"
          reason="Daily drawdown ceiling (-5.0%) exceeded. All live order submission is blocked."
          actions={
            <Button variant="danger" size="sm">
              Review Incident Details
            </Button>
          }
        />
        <SystemStatusState
          status="degraded"
          title="Degraded Data Feed"
          reason="NSE quote stream experiencing intermittent latency. Falling back to snapshots."
        />
        <SystemStatusState
          status="offline"
          title="Broker Gateway Offline"
          reason="Connection to Interactive Brokers lost. Reconnecting in 30s."
        />
      </div>
    ),
  },
];
