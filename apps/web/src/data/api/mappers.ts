// DTO to domain mapping shared by screens: parse at the boundary, compute with decimal.js (standards 6.4).

import { Decimal } from 'decimal.js';

import type { FxQuote, Money } from '../../shared/money';
import { createMoney } from '../../shared/money';
import type { FxRateDto, MoneyDto } from '../schemas';

export function moneyFromDto(dto: MoneyDto): Money {
  return createMoney(dto.amount, dto.currency);
}

export function fxTableFromDtos(rates: readonly FxRateDto[]): readonly FxQuote[] {
  return rates.map((rate) => ({ from: rate.from, to: rate.to, rate: new Decimal(rate.rate) }));
}
