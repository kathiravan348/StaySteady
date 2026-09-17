// MSW request handler for the audit log (UI spec 7.20). Reads the same stores the other screens write,
// so the log is rebuilt on every request and never drifts from them.

import { http, HttpResponse, type HttpHandler } from 'msw';

import {
  buildAuditLog,
  generateOrderHistory,
  generateStrategyLibrary,
  generateStrategyVersions,
  parseGeneratedList,
} from '../generators';
import type { ConfigArea } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import {
  getAlertRuleVersions,
  getBaseCurrencyVersions,
  getBrokerVersions,
  getCredentialVersions,
  getCurrencyVersions,
  getInstrumentTypeVersions,
  getMarketVersions,
  getProviderVersions,
} from '../stores/configStore';
import { getRiskChanges } from '../stores/riskStore';
import { decisions, getApprovals, getOrders, tradingContext as ctx } from '../stores/tradingStore';
import { AuditEntrySchema } from '../../schemas';

export const auditHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/audit', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load the audit log' }, { status: 500 });
    }
    const configAreas: ConfigArea[] = [
      { noun: 'Market', entries: getMarketVersions() },
      { noun: 'Data provider', entries: getProviderVersions() },
      { noun: 'Broker', entries: getBrokerVersions() },
      { noun: 'Instrument type', entries: getInstrumentTypeVersions() },
      { noun: 'Currency', entries: getCurrencyVersions() },
      { noun: 'Base currency', entries: getBaseCurrencyVersions() },
      { noun: 'Alert rule', entries: getAlertRuleVersions() },
      { noun: 'Credential', entries: getCredentialVersions() },
    ];
    const reasons = new Map([...decisions].map(([id, record]) => [id, record.decisionReason]));
    const strategies = generateStrategyLibrary(ctx, scenario === 'empty-portfolio').map(
      (entry) => ({
        id: String(entry.strategyId),
        name: entry.name,
        stage: entry.stage,
        versions: generateStrategyVersions(ctx, String(entry.strategyId)),
      }),
    );
    const log = buildAuditLog({
      configAreas,
      riskChanges: getRiskChanges(),
      orders: generateOrderHistory(ctx, getOrders(), getApprovals(), reasons),
      strategies,
      nowMs: Date.now(),
    });
    return HttpResponse.json(parseGeneratedList(AuditEntrySchema, log, 'auditLog'), {
      status: 200,
    });
  }),
];
