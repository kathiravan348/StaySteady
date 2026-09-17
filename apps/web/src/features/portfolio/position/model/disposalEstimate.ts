// What selling some of a position today would realise, cost and leave in cash (E-02; requirements 26;
// decision 45). Pure: lots are taken by the residence cost-basis method, gains are measured in the
// residence currency at each lot's purchase-date rate, fees come from the market configuration, and
// carried-forward losses and the yearly long-term exemption reduce the tax. An estimate, not advice.

import { Decimal } from 'decimal.js';

import type {
  AssetClassTaxRuleInput,
  LossCarryForwardDto,
  MarketConfigInput,
  TaxRuleSetConfigInput,
} from '../../../../data/schemas';
import type { FxQuote } from '../../../../shared/money';
import { findFxRate } from '../../../../shared/money';
import { taxAssetClassOf, taxRuleFor } from '../../../../shared/tax/taxRules';
import type { CurrencyCode } from '../../../../shared/types/currency';
import type { FxHistoryIndex } from '../../holdings/model/fxOnDate';
import { fxTableOn } from '../../holdings/model/fxOnDate';
import type { HoldingRow } from '../../holdings/model/holdingTypes';

const ZERO = new Decimal(0);
export const APPROACHING_DAYS = 30;

export type LotTerm = 'short' | 'long' | 'single';

export interface LotTaxView {
  readonly id: string;
  readonly purchaseDate: string;
  readonly quantity: number;
  readonly daysHeld: number;
  readonly term: LotTerm;
  // Days until long-term treatment; null once long term or when the class makes no distinction.
  readonly daysToLongTerm: number | null;
}

export interface DisposalInputs {
  readonly row: HoldingRow;
  readonly quantity: Decimal;
  readonly rules: TaxRuleSetConfigInput | null;
  readonly fees: MarketConfigInput['fees'] | null;
  readonly fxNow: readonly FxQuote[];
  readonly fxHistory: FxHistoryIndex;
  readonly losses: readonly LossCarryForwardDto[];
}

export interface DisposalEstimate {
  readonly assetClass: string;
  readonly rule: AssetClassTaxRuleInput | null;
  readonly taxCurrency: CurrencyCode;
  readonly quantity: Decimal;
  readonly gross: Decimal;
  readonly fees: Decimal;
  readonly shortGain: Decimal;
  readonly longGain: Decimal;
  readonly lossesUsed: Decimal;
  readonly exemptionUsed: Decimal;
  readonly tax: Decimal;
  // Tax converted into the instrument's currency, so net cash is in one currency.
  readonly taxLocal: Decimal | null;
  readonly net: Decimal | null;
  readonly usesAverageCost: boolean;
}

export function lotTaxViews(row: HoldingRow, rules: TaxRuleSetConfigInput | null): LotTaxView[] {
  const rule = taxRuleFor(rules, row.instrument);
  const threshold = rule?.longTermAfterDays ?? null;
  return row.lots.map((lot) => {
    const isLong = threshold !== null && lot.daysHeld >= threshold;
    return {
      id: lot.id,
      purchaseDate: lot.purchaseDate,
      quantity: lot.quantity,
      daysHeld: lot.daysHeld,
      term: threshold === null ? 'single' : isLong ? 'long' : 'short',
      daysToLongTerm: threshold === null || isLong ? null : threshold - lot.daysHeld,
    };
  });
}

function rateOn(table: readonly FxQuote[], from: CurrencyCode, to: CurrencyCode): Decimal {
  return from === to ? new Decimal(1) : (findFxRate(table, from, to) ?? new Decimal(Number.NaN));
}

