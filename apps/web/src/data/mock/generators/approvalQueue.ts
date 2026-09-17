// Approval queue (UI spec 7.12). Each pending approval is joined to its order, the instrument's
// live quote, the current holdings and the strategy's own capital limits, so the impact preview and
// the risk checks are derived from what the rest of the app shows rather than invented here.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type { FxQuote } from '../../../shared/money';
import { convertMoneyWithTable, createMoney } from '../../../shared/money';
import { generateCurrentFxRates } from './fxHistory';
import type {
  ApprovalDto,
  ApprovalQueueItemDto,
  HoldingDto,
  MarketQuoteDto,
  OrderDto,
  PortfolioSummaryDto,
  StrategyDraftDto,
  StrategyDto,
} from '../../schemas';
import { ApprovalQueueItemSchema } from '../../schemas';
import { generateInitialQuotes, getInstrumentById } from './instruments';
import type { MockGeneratorContext } from './mockContext';
import { generatePortfolioData } from './portfolio';
import { generateStrategyDraft } from './strategyDrafts';
import { generateApprovals, generateOrders, generateStrategies } from './trading';
import { parseGeneratedList } from './validated';

type RequestInput = z.input<typeof ApprovalQueueItemSchema>;
type CurrencyCode = PortfolioSummaryDto['totalValue']['currency'];
type Money = { amount: string; currency: CurrencyCode };

// Anything a strategy below semi-automatic proposes is simulated: it never reaches a broker.
function isSimulated(strategy: StrategyDto | undefined): boolean {
  return strategy === undefined
    ? false
    : strategy.stage !== 'semi_automatic' && strategy.stage !== 'fully_automatic';
}

function money(amount: Decimal, currency: CurrencyCode): Money {
  return { amount: amount.toFixed(2), currency };
}

interface ImpactInputs {
  readonly order: OrderDto;
  readonly quote: MarketQuoteDto | undefined;
  readonly holding: HoldingDto | undefined;
  readonly summary: PortfolioSummaryDto;
  readonly holdings: readonly HoldingDto[];
  readonly draft: StrategyDraftDto | undefined;
  readonly fxTable: readonly FxQuote[];
}

// Allocation and cash are portfolio-wide, so a cost in rupees has to become base currency first.
// Without this a 59,100 rupee order reads as 60% of a dollar portfolio.
function toBase(
  amount: Decimal,
  currency: CurrencyCode,
  base: CurrencyCode,
  fxTable: readonly FxQuote[],
): Decimal {
  return currency === base
    ? amount
    : convertMoneyWithTable(createMoney(amount, currency), base, fxTable).amount;
}

