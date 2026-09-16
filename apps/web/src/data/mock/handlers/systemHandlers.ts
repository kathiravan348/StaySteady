import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  ServiceHealthDto,
  SystemHealthResponseDto,
  SystemStateResponseDto,
} from '../../schemas';
import { nowUtc } from '../../../shared/types/dateTime';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { createMockGeneratorContext, generateAlerts, generateAuditLogs } from '../generators';

const ctx = createMockGeneratorContext();
let mockKillSwitchState = false;

export const systemHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/system/health', () => {
    const scenario = getActiveDeveloperScenario();

    if (scenario === 'loading-error') {
      return HttpResponse.json(
        {
          error: 'Service Unavailable (Simulated Error Scenario)',
          statusCode: 503,
          scenario,
        },
        { status: 503 },
      );
    }

    const now = nowUtc();
    const isProviderDown = scenario === 'provider-down';
    const isBrokerDown = scenario === 'broker-disconnected';
    const isBreach = scenario === 'safety-breach';

    const services: readonly ServiceHealthDto[] = [
      {
        id: 'market-data',
        name: 'Market Data Ingestion',
        status: isProviderDown ? 'down' : 'healthy',
        latencyMs: isProviderDown ? 9999 : 42,
        lastHeartbeat: now,
      },
      {
        id: 'broker-gateway',
        name: 'Broker Gateway & Routing',
        status: isBrokerDown ? 'down' : 'healthy',
        latencyMs: isBrokerDown ? 9999 : 68,
        lastHeartbeat: now,
      },
      {
        id: 'risk-safety-engine',
        name: 'Risk & Safety Gate',
        status: isBreach ? 'degraded' : 'healthy',
        latencyMs: 14,
        lastHeartbeat: now,
      },
      {
        id: 'storage-timescale',
        name: 'Timeseries Telemetry DB',
        status: 'healthy',
        latencyMs: 18,
        lastHeartbeat: now,
      },
    ];

    const overallStatus: 'healthy' | 'degraded' | 'down' =
      isProviderDown || isBrokerDown ? 'down' : isBreach ? 'degraded' : 'healthy';

    const response: SystemHealthResponseDto = {
      overallStatus,
      activeScenario: scenario,
      services: [...services],
      checkedAt: now,
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  http.get('/api/v1/system/state', () => {
    const scenario = getActiveDeveloperScenario();
    const response: SystemStateResponseDto = {
      mode: 'simulation',
      killSwitchActive: mockKillSwitchState || scenario === 'safety-breach',
      baseCurrency: 'USD',
      activeScenario: scenario,
      updatedAt: nowUtc(),
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  http.post('/api/v1/system/kill-switch', async ({ request }) => {
    try {
      const body = (await request.json()) as { active?: boolean };
      mockKillSwitchState = typeof body.active === 'boolean' ? body.active : !mockKillSwitchState;
    } catch {
      mockKillSwitchState = !mockKillSwitchState;
    }

    return HttpResponse.json(
      {
        killSwitchActive: mockKillSwitchState,
        updatedAt: nowUtc(),
      },
      { status: 200 },
    );
  }),

  http.get('/api/v1/system/alerts', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load alerts' }, { status: 500 });
    }
    return HttpResponse.json(generateAlerts(ctx), { status: 200 });
  }),

  http.get('/api/v1/system/audit-logs', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load audit logs' }, { status: 500 });
    }
    return HttpResponse.json(generateAuditLogs(ctx), { status: 200 });
  }),
];
