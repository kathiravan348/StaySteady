// MSW handlers for net worth (requirements 25; UI spec 19.1). Writes return the whole view (decision
// 33). The register is read-only to strategies and orders: no trading handler reads this store.

import { http, HttpResponse, type HttpHandler } from 'msw';

import { buildNetWorthView, parseGenerated } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { getManualAssets, setManualAssets } from '../stores/netWorthStore';
import {
  ManualAssetFieldsSchema,
  NetWorthViewSchema,
  RecordValuationRequestSchema,
  ReportCurrencySchema,
} from '../../schemas';
import { failure, firstIssue } from './versionedConfigHandlers';
import { portfolioValuation } from './portfolioValuation';

const today = (): string => new Date().toISOString().slice(0, 10);

function view(request: Request): Response {
  const parsed = ReportCurrencySchema.safeParse(new URL(request.url).searchParams.get('currency'));
  const result = buildNetWorthView(
    getManualAssets(),
    portfolioValuation(),
    parsed.success ? parsed.data : 'USD',
    today(),
  );
  return HttpResponse.json(parseGenerated(NetWorthViewSchema, result, 'netWorthView'), {
    status: 200,
  });
}

export const netWorthHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/net-worth', ({ request }) =>
    getActiveDeveloperScenario() === 'loading-error'
      ? failure('Failed to load net worth', 500)
      : view(request),
  ),

  http.post('/api/v1/net-worth/assets', async ({ request }) => {
    const parsed = ManualAssetFieldsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    const assets = getManualAssets();
    if (
      parsed.data.securedAgainstId !== null &&
      !assets.some((asset) => asset.id === parsed.data.securedAgainstId)
    ) {
      return failure('The asset this is secured against does not exist', 400);
    }
    const id = `asset-${String(Date.now())}`;
    setManualAssets([...assets, { id, ...parsed.data }]);
    return view(request);
  }),

  http.put('/api/v1/net-worth/assets/:id/valuation', async ({ params, request }) => {
    const id = String(params['id']);
    const assets = getManualAssets();
    const existing = assets.find((asset) => asset.id === id);
    if (existing === undefined) return failure('Asset not found', 404);
    const parsed = RecordValuationRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    if (parsed.data.valuedOn > today())
      return failure('A valuation cannot be dated in the future', 400);
    setManualAssets(
      assets.map((asset) => (asset.id === id ? { ...asset, ...parsed.data } : asset)),
    );
    return view(request);
  }),
];
