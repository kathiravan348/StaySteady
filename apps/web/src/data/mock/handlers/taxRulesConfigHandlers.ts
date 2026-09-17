// MSW handlers for tax rule sets (E-09; UI spec 7.18; decision 45), on the versioned configuration
// factory. Health compares the residence rules with what is actually held.

import type { HttpHandler } from 'msw';

import { generatePortfolioData, getInstrumentById } from '../generators';
import type { HeldInstrument } from '../generators/taxRulesConfig';
import { taxRuleSetHealth } from '../generators/taxRulesConfig';
import { getTaxRuleSetVersions } from '../stores/taxRulesStore';
import { tradingContext } from '../stores/tradingStore';
import type { TaxRuleSetConfigInput } from '../../schemas';
import { SaveTaxRuleSetRequestSchema, TaxRuleSetListSchema } from '../../schemas';
import { versionedConfigHandlers } from './versionedConfigHandlers';

function heldInstruments(): HeldInstrument[] {
  return generatePortfolioData(tradingContext).holdings.flatMap((holding) => {
    const instrument = getInstrumentById(String(holding.instrumentId));
    return instrument === undefined
      ? []
      : [
          {
            type: instrument.type,
            marketId: String(instrument.marketId),
            symbol: instrument.symbol,
          },
        ];
  });
}

function entries(): unknown[] {
  const held = heldInstruments();
  return [...getTaxRuleSetVersions().values()].flatMap((versions) => {
    const config = versions[0]?.snapshot;
    return config === undefined
      ? []
      : [{ config, health: taxRuleSetHealth(config, held), versions }];
  });
}

// Exactly one rule set is the residence; saving a second, or clearing the only one, is refused so
// tax estimates always have one set of rules to follow.
function check(config: TaxRuleSetConfigInput): string | null {
  const otherResidences = [...getTaxRuleSetVersions().entries()].filter(
    ([country, versions]) =>
      country !== config.country && versions[0]?.snapshot.isResidence === true,
  ).length;
  const residences = otherResidences + (config.isResidence ? 1 : 0);
  if (residences === 0) return 'One rule set must be the country of residence';
  if (residences > 1) return 'Only one rule set can be the country of residence';
  return null;
}

export const taxRulesConfigHandlers: readonly HttpHandler[] =
  versionedConfigHandlers<TaxRuleSetConfigInput>({
    path: '/api/v1/config/tax-rules',
    noun: 'Tax rule set',
    idOf: (config) => config.country,
    store: getTaxRuleSetVersions,
    listSchema: TaxRuleSetListSchema,
    saveSchema: SaveTaxRuleSetRequestSchema,
    entries,
    allowCreate: false,
    check,
  });
