// Per market, per instrument type and per strategy limits (UI spec 7.14). Strategy limits are the
// ones each strategy's own definition sets (S-11), so they agree with the approval queue's checks.

import type { z } from 'zod';

import { humanizeToken } from '../../../shared/format';
import type { HoldingDto } from '../../schemas';
import type { RiskLimitSchema } from '../../schemas';
import type { MockGeneratorContext } from './mockContext';
import { pct, sumBy } from './riskMeasures';
import { generateStrategyDraft } from './strategyDrafts';
import { generateStrategies } from './trading';

type LimitInput = z.input<typeof RiskLimitSchema>;
export type LimitSpec = Omit<LimitInput, 'isBreached' | 'direction' | 'isEditable'> & {
  readonly direction?: LimitInput['direction'];
  readonly isEditable?: boolean;
};

export interface HoldingLabels {
  readonly symbolOf: (holding: HoldingDto) => string;
  readonly marketOf: (holding: HoldingDto) => string;
  readonly typeOf: (holding: HoldingDto) => string;
}

export function groupLimitSpecs(
  ctx: MockGeneratorContext,
  holdings: readonly HoldingDto[],
  { symbolOf, marketOf, typeOf }: HoldingLabels,
): LimitSpec[] {
  const specs: LimitSpec[] = [];

  const marketCaps: Readonly<Record<string, number>> = { US: 97, IN: 15, UK: 15, JP: 15, SG: 15 };
  sumBy(holdings, marketOf).forEach((share, market) => {
    specs.push({
      id: `market-${market}`,
      group: 'market',
      scopeLabel: market,
      name: `Maximum in ${market}`,
      unit: 'percent',
      threshold: marketCaps[market] ?? 15,
      used: share,
      currency: null,
      measuredBy: `${pct(share)} of holdings are in ${market}`,
      consequence: `New buys in ${market} are blocked.`,
      minimum: 1,
      maximum: 100,
    });
  });

  const typeCaps: Readonly<Record<string, number>> = {
    long_term: 40,
    etf: 40,
    commodity: 45,
    digital_asset: 5,
    bond: 20,
  };
  sumBy(holdings, typeOf).forEach((share, type) => {
    const label = humanizeToken(type);
    specs.push({
      id: `type-${type}`,
      group: 'instrument_type',
      scopeLabel: label,
      name: `Maximum in ${label}`,
      unit: 'percent',
      threshold: typeCaps[type] ?? 25,
      used: share,
      currency: null,
      measuredBy: `${pct(share)} of holdings are ${label}`,
      consequence: `New buys of ${label} instruments are blocked.`,
      minimum: 1,
      maximum: 100,
    });
  });

  for (const strategy of generateStrategies(ctx)) {
    const id = String(strategy.id);
    const draft = generateStrategyDraft(ctx, id);
    if (draft === undefined || draft.allocation.maxCapitalPercent <= 0) continue;
    const own = holdings.filter((holding) => String(holding.openedByStrategyId ?? '') === id);
    const capitalUsed = Number(
      own.reduce((sum, holding) => sum + Number(holding.allocationPercent), 0).toFixed(2),
    );
    const biggest = own.reduce<HoldingDto | undefined>(
      (best, holding) =>
        best === undefined || Number(holding.allocationPercent) > Number(best.allocationPercent)
          ? holding
          : best,
      undefined,
    );
    const biggestShare = biggest === undefined ? 0 : Number(biggest.allocationPercent);
    specs.push(
      {
        id: `strategy-${id}-capital`,
        group: 'strategy',
        scopeLabel: strategy.name,
        name: 'Capital for this strategy',
        unit: 'percent',
        threshold: draft.allocation.maxCapitalPercent,
        used: capitalUsed,
        currency: null,
        measuredBy:
          own.length === 0
            ? 'Holds nothing'
            : `${own.map(symbolOf).join(' and ')}, ${pct(capitalUsed)} of holdings`,
        consequence: `New buys by ${strategy.name} are blocked.`,
        minimum: 1,
        maximum: 100,
      },
      {
        id: `strategy-${id}-position`,
        group: 'strategy',
        scopeLabel: strategy.name,
        name: 'Largest single position',
        unit: 'percent',
        threshold: draft.sizing.maxPositionPercent,
        used: biggestShare,
        currency: null,
        measuredBy:
          biggest === undefined
            ? 'Holds nothing'
            : `${symbolOf(biggest)}, ${pct(biggestShare)} of holdings`,
        consequence: `A buy that would take any ${strategy.name} position past this is blocked.`,
        minimum: 1,
        maximum: 100,
      },
      {
        id: `strategy-${id}-concurrent`,
        group: 'strategy',
        scopeLabel: strategy.name,
        name: 'Open positions',
        unit: 'count',
        threshold: draft.allocation.maxConcurrentPositions,
        used: own.length,
        currency: null,
        measuredBy: `${String(own.length)} open`,
        consequence: 'A buy that would open another position is blocked.',
        minimum: 1,
        maximum: 100,
      },
    );
  }

  return specs;
}
