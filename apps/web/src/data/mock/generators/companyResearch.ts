// Company research record generator (R-04; requirements 35). An instrument with no company behind
// it, or a company no provider has covered yet, answers with the reason: partial coverage is the
// normal state of this data and the interface has to be able to show it.

import type { InstrumentDto } from '../../schemas';
import type { CompanyProfileDto, CompanyProfileResponseDto } from '../../schemas/company-research';
import { CompanyProfileResponseSchema, CompanyProfileSchema } from '../../schemas/company-research';
import { getInstrumentById } from './canonicalInstruments';
import { INDUSTRY_BY_SYMBOL } from './classificationAssignments';
import { COMPANY_PROFILES } from './companyProfiles';
import type { MockGeneratorContext } from './mockContext';
import { parseGenerated } from './validated';

const SOURCE = 'Company filings and annual report (mock)';

export function companyProfileFor(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
): CompanyProfileDto | null {
  const definition = COMPANY_PROFILES[instrument.symbol];
  if (definition === undefined) return null;
  const [auditorName, opinionDate, isQualified, auditorNote] = definition.auditor;
  const recentChange = definition.people.some(([, , , appointedInLastYear]) => appointedInLastYear);
  return parseGenerated(
    CompanyProfileSchema,
    {
      instrumentId: String(instrument.id),
      symbol: instrument.symbol,
      legalName: definition.legalName,
      description: definition.description,
      incorporationCountry: definition.incorporationCountry,
      primaryListing: definition.primaryListing,
      secondaryListings: [...definition.secondaryListings],
      listedSince: definition.listedSince,
      headquarters: definition.headquarters,
      website: definition.website,
      employeeCount: definition.employees,
      reportingCurrency: instrument.currency,
      fiscalYearEnd: definition.fiscalYearEnd,
      identifiers: { isin: definition.isin, localCode: definition.localCode },
      revenueBySegment: definition.segments.map(([name, sharePercent]) => ({ name, sharePercent })),
      revenueByGeography: definition.geographies.map(([name, sharePercent]) => ({
        name,
        sharePercent,
      })),
      people: definition.people.map(([role, name, inRoleSince, appointedInLastYear]) => ({
        role,
        name,
        inRoleSince,
        appointedInLastYear,
      })),
      auditor: {
        name: auditorName,
        lastOpinionDate: opinionDate,
        isQualified,
        note: auditorNote,
      },
      dependencies: [...definition.dependencies],
      asOf: String(ctx.referenceTime).slice(0, 10),
      source: SOURCE,
      note: recentChange
        ? 'A change in the executive team within the last twelve months is recorded below.'
        : 'No change in the executive team in the last twelve months.',
    },
    'company profile',
  );
}

export function generateCompanyProfile(
  ctx: MockGeneratorContext,
  instrumentId: string,
): CompanyProfileResponseDto | null {
  const instrument = getInstrumentById(instrumentId);
  if (instrument === undefined) return null;
  const profile = companyProfileFor(ctx, instrument);
  return parseGenerated(
    CompanyProfileResponseSchema,
    {
      instrumentId: String(instrument.id),
      profile,
      unavailableReason:
        profile !== null
          ? null
          : INDUSTRY_BY_SYMBOL[instrument.symbol] === undefined
            ? 'No company sits behind this instrument, so there is no company record to show.'
            : 'No provider has supplied a company record for this business yet.',
    },
    'company profile response',
  );
}
