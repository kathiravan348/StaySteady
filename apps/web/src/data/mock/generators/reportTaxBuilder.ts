// Tax summary report (UI spec 7.16): realised and unrealised gains by holding period with an estimated
// tax, using the residence tax rule set's holding periods, rates and long-term exemptions per asset
// class (decision 45). An estimate, never advice.

import { Decimal } from 'decimal.js';

import type { HoldingDto, TaxAssetClassDto } from '../../schemas';
import { TAX_ASSET_CLASS_LABEL, taxAssetClassOf, taxRuleFor } from '../../../shared/tax/taxRules';
import { dividends } from './reportCashBuilders';
import type { BuildInput, ReportParts } from './reportParts';
import { column, countCell, metric, moneyCell, percentCell, textCell } from './reportParts';
import { daysBetween } from './reportValuation';

const ZERO = new Decimal(0);
const APPROACHING_DAYS = 30;

export function taxReport(input: BuildInput): ReportParts {
  const { v, to, currency } = input;
  let shortGain = ZERO;
  let longGain = ZERO;
  let estimated = ZERO;
  let approaching = 0;
  // Long-term gains per asset class, so each class's yearly exemption is applied once.
  const longByClass = new Map<string, { gain: Decimal; rate: number; exemption: Decimal }>();
  const byClass = new Map<TaxAssetClassDto, { short: Decimal; long: Decimal }>();
  const rules = v.taxRules;
  const rows = v.holdings.flatMap((holding: HoldingDto) => {
    const id = String(holding.instrumentId);
    const instrument = v.instrument(id);
    const price = v.close(id, to);
    if (instrument === undefined || price === null) return [];
    const taxable = {
      type: instrument.type,
      marketId: String(instrument.marketId),
      symbol: instrument.symbol,
    };
    const rule = taxRuleFor(rules, taxable);
    const assetClass = rules === null ? 'other' : taxAssetClassOf(taxable, rules.country);
    return holding.lots
      .filter((lot) => lot.purchaseDate <= to)
      .map((lot) => {
        const held = daysBetween(lot.purchaseDate, to);
        const threshold = rule?.longTermAfterDays ?? null;
        const isLong = threshold !== null && held >= threshold;
        if (threshold !== null && !isLong && threshold - held <= APPROACHING_DAYS) approaching += 1;
        // Value at today's rate less cost at the rate on the purchase date.
        const units = new Decimal(lot.quantity);
        const gain = units
          .times(price)
          .times(v.fx(instrument.currency, currency, to))
          .minus(
            units
              .times(lot.costPerUnit.amount)
              .times(v.fx(instrument.currency, currency, lot.purchaseDate)),
          );
        const classTotals = byClass.get(assetClass) ?? { short: ZERO, long: ZERO };
        byClass.set(
          assetClass,
          isLong
            ? { ...classTotals, long: classTotals.long.plus(gain) }
            : { ...classTotals, short: classTotals.short.plus(gain) },
        );
        const rate = isLong ? (rule?.longTermRatePercent ?? 0) : (rule?.shortTermRatePercent ?? 0);
        const tax = gain.isPositive() ? gain.times(rate).dividedBy(100) : ZERO;
        if (isLong) {
          longGain = longGain.plus(gain);
          const exemption =
            rules === null
              ? ZERO
              : new Decimal(rule?.longTermExemption ?? '0').times(
                  v.fx(rules.currency, currency, to),
                );
          const current = longByClass.get(assetClass);
          longByClass.set(assetClass, {
            gain: (current?.gain ?? ZERO).plus(gain),
            rate,
            exemption,
          });
        } else {
          shortGain = shortGain.plus(gain);
        }
        estimated = estimated.plus(tax);
        return {
          id: lot.id,
          cells: {
            instrument: textCell(`${instrument.symbol} (${TAX_ASSET_CLASS_LABEL[assetClass]})`),
            bought: textCell(lot.purchaseDate),
            held: countCell(held),
            term: textCell(
              threshold === null
                ? 'No distinction'
                : isLong
                  ? 'Long term'
                  : `Short term (${String(threshold - held)} days to long term)`,
            ),
            gain: moneyCell(gain, currency),
            rate: percentCell(rate),
            tax: moneyCell(tax, currency),
          },
        };
      });
  });
  // The yearly long-term exemption lowers the estimate once per class, up to that class's gains.
  const relief = [...longByClass.values()].reduce(
    (sum, item) =>
      sum.plus(
        Decimal.min(item.exemption, Decimal.max(item.gain, ZERO)).times(item.rate).dividedBy(100),
      ),
    ZERO,
  );
  estimated = Decimal.max(estimated.minus(relief), ZERO);
  const withheld = dividends(input).reduce((sum, row) => sum.plus(row.withheld), ZERO);

  return {
    title: 'Tax summary',
    metrics: [
      metric(
        'realised',
        'Realised gains in the period',
        moneyCell(ZERO, currency),
        'There were no sales in the period.',
      ),
      metric('short', 'Unrealised short-term gains', moneyCell(shortGain, currency)),
      metric('long', 'Unrealised long-term gains', moneyCell(longGain, currency)),
      metric(
        'estimate',
        'Estimated tax if everything were sold',
        moneyCell(estimated, currency),
        `At ${to} prices, using the residence tax rules after long-term exemptions. An estimate, not advice.`,
      ),
      metric('withheld', 'Dividend tax withheld (estimated)', moneyCell(withheld, currency)),
      metric(
        'approaching',
        'Lots within 30 days of long-term treatment',
        countCell(approaching),
        'Selling these a little later may lower the tax rate.',
      ),
    ],
    chart: null,
    tables: [
      {
        id: 'classes',
        title: 'Unrealised gains by asset class',
        columns: [
          column('assetClass', 'Asset class', 'start'),
          column('short', 'Short term'),
          column('long', 'Long term'),
        ],
        rows: [...byClass.entries()].map(([assetClass, totals]) => ({
          id: assetClass,
          cells: {
            assetClass: textCell(TAX_ASSET_CLASS_LABEL[assetClass]),
            short: moneyCell(totals.short, currency),
            long: moneyCell(totals.long, currency),
          },
        })),
        total: null,
      },
      {
        id: 'lots',
        title: `Open lots at ${to}`,
        columns: [
          column('instrument', 'Instrument', 'start'),
          column('bought', 'Bought', 'start'),
          column('held', 'Days held'),
          column('term', 'Treatment', 'start'),
          column('gain', 'Unrealised gain'),
          column('rate', 'Rate'),
          column('tax', 'Estimated tax'),
        ],
        rows,
        total: null,
      },
    ],
    notes: [
      rules === null
        ? 'No residence tax rule set is configured, so no tax is estimated.'
        : `Holding periods, rates and exemptions follow the ${rules.country} residence rules in Settings > Tax rules.`,
      'The estimate does not offset losses carried forward; they are listed below with their expiry.',
      'This is an estimate to plan with, not tax advice or a filing.',
    ],
  };
}