// Values are kept in the instrument's own currency for price and cost, and in the portfolio's base
// currency for allocation and cash, which is how the other screens already present them.
function buildImpact(inputs: ImpactInputs): RequestInput['impact'] {
  const { order, quote, holding, summary, holdings, draft, fxTable } = inputs;
  const isBuy = order.side === 'buy';
  const quantity = new Decimal(Number(order.quantity));
  const unitPrice = new Decimal(
    order.limitPrice?.amount ?? quote?.lastPrice.amount ?? holding?.currentPrice.amount ?? '0',
  );
  const currency = order.limitPrice?.currency ?? quote?.lastPrice.currency ?? 'USD';
  const cost = quantity.times(unitPrice);

  const base = summary.totalValue.currency;
  const costInBase = toBase(cost, currency, base, fxTable);

  const positionBefore = new Decimal(holding?.currentValue.amount ?? '0');
  const positionAfter = isBuy
    ? positionBefore.plus(cost)
    : Decimal.max(positionBefore.minus(cost), 0);
  const positionBeforeBase = toBase(
    positionBefore,
    holding?.currentValue.currency ?? currency,
    base,
    fxTable,
  );
  const positionAfterBase = isBuy
    ? positionBeforeBase.plus(costInBase)
    : Decimal.max(positionBeforeBase.minus(costInBase), 0);

  const totalValue = new Decimal(summary.totalValue.amount);
  const cashBefore = new Decimal(summary.cashBalance.amount);
  const cashAfter = isBuy ? cashBefore.minus(costInBase) : cashBefore.plus(costInBase);

  const allocationBefore = Number(holding?.allocationPercent ?? 0);
  const allocationAfter = totalValue.isZero()
    ? allocationBefore
    : Number(positionAfterBase.dividedBy(totalValue).times(100).toFixed(2));

  // The limit belongs to the strategy, so only that strategy's positions are counted against it.
  const strategyHoldings = holdings.filter(
    (item) => String(item.openedByStrategyId ?? '') === String(order.strategyId ?? ''),
  );
  const openNow = strategyHoldings.length;
  const openAfter =
    isBuy && holding === undefined
      ? openNow + 1
      : !isBuy && positionAfter.isZero()
        ? openNow - 1
        : openNow;

  const strategyUsed = strategyHoldings.reduce(
    (sum, item) => sum + Number(item.allocationPercent),
    0,
  );

  return {
    estimatedCost: money(cost, currency),
    currentPrice: money(
      new Decimal(quote?.lastPrice.amount ?? holding?.currentPrice.amount ?? unitPrice.toString()),
      currency,
    ),
    // Shown in base currency so before and after are the same unit as the allocation beside them.
    positionValueBefore: money(positionBeforeBase, base),
    positionValueAfter: money(positionAfterBase, base),
    allocationPercentBefore: Number(allocationBefore.toFixed(2)),
    allocationPercentAfter: allocationAfter,
    cashBefore: money(cashBefore, summary.cashBalance.currency),
    cashAfter: money(cashAfter, summary.cashBalance.currency),
    strategyCapitalUsedPercent: Number(strategyUsed.toFixed(2)),
    strategyCapitalLimitPercent: draft?.allocation.maxCapitalPercent ?? 0,
    openPositionsAfter: Math.max(openAfter, 0),
    maxConcurrentPositions: draft?.allocation.maxConcurrentPositions ?? 0,
  };
}

// Checks describe what was actually examined, so approving is an informed act rather than a habit.
function buildRiskChecks(
  impact: RequestInput['impact'],
  order: OrderDto,
  draft: StrategyDraftDto | undefined,
): RequestInput['riskChecks'] {
  const maxPosition = draft?.sizing.maxPositionPercent ?? 0;
  const allocationAfter = impact.allocationPercentAfter;
  const cashAfter = new Decimal(impact.cashAfter.amount);
  const limit = impact.strategyCapitalLimitPercent;
  const usedAfter =
    order.side === 'buy'
      ? impact.strategyCapitalUsedPercent + (allocationAfter - impact.allocationPercentBefore)
      : impact.strategyCapitalUsedPercent;

  return [
    {
      id: 'position-size',
      label: 'Position size within the strategy limit',
      status: maxPosition === 0 || allocationAfter <= maxPosition ? 'passed' : 'failed',
      detail:
        maxPosition === 0
          ? 'This strategy sets no per-position limit.'
          : `The position would be ${allocationAfter.toFixed(2)}% of the portfolio against the ${String(maxPosition)}% limit.`,
    },
    {
      id: 'strategy-capital',
      label: 'Strategy capital remaining',
      status: limit === 0 || usedAfter <= limit ? 'passed' : 'warning',
      detail:
        limit === 0
          ? 'This strategy has no capital limit set.'
          : `${usedAfter.toFixed(2)}% of the portfolio would sit with this strategy against the ${String(limit)}% limit.`,
    },
    {
      id: 'cash',
      label: 'Cash covers the order',
      status: cashAfter.isNegative() ? 'failed' : 'passed',
      detail: cashAfter.isNegative()
        ? `Cash would fall to ${impact.cashAfter.currency} ${cashAfter.toFixed(2)}, which is short.`
        : `Cash would be ${impact.cashAfter.currency} ${cashAfter.toFixed(2)} after this order.`,
    },
    {
      id: 'concurrent',
      label: 'Concurrent positions within the limit',
      status:
        impact.maxConcurrentPositions === 0 ||
        impact.openPositionsAfter <= impact.maxConcurrentPositions
          ? 'passed'
          : 'warning',
      detail:
        impact.maxConcurrentPositions === 0
          ? 'This strategy sets no limit on concurrent positions.'
          : `${String(impact.openPositionsAfter)} position${impact.openPositionsAfter === 1 ? '' : 's'} for this strategy would be open against a limit of ${String(impact.maxConcurrentPositions)}.`,
    },
  ];
}

