// How much of the traded portfolio each counterparty holds (E-04; requirements 32; decision 44).
// Holdings are summed by broker into their counterparty, converted to the portfolio currency, and
// compared with the saved over-weight share and each protection scheme's cover. Pure.

import { Decimal } from 'decimal.js';

import type { CounterpartiesDto, CounterpartyExposureDto, HoldingDto } from '../../schemas';
import { CounterpartyExposureSchema } from '../../schemas';
import type { FxQuote } from '../../../shared/money';
import { convertMoneyWithTable, createMoney } from '../../../shared/money';
import type { CurrencyCode } from '../../../shared/types/currency';
import { parseGenerated } from './validated';

export interface ExposureInputs {
  readonly holdings: readonly HoldingDto[];
  readonly counterparties: CounterpartiesDto;
  readonly fxTable: readonly FxQuote[];
  readonly currency: CurrencyCode;
}

export function buildCounterpartyExposure(inputs: ExposureInputs): CounterpartyExposureDto {
  const { currency, fxTable } = inputs;
  const toBase = (amount: string, from: CurrencyCode): Decimal =>
    convertMoneyWithTable(createMoney(amount, from), currency, fxTable).amount;
  const valueOf = (holding: HoldingDto): Decimal =>
    toBase(holding.currentValue.amount, holding.currentValue.currency);
  const total = inputs.holdings.reduce(
    (sum, holding) => sum.plus(valueOf(holding)),
    new Decimal(0),
  );
  const { maxSharePercent } = inputs.counterparties;

  const rows = inputs.counterparties.profiles.flatMap((profile) => {
    const held = inputs.holdings.filter((holding) => profile.brokerIds.includes(holding.brokerId));
    if (held.length === 0) return [];
    const value = held.reduce((sum, holding) => sum.plus(valueOf(holding)), new Decimal(0));
    const share = total.isZero() ? new Decimal(0) : value.dividedBy(total).times(100);
    const cover =
      profile.protectionLimit === null
        ? null
        : toBase(profile.protectionLimit.amount, profile.protectionLimit.currency);
    return [
      {
        id: profile.id,
        name: profile.name,
        kind: profile.kind,
        jurisdiction: profile.jurisdiction,
        positions: held.length,
        value: { amount: value.toFixed(2), currency },
        sharePercent: share.toDecimalPlaces(1).toNumber(),
        isOverWeight: share.gt(maxSharePercent),
        protectionScheme: profile.protectionScheme,
        protectionLimit: cover === null ? null : { amount: cover.toFixed(2), currency },
        uncovered:
          cover === null
            ? null
            : { amount: Decimal.max(value.minus(cover), 0).toFixed(2), currency },
        protectionNote: profile.protectionNote,
      },
    ];
  });

  return parseGenerated(
    CounterpartyExposureSchema,
    {
      currency,
      portfolioValue: { amount: total.toFixed(2), currency },
      maxSharePercent,
      rows: rows.sort((a, b) => b.sharePercent - a.sharePercent),
    },
    'counterparty exposure',
  );
}
