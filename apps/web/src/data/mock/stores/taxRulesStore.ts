// In-memory tax rule sets for the page load (E-09; decisions 37, 41 and 45), keyed by country.

import type { TaxRuleSetConfigInput } from '../../schemas';
import { seedTaxRuleSetHistory, seedTaxRuleSets } from '../generators/taxRulesConfig';
import type { VersionStore } from './configStore';
import { currentConfigs } from './configStore';

let taxRules: VersionStore<TaxRuleSetConfigInput> | null = null;

export function getTaxRuleSetVersions(): VersionStore<TaxRuleSetConfigInput> {
  taxRules ??= new Map(
    seedTaxRuleSets().map((config) => [config.country, [...seedTaxRuleSetHistory(config)]]),
  );
  return taxRules;
}

export function currentTaxRuleSets(): TaxRuleSetConfigInput[] {
  return currentConfigs(getTaxRuleSetVersions());
}
