// Tax summary report (UI spec 7.16): realised and unrealised gains by holding period with an estimated
// tax, using the market configuration's rates and holding periods. An estimate for an India-resident
// owner, never advice.

import { Decimal } from 'decimal.js';

import type { HoldingDto } from '../../schemas';
import { dividends, marketFor } from './reportCashBuilders';
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
  const rows = v.holdings.flatMap((holding: HoldingDto) => {
    const id = String(holding.instrumentId);
    const instrument = v.instrument(id);
    const price = v.close(id, to);
    const market = marketFor(input, id);
    if (instrument === undefined || price === null) return [];
    return holding.lots
      .filter((lot) => lot.purchaseDate <= to)
      .map((lot) => {
        const held = daysBetween(lot.purchaseDate, to);
        const threshold = market?.tax.longTermThresholdDays ?? null;
        const isLong = threshold !== null && held >= threshold;
        if (threshold !== null && !isLong && threshold - held <= APPROACHING_DAYS) approaching += 1;
        const gain = new Decimal(lot.quantity)
          .times(price.minus(lot.costPerUnit.amount))
          .times(v.fx(instrument.currency, currency, to));
        const rate = isLong
          ? (market?.tax.longTermRatePercent ?? 0)
          : (market?.tax.shortTermRatePercent ?? 0);
        const tax = gain.isPositive() ? gain.times(rate).dividedBy(100) : ZERO;
        if (isLong) longGain = longGain.plus(gain);
        else shortGain = shortGain.plus(gain);
        estimated = estimated.plus(tax);
        return {
          id: lot.id,
          cells: {
            instrument: textCell(instrument.symbol),
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
        `At ${to} prices, using each market’s configured rates. An estimate, not advice.`,
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
      'Rates and holding periods are the assumptions in Settings > Countries & markets for an India-resident owner.',
      'Losses are shown but not offset against gains; carried-forward losses are not tracked yet.',
      'This is an estimate to plan with, not tax advice or a filing.',
    ],
  };
}