function buildRequest(
  approval: ApprovalDto,
  order: OrderDto,
  ctx: MockGeneratorContext,
  strategies: readonly StrategyDto[],
  quotes: readonly MarketQuoteDto[],
  holdings: readonly HoldingDto[],
  summary: PortfolioSummaryDto,
  fxTable: readonly FxQuote[],
): RequestInput {
  const instrument = getInstrumentById(String(order.instrumentId));
  const strategy = strategies.find((item) => String(item.id) === String(order.strategyId ?? ''));
  const draft =
    order.strategyId === undefined
      ? undefined
      : generateStrategyDraft(ctx, String(order.strategyId));
  const quote = quotes.find((item) => String(item.instrumentId) === String(order.instrumentId));
  const holding = holdings.find((item) => String(item.instrumentId) === String(order.instrumentId));

  const impact = buildImpact({ order, quote, holding, summary, holdings, draft, fxTable });

  return {
    approvalId: approval.id,
    orderId: String(approval.orderId),
    signalId: null,
    instrumentId: order.instrumentId,
    instrumentSymbol: instrument?.symbol ?? String(order.instrumentId),
    instrumentName: instrument?.name ?? String(order.instrumentId),
    marketId: instrument === undefined ? 'unknown' : String(instrument.marketId),
    strategyId: order.strategyId ?? null,
    strategyName: strategy?.name ?? null,
    side: order.side,
    orderType: order.type,
    quantity: order.quantity,
    limitPrice: order.limitPrice ?? null,
    reason: approval.reason,
    status: approval.status,
    requestedAt: approval.requestedAt,
    expiresAt: approval.expiresAt,
    decidedAt: approval.decidedAt ?? null,
    decidedBy: approval.decidedBy ?? null,
    decisionReason: null,
    isSimulated: isSimulated(strategy),
    riskChecks: buildRiskChecks(impact, order, draft),
    impact,
  };
}

// Approvals and orders default to freshly generated ones; the handlers pass their live stores so a
// decision or an emergency cancel is reflected in the queue.
export function generateApprovalQueue(
  ctx: MockGeneratorContext,
  approvals: readonly ApprovalDto[] = generateApprovals(ctx),
  orders: readonly OrderDto[] = generateOrders(ctx),
): readonly ApprovalQueueItemDto[] {
  const strategies = generateStrategies(ctx);
  const quotes = generateInitialQuotes(ctx);
  const portfolio = generatePortfolioData(ctx);
  const fxTable: readonly FxQuote[] = generateCurrentFxRates(ctx).map((rate) => ({
    from: rate.from,
    to: rate.to,
    rate: new Decimal(rate.rate),
  }));

  const requests = approvals.flatMap((approval): RequestInput[] => {
    const order = orders.find((item) => String(item.id) === String(approval.orderId));
    return order === undefined
      ? []
      : [
          buildRequest(
            approval,
            order,
            ctx,
            strategies,
            quotes,
            portfolio.holdings,
            portfolio.summary,
            fxTable,
          ),
        ];
  });

  return parseGeneratedList(ApprovalQueueItemSchema, requests, 'ApprovalRequest');
}