// A short-term loss on this sale first offsets its long-term gain (a long-term loss offsets only
// long-term gains). Carried-forward losses then follow the same order: short-term losses against
// short then long-term gains, long-term losses against long-term gains only.
function offsetLosses(
  shortGain: Decimal,
  longGain: Decimal,
  losses: readonly LossCarryForwardDto[],
): { short: Decimal; long: Decimal; used: Decimal } {
  let short = Decimal.max(shortGain, ZERO);
  let long = Decimal.max(shortGain.isNegative() ? longGain.plus(shortGain) : longGain, ZERO);
  const available = (category: LossCarryForwardDto['category']): Decimal =>
    losses
      .filter((loss) => loss.category === category)
      .reduce((sum, loss) => sum.plus(loss.remaining.amount), ZERO);
  let shortLoss = available('short_term');
  const againstShort = Decimal.min(shortLoss, short);
  short = short.minus(againstShort);
  shortLoss = shortLoss.minus(againstShort);
  const againstLongFromShort = Decimal.min(shortLoss, long);
  long = long.minus(againstLongFromShort);
  const againstLong = Decimal.min(available('long_term'), long);
  long = long.minus(againstLong);
  return { short, long, used: againstShort.plus(againstLongFromShort).plus(againstLong) };
}

export function estimateDisposal(inputs: DisposalInputs): DisposalEstimate {
  const { row, rules, fees } = inputs;
  const local = row.lastPrice.currency;
  const taxCurrency: CurrencyCode = rules?.currency ?? local;
  const quantity = Decimal.min(Decimal.max(inputs.quantity, ZERO), row.quantity);
  const price = row.lastPrice.amount;
  const gross = quantity.times(price);
  const rule = taxRuleFor(rules, row.instrument);
  const assetClass = rules === null ? 'other' : taxAssetClassOf(row.instrument, rules.country);
  const threshold = rule?.longTermAfterDays ?? null;
  const rateNow = rateOn(inputs.fxNow, local, taxCurrency);
  const usesAverageCost = rules?.costBasisMethod === 'average';
  const totalUnits = row.lots.reduce((sum, lot) => sum.plus(lot.quantity), ZERO);

  let remaining = quantity;
  let shortGain = ZERO;
  let longGain = ZERO;
  for (const lot of row.lots) {
    if (remaining.lte(0)) break;
    // Average cost spreads the sale across every lot in proportion; FIFO takes the oldest first.
    const take = usesAverageCost
      ? quantity.times(lot.quantity).dividedBy(totalUnits)
      : Decimal.min(remaining, lot.quantity);
    const rateThen = rateOn(fxTableOn(inputs.fxHistory, lot.purchaseDate), local, taxCurrency);
    const gain = take
      .times(price)
      .times(rateNow)
      .minus(take.times(lot.costPerUnit.amount).times(rateThen));
    if (threshold !== null && lot.daysHeld >= threshold) longGain = longGain.plus(gain);
    else shortGain = shortGain.plus(gain);
    remaining = usesAverageCost ? remaining : remaining.minus(take);
  }

  const commission =
    fees === null
      ? ZERO
      : Decimal.max(
          new Decimal(fees.minimumCommission),
          gross.times(fees.commissionBps).dividedBy(10_000),
        );
  const feeTotal =
    fees === null
      ? ZERO
      : commission.plus(
          gross.times(fees.exchangeFeeBps + fees.transactionTaxBps).dividedBy(10_000),
        );

  const offset = offsetLosses(shortGain, longGain, inputs.losses);
  const exemptionUsed = Decimal.min(new Decimal(rule?.longTermExemption ?? '0'), offset.long);
  const tax =
    rule === null
      ? ZERO
      : offset.short
          .times(rule.shortTermRatePercent)
          .plus(offset.long.minus(exemptionUsed).times(rule.longTermRatePercent))
          .dividedBy(100);
  const taxLocal = rateNow.isNaN() || rateNow.isZero() ? null : tax.dividedBy(rateNow);

  return {
    assetClass,
    rule,
    taxCurrency,
    quantity,
    gross,
    fees: feeTotal,
    shortGain,
    longGain,
    lossesUsed: offset.used,
    exemptionUsed,
    tax,
    taxLocal,
    net: taxLocal === null ? null : gross.minus(feeTotal).minus(taxLocal),
    usesAverageCost,
  };
}
