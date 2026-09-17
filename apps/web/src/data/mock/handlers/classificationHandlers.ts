// MSW handlers for classification, corporate structure and ownership (R-01; requirements 36).

import { http, HttpResponse, type HttpHandler } from 'msw';

import {
  createMockGeneratorContext,
  generateClassificationIndex,
  generateClassificationTaxonomy,
  generateCorporateStructure,
  generateFundLookThrough,
  generateInstrumentClassification,
  generateInstrumentOwnership,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';

const ctx = createMockGeneratorContext();

function failure(message: string): Response | null {
  return getActiveDeveloperScenario() === 'loading-error'
    ? HttpResponse.json({ error: message }, { status: 500 })
    : null;
}

const notFound = (): Response =>
  HttpResponse.json({ error: 'Instrument not found' }, { status: 404 });

export const classificationHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/classification/taxonomy', () => {
    return (
      failure('Failed to load the classification taxonomy') ??
      HttpResponse.json(generateClassificationTaxonomy(ctx))
    );
  }),

  http.get('/api/v1/classification/instruments', () => {
    return (
      failure('Failed to load the classification index') ??
      HttpResponse.json(generateClassificationIndex(ctx))
    );
  }),

  http.get('/api/v1/instruments/:id/classification', ({ params }) => {
    const failed = failure('Failed to load classification');
    if (failed !== null) return failed;
    const classification = generateInstrumentClassification(ctx, String(params['id']));
    return classification === null ? notFound() : HttpResponse.json(classification);
  }),

  http.get('/api/v1/instruments/:id/structure', ({ params }) => {
    const failed = failure('Failed to load corporate structure');
    if (failed !== null) return failed;
    const structure = generateCorporateStructure(ctx, String(params['id']));
    return structure === null ? notFound() : HttpResponse.json(structure);
  }),

  http.get('/api/v1/instruments/:id/look-through', ({ params }) => {
    const failed = failure('Failed to load the fund look-through');
    if (failed !== null) return failed;
    const lookThrough = generateFundLookThrough(ctx, String(params['id']));
    return lookThrough === null ? notFound() : HttpResponse.json(lookThrough);
  }),

  http.get('/api/v1/instruments/:id/ownership', ({ params }) => {
    const failed = failure('Failed to load the shareholding pattern');
    if (failed !== null) return failed;
    const ownership = generateInstrumentOwnership(ctx, String(params['id']));
    return ownership === null ? notFound() : HttpResponse.json(ownership);
  }),
];
