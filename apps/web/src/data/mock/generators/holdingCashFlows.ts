// Dividend income and currency conversion charges for a mock holding (UI spec 7.3 costs and income).
// Dividends follow the corporate-action calendar: shares held before the effective date times the
// cash paid per share. Buying in a currency other than the USD funding currency incurs a charge.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type { CurrencyCode } from '../../../shared/types/currency';
import type { InstrumentDto, TransactionSchema } from '../../schemas';
import { CANONICAL_CORPORATE_ACTIONS } from './corporateActions';
import { currencyDecimals } from './values';

type TransactionInput = z.input<typeof TransactionSchema>;

export interface CashFlowLot {
  readonly purchaseDate: string;
  readonly quantity: number;
  readonly totalCost: { readonly amount: string };
}

const FUNDING_CURRENCY: CurrencyCode = 'USD';
const CONVERSION_CHARGE_RATE = new Decimal('0.0025');

function dividendTransactions(
  instrument: InstrumentDto,
  holdingId: string,
  lots: readonly CashFlowLot[],
  referenceDate: string,
): TransactionInput[] {
  return CANONICAL_CORPORATE_ACTIONS.flatMap((action) => {
    const cash = action.cashAmount;
    if (
      action.instrumentId !== instrument.id ||
      action.type !== 'dividend' ||
      cash === undefined ||
      action.effectiveDate > referenceDate
    ) {
      return [];
    }
    const held = lots
      .filter((lot) => lot.purchaseDate < action.effectiveDate)
      .reduce((sum, lot) => sum.plus(lot.quantity), new Decimal(0));
    if (held.isZero()) {
      return [];
    }
    const decimals = currencyDecimals(cash.currency);
    const perShare = new Decimal(cash.amount);
    return [
      {
        id: `tx-${holdingId}-div-${action.effectiveDate}`,
        instrumentId: instrument.id,
        type: 'dividend',
        timestamp: `${action.effectiveDate}T12:00:00Z`,
        quantity: held.toNumber(),
        unitPrice: { amount: perShare.toFixed(), currency: cash.currency },
        fees: { amount: new Decimal(0).toFixed(decimals), currency: cash.currency },
        netAmount: {
          amount: held.times(perShare).toFixed(decimals),
          currency: cash.currency,
        },
        notes: action.description,
      },
    ];
  });
}

function conversionCharges(
  instrument: InstrumentDto,
  holdingId: string,
  lots: readonly CashFlowLot[],
): TransactionInput[] {
  const { currency } = instrument;
  if (currency === FUNDING_CURRENCY) {
    return [];
  }
  const decimals = currencyDecimals(currency);
  return lots.map((lot, index) => ({
    id: `tx-${holdingId}-fx-${index + 1}`,
    instrumentId: instrument.id,
    type: 'fee',
    timestamp: `${lot.purchaseDate}T14:30:00Z`,
    fees: { amount: new Decimal(0).toFixed(decimals), currency },
    netAmount: {
      amount: new Decimal(lot.totalCost.amount).times(CONVERSION_CHARGE_RATE).toFixed(decimals),
      currency,
    },
    notes: `Currency conversion charge ${FUNDING_CURRENCY} to ${currency} (0.25%)`,
  }));
}

export function holdingCashFlows(
  instrument: InstrumentDto,
  holdingId: string,
  lots: readonly CashFlowLot[],
  referenceDate: string,
): TransactionInput[] {
  return [
    ...dividendTransactions(instrument, holdingId, lots, referenceDate),
    ...conversionCharges(instrument, holdingId, lots),
  ];
}
