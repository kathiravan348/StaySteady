import { http, HttpResponse, type HttpHandler } from 'msw';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';

export interface ServiceHealthStatus {
  readonly id: string;
  readonly name: string;
  readonly status: 'healthy' | 'degraded' | 'down';
  readonly latencyMs: number;
  readonly lastHeartbeat: string;
}

export interface SystemHealthResponse {
  readonly overallStatus: 'healthy' | 'degraded' | 'down';
  readonly activeScenario: string;
  readonly services: readonly ServiceHealthStatus[];
  readonly checkedAt: string;
}

export interface SystemStateResponse {
  readonly mode: 'live-autonomous' | 'live-supervised' | 'paper' | 'backtest';
  readonly killSwitchActive: boolean;
  readonly baseCurrency: string;
  readonly activeScenario: string;
  readonly updatedAt: string;
}

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

    const now = new Date().toISOString();
    const isProviderDown = scenario === 'provider-down';
    const isBrokerDown = scenario === 'broker-disconnected';
    const isBreach = scenario === 'safety-breach';

    const services: readonly ServiceHealthStatus[] = [
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

    const response: SystemHealthResponse = {
      overallStatus,
      activeScenario: scenario,
      services,
      checkedAt: now,
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  http.get('/api/v1/system/state', () => {
    const scenario = getActiveDeveloperScenario();
    const response: SystemStateResponse = {
      mode: 'paper',
      killSwitchActive: mockKillSwitchState || scenario === 'safety-breach',
      baseCurrency: 'USD',
      activeScenario: scenario,
      updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),
];
