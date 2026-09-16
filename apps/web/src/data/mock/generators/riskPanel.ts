// Risk panel assembly (UI spec 7.14): limits, the instruments still inside a repeat-action cooldown,
// and the record of every change.

import type { z } from 'zod';

import type { RiskChangeDto, RiskPanelDto } from '../../schemas';
import { RiskPanelSchema } from '../../schemas';
import type { MockGeneratorContext } from './mockContext';
import { getInstrumentById } from './instruments';
import { generatePortfolioData } from './portfolio';
import { generateRiskLimits, type RiskLimitInputs } from './riskLimits';
import { parseGenerated } from './validated';

type PanelInput = z.input<typeof RiskPanelSchema>;

const MINUTE_MS = 60_000;

export interface RiskPanelInputs extends RiskLimitInputs {
  readonly changes: readonly RiskChangeDto[];
  // Real time, because a cooldown is live state rather than seeded history.
  readonly nowMs: number;
}

export function generateRiskPanel(
  ctx: MockGeneratorContext,
  inputs: RiskPanelInputs,
): RiskPanelDto {
  const limits = generateRiskLimits(ctx, inputs);
  const { summary } = generatePortfolioData(ctx);
  const cooldownMinutes = limits.find((item) => item.id === 'global-cooldown')?.threshold ?? 30;

  // The most recent order per instrument and direction is the one a repeat would be measured from.
  const latest = new Map<string, { symbol: string; side: string; createdMs: number }>();
  inputs.orders.forEach((order) => {
    const key = `${String(order.instrumentId)}|${order.side}`;
    const createdMs = new Date(String(order.createdAt)).getTime();
    const existing = latest.get(key);
    if (existing === undefined || createdMs > existing.createdMs) {
      latest.set(key, {
        symbol: getInstrumentById(String(order.instrumentId))?.symbol ?? String(order.instrumentId),
        side: order.side,
        createdMs,
      });
    }
  });
  const cooldowns = [...latest.values()]
    .map((item) => ({ ...item, endsMs: item.createdMs + cooldownMinutes * MINUTE_MS }))
    .filter((item) => item.endsMs > inputs.nowMs)
    .map((item) => ({
      instrumentSymbol: item.symbol,
      action: item.side,
      endsAt: new Date(item.endsMs).toISOString(),
    }));

  const total = Number(summary.totalValue.amount) + Number(summary.cashBalance.amount);
  const panel: PanelInput = {
    asOf: new Date(inputs.nowMs).toISOString(),
    totalCapital: { amount: total.toFixed(2), currency: summary.totalValue.currency },
    limits: [...limits],
    cooldowns,
    changes: [...inputs.changes],
  };
  return parseGenerated(RiskPanelSchema, panel, 'RiskPanel');
}
