// System health, alerts at all severities, incidents, and audit log generator (M-13).
// Fulfills UI Spec 15 health matrix (healthy, degraded, down) and severity coverage.

import type {
  AlertDto,
  AuditLogDto,
  IncidentDto,
  ServiceHealthDto,
  SystemHealthResponseDto,
} from '../../schemas';
import {
  AlertSchema,
  AuditLogSchema,
  IncidentSchema,
  SystemHealthResponseSchema,
} from '../../schemas';
import { parseGenerated, parseGeneratedList } from './validated';
import type { MockGeneratorContext } from './mockContext';
import { toAlertId, toIncidentId } from '../../../shared/types/identifiers';
import { toIsoUtcTimestamp } from '../../../shared/types/dateTime';

export function generateHealthServices(
  ctx: MockGeneratorContext,
  scenario = 'healthy',
): SystemHealthResponseDto {
  const isDown = scenario === 'provider-down' || scenario === 'broker-disconnected';
  const isDegraded = scenario === 'safety-breach' || scenario === 'stale-data';

  const services: ServiceHealthDto[] = [
    {
      id: 'market-data-feed',
      name: 'Realtime Market Ingestion',
      status: scenario === 'provider-down' ? 'down' : 'healthy',
      latencyMs: scenario === 'provider-down' ? 9999 : 38,
      lastHeartbeat: ctx.referenceTime,
    },
    {
      id: 'broker-routing-gateway',
      name: 'Interactive Brokers Gateway',
      status: scenario === 'broker-disconnected' ? 'down' : 'healthy',
      latencyMs: scenario === 'broker-disconnected' ? 9999 : 52,
      lastHeartbeat: ctx.referenceTime,
    },
    {
      id: 'risk-safety-engine',
      name: 'Pillar 4 Risk Gate Engine',
      status: scenario === 'safety-breach' ? 'degraded' : 'healthy',
      latencyMs: 12,
      lastHeartbeat: ctx.referenceTime,
    },
    {
      id: 'historical-timeseries-db',
      name: 'Timescale Historical Store',
      status: scenario === 'stale-data' ? 'degraded' : 'healthy',
      latencyMs: 19,
      lastHeartbeat: ctx.referenceTime,
    },
  ];

  const overallStatus: 'healthy' | 'degraded' | 'down' = isDown
    ? 'down'
    : isDegraded
      ? 'degraded'
      : 'healthy';

  return parseGenerated(
    SystemHealthResponseSchema,
    {
      overallStatus,
      activeScenario: scenario,
      services,
      checkedAt: ctx.referenceTime,
    },
    'systemHealthResponse',
  );
}

export function generateAlerts(ctx: MockGeneratorContext): readonly AlertDto[] {
  const alerts: AlertDto[] = [
    {
      id: toAlertId('alt-01-crit-limit'),
      severity: 'critical',
      category: 'critical',
      source: 'Risk & Safety Gate',
      title: 'Daily Drawdown Breached Threshold (3.2% vs 3.0% Limit)',
      message: 'Automation halted on US equity portfolio. Manual acknowledgment required.',
      timestamp: ctx.referenceTime,
      acknowledged: false,
    },
    {
      id: toAlertId('alt-02-act-approval'),
      severity: 'high',
      category: 'action_needed',
      source: 'Signal Engine',
      title: 'Pending Approval: TSLA Exit Signal Expiring',
      message: 'RSI Reversion profit target signal expires at market close.',
      timestamp: ctx.referenceTime,
      acknowledged: false,
    },
    {
      id: toAlertId('alt-03-med-stale'),
      severity: 'medium',
      category: 'action_needed',
      source: 'LSE Data Provider',
      title: 'Delayed Tick Stream on LSE Market',
      message: 'Ticks delayed by 45s. Switched to backup feed provider.',
      timestamp: toIsoUtcTimestamp('2026-09-15T09:12:00Z'),
      acknowledged: true,
    },
    {
      id: toAlertId('alt-04-low-info'),
      severity: 'low',
      category: 'informational',
      source: 'Account Rebalancing',
      title: 'Target Allocation Rebalanced Successfully',
      message: 'Cash rebalance allocated 5% to US Treasury Benchmark note.',
      timestamp: toIsoUtcTimestamp('2026-09-14T16:05:00Z'),
      acknowledged: true,
    },
    {
      id: toAlertId('alt-05-sched-maint'),
      severity: 'low',
      category: 'scheduled',
      source: 'Broker Maintenance',
      title: 'Scheduled Weekend Gateway Maintenance',
      message: 'Broker gateway will undergo scheduled maintenance Sunday 02:00 UTC.',
      timestamp: toIsoUtcTimestamp('2026-09-13T12:00:00Z'),
      acknowledged: true,
    },
  ];

  return parseGeneratedList(AlertSchema, alerts, 'alerts');
}

export function generateIncidents(): readonly IncidentDto[] {
  const incidents: IncidentDto[] = [
    {
      id: toIncidentId('inc-001-feed-outage'),
      severity: 'high',
      title: 'Primary Market Data Socket Drop',
      affectedComponents: ['market-data-feed', 'risk-safety-engine'],
      startedAt: toIsoUtcTimestamp('2026-09-10T13:45:00Z'),
      resolvedAt: toIsoUtcTimestamp('2026-09-10T13:48:30Z'),
      automaticActions: [
        'Halted active order dispatch',
        'Switched to secondary websocket cluster',
        'Verified quote timestamp freshness',
      ],
      resolution: 'Secondary provider successfully caught up. Zero missed orders.',
    },
    {
      id: toIncidentId('inc-002-order-reject'),
      severity: 'medium',
      title: 'Broker Gateway Timeout on Margin Validation',
      affectedComponents: ['broker-routing-gateway'],
      startedAt: toIsoUtcTimestamp('2026-09-08T15:20:00Z'),
      resolvedAt: toIsoUtcTimestamp('2026-09-08T15:22:15Z'),
      automaticActions: ['Retried order status query', 'Alerted owner on unconfirmed fill'],
      resolution: 'Broker confirmed order rejected due to collateral lock.',
    },
  ];

  return parseGeneratedList(IncidentSchema, incidents, 'incidents');
}

export function generateAuditLogs(ctx: MockGeneratorContext): readonly AuditLogDto[] {
  const logs: AuditLogDto[] = [
    {
      id: 'audit-001',
      timestamp: ctx.referenceTime,
      actor: 'system:risk-gate',
      action: 'SAFETY_HALT_TRIGGERED',
      target: 'portfolio:all',
      metadata: { reason: 'drawdown_exceeded', limit: '3.0%', actual: '3.2%' },
    },
    {
      id: 'audit-002',
      timestamp: toIsoUtcTimestamp('2026-09-14T14:25:00Z'),
      actor: 'user:owner',
      action: 'APPROVAL_GRANTED',
      target: 'order:ord-0001-filled',
      metadata: { approvalId: 'appr-002-approved', overrideReason: 'weight_rebalance' },
    },
    {
      id: 'audit-003',
      timestamp: toIsoUtcTimestamp('2026-09-12T08:00:00Z'),
      actor: 'user:owner',
      action: 'STRATEGY_STAGE_ADVANCED',
      target: 'strategy:strat-trend-momentum',
      metadata: { previousStage: 'semi_automatic', newStage: 'fully_automatic' },
    },
  ];

  return parseGeneratedList(AuditLogSchema, logs, 'auditLogs');
}
