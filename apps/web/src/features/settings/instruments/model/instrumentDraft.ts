// Editing an instrument type configuration (UI spec 7.18): labels and a version described in the
// screen's own words for the diff.

import type { InstrumentTypeConfigInput, ProviderGranularityDto } from '../../../../data/schemas';
import { ProviderGranularitySchema } from '../../../../data/schemas';
import { instrumentTypeLabel } from '../../../../shared/format';

const GRANULARITY_LABELS: Readonly<Record<ProviderGranularityDto, string>> = {
  '1m': '1 minute',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '1h': '1 hour',
  '1d': '1 day',
};

export const GRANULARITY_OPTIONS = ProviderGranularitySchema.options.map((value) => ({
  value,
  label: GRANULARITY_LABELS[value],
}));

const list = (values: readonly string[]): string => values.join(', ') || 'None';

export function describeInstrumentType(config: InstrumentTypeConfigInput): Record<string, string> {
  const yes = (value: boolean): string => (value ? 'Yes' : 'No');
  return {
    Type: instrumentTypeLabel(config.type),
    Enabled: yes(config.enabled),
    'Automation permitted': yes(config.automationPermitted),
    'Manual only': yes(config.manualOnly),
    Markets: list(config.markets),
    Granularity: list(
      ProviderGranularitySchema.options
        .filter((item) => config.granularities.includes(item))
        .map((item) => GRANULARITY_LABELS[item]),
    ),
    'Minimum quantity': config.minimumQuantity,
    'Minimum order value': config.minimumOrderValue,
    Settlement:
      config.settlementDays === null ? 'Follows the market' : `T+${String(config.settlementDays)}`,
  };
}
