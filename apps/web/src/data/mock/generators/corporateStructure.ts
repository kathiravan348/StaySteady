// Parent, business group and material listed relatives of the company behind an instrument
// (R-01; requirements 36). Holding four companies of one group is one bet, so the structure is
// data, not a footnote: group exposure (R-03) is measured from it.

import type { InstrumentDto } from '../../schemas';
import type { z } from 'zod';

import type { CompanyRelation, CorporateStructureDto } from '../../schemas/classification';
import { CorporateStructureSchema, RelatedCompanySchema } from '../../schemas/classification';
import { CANONICAL_INSTRUMENTS, getInstrumentById } from './canonicalInstruments';
import { GROUP_ID_BY_SYMBOL, GROUPS, INDUSTRY_BY_SYMBOL } from './classificationAssignments';
import type { MockGeneratorContext } from './mockContext';
import { parseGenerated } from './validated';

const SOURCE = 'Company filings and exchange disclosures (mock)';

type RelatedCompanyInput = z.input<typeof RelatedCompanySchema>;
type RelativeInput = Omit<RelatedCompanyInput, 'instrumentId' | 'marketId'>;

interface StructureDefinition {
  readonly parent?: RelativeInput;
  readonly related?: readonly RelativeInput[];
  readonly note?: string;
}

const relative = (
  name: string,
  symbol: string | null,
  relation: CompanyRelation,
  sharePercent: number | null,
  isListed = true,
): RelativeInput => ({ name, symbol, relation, sharePercent, isListed });

const STRUCTURES: Readonly<Record<string, StructureDefinition>> = {
  TATAMOTORS: {
    parent: relative('Tata Sons Private Limited', null, 'parent', 42.6, false),
    related: [
      relative('Tata Consultancy Services Limited', 'TCS', 'group_company', null),
      relative('Tata Motors Finance Limited', null, 'subsidiary', 100, false),
    ],
    note: 'Held through the Tata group holding company, which is itself unlisted. A group-wide event reaches every Tata holding at once.',
  },
  TCS: {
    parent: relative('Tata Sons Private Limited', null, 'parent', 71.7, false),
    related: [relative('Tata Motors Limited', 'TATAMOTORS', 'group_company', null)],
    note: 'Same group holding company as the other Tata listings tracked here.',
  },
  RELIANCE: {
    related: [
      relative('Jio Financial Services Limited', null, 'group_company', null),
      relative('Reliance Retail Ventures Limited', null, 'subsidiary', 85.0, false),
    ],
    note: 'Top of its own structure. Exposure to the retail and telecom businesses is held through unlisted subsidiaries rather than separate listings.',
  },
  HDFCBANK: {
    related: [
      relative('HDFC Life Insurance Company Limited', null, 'subsidiary', 50.3),
      relative('HDFC Asset Management Company Limited', null, 'subsidiary', 52.5),
    ],
    note: 'Two listed subsidiaries of its own, so buying the insurer or the asset manager alongside the bank concentrates one group.',
  },
  '7203': {
    related: [
      relative('Toyota Industries Corporation', null, 'associate', 24.7),
      relative('Denso Corporation', null, 'associate', 24.2),
      relative('Hino Motors Limited', null, 'subsidiary', 50.1),
    ],
    note: 'Cross-holdings across the group are substantial; the listed associates move with the parent.',
  },
  D05: {
    parent: relative('Temasek Holdings (Private) Limited', null, 'parent', 29.0, false),
    note: 'Temasek is a controlling shareholder rather than a holding company: there is no parent above the bank in the ordinary sense.',
  },
  GOOGL: {
    note: 'Alphabet is the holding company; the operating businesses are unlisted subsidiaries beneath it.',
  },
  'BRK.B': {
    note: 'A holding company whose operating subsidiaries are unlisted. Its large minority stakes in listed companies are investments, not group control.',
  },
  SWIGGY: {
    note: 'Professionally managed with no promoter or holding company above it.',
  },
};

function resolve(input: RelativeInput): RelatedCompanyInput {
  const canonical =
    input.symbol === null
      ? undefined
      : CANONICAL_INSTRUMENTS.find((item) => item.symbol === input.symbol);
  return {
    ...input,
    instrumentId: canonical === undefined ? null : String(canonical.id),
    marketId: canonical === undefined ? null : String(canonical.marketId),
  };
}

function noteFor(instrument: InstrumentDto, definition: StructureDefinition | undefined): string {
  if (definition?.note !== undefined) return definition.note;
  if (INDUSTRY_BY_SYMBOL[instrument.symbol] !== undefined) {
    return 'No parent, holding company or material listed relative is recorded for this company.';
  }
  return 'No company sits behind this instrument, so there is no corporate structure to show.';
}

export function structureForInstrument(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
): CorporateStructureDto {
  const definition = STRUCTURES[instrument.symbol];
  const groupId = GROUP_ID_BY_SYMBOL[instrument.symbol] ?? null;
  return parseGenerated(
    CorporateStructureSchema,
    {
      instrumentId: String(instrument.id),
      companyName: instrument.name,
      parent: definition?.parent === undefined ? null : resolve(definition.parent),
      groupId,
      groupName: groupId === null ? null : (GROUPS[groupId] ?? null),
      related: (definition?.related ?? []).map(resolve),
      asOf: String(ctx.referenceTime).slice(0, 10),
      source: SOURCE,
      note: noteFor(instrument, definition),
    },
    'corporate structure',
  );
}

export function generateCorporateStructure(
  ctx: MockGeneratorContext,
  instrumentId: string,
): CorporateStructureDto | null {
  const instrument = getInstrumentById(instrumentId);
  return instrument === undefined ? null : structureForInstrument(ctx, instrument);
}

// Every symbol in the same business group, itself excluded (used by group exposure, R-03).
export function groupSymbolsForSymbol(symbol: string): readonly string[] {
  const groupId = GROUP_ID_BY_SYMBOL[symbol];
  if (groupId === undefined) return [];
  return Object.entries(GROUP_ID_BY_SYMBOL)
    .filter(([peer, id]) => id === groupId && peer !== symbol)
    .map(([peer]) => peer);
}
