// Position edits made on the Position Detail screen (UI spec 7.3 actions). Mock phase: there is no
// write API yet, so edits are validated here and kept in the browser session only. Pure.

import { Decimal } from 'decimal.js';
import { z } from 'zod';

import type { Money } from '../../../../shared/money';

const DECIMAL = /^\d+(\.\d+)?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const MANUAL_TRANSACTION_TYPES = ['buy', 'sell', 'dividend', 'fee'] as const;
export type ManualTransactionType = (typeof MANUAL_TRANSACTION_TYPES)[number];

const DecimalInputSchema = z.string().regex(DECIMAL);

export const ManualTransactionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(MANUAL_TRANSACTION_TYPES),
  date: z.string().regex(ISO_DATE),
  quantity: DecimalInputSchema,
  unitPrice: DecimalInputSchema,
  fees: DecimalInputSchema,
  notes: z.string(),
});
export type ManualTransaction = z.infer<typeof ManualTransactionSchema>;

export const PositionNoteSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  createdAt: z.string().min(1),
});
export type PositionNote = z.infer<typeof PositionNoteSchema>;

export const PositionEditsSchema = z.object({
  exitLevel: DecimalInputSchema.nullable(),
  notes: z.array(PositionNoteSchema),
  manualTransactions: z.array(ManualTransactionSchema),
  closeRequestedAt: z.string().nullable(),
});
export type PositionEdits = z.infer<typeof PositionEditsSchema>;

export const EMPTY_POSITION_EDITS: PositionEdits = {
  exitLevel: null,
  notes: [],
  manualTransactions: [],
  closeRequestedAt: null,
};

export interface ManualTransactionDraft {
  readonly type: ManualTransactionType;
  readonly date: string;
  readonly quantity: string;
  readonly unitPrice: string;
  readonly fees: string;
  readonly notes: string;
}

export type DraftErrors = Partial<Record<'date' | 'quantity' | 'unitPrice' | 'fees', string>>;

export const isTradeType = (type: ManualTransactionType): boolean =>
  type === 'buy' || type === 'sell';

function isPositiveDecimal(value: string): boolean {
  const trimmed = value.trim();
  return DECIMAL.test(trimmed) && new Decimal(trimmed).greaterThan(0);
}

export function validateManualTransaction(
  draft: ManualTransactionDraft,
  today: string,
): DraftErrors {
  const errors: DraftErrors = {};
  const trade = isTradeType(draft.type);
  if (!ISO_DATE.test(draft.date)) {
    errors.date = 'Enter the date of the transaction';
  } else if (draft.date > today) {
    errors.date = 'The date cannot be in the future';
  }
  if (trade && !isPositiveDecimal(draft.quantity)) {
    errors.quantity = 'Enter a quantity above zero';
  }
  if (!isPositiveDecimal(draft.unitPrice)) {
    errors.unitPrice = trade ? 'Enter a price above zero' : 'Enter an amount above zero';
  }
  if (!DECIMAL.test(draft.fees.trim())) {
    errors.fees = 'Enter fees as a number, or 0';
  }
  return errors;
}

export function draftToManualTransaction(
  draft: ManualTransactionDraft,
  id: string,
): ManualTransaction {
  return {
    id,
    type: draft.type,
    date: draft.date,
    quantity: isTradeType(draft.type) ? draft.quantity.trim() : '0',
    unitPrice: draft.unitPrice.trim(),
    fees: draft.fees.trim(),
    notes: draft.notes.trim(),
  };
}

// A protective exit for a long position must sit below the current price, or it triggers at once.
export function validateExitLevel(value: string, lastPrice: Money): string | null {
  const trimmed = value.trim();
  if (!DECIMAL.test(trimmed)) {
    return 'Enter a price such as 150.25';
  }
  const level = new Decimal(trimmed);
  if (level.lessThanOrEqualTo(0)) {
    return 'The exit level must be above zero';
  }
  if (level.greaterThanOrEqualTo(lastPrice.amount)) {
    return `The exit level must be below the current price (${lastPrice.amount.toFixed()} ${lastPrice.currency})`;
  }
  return null;
}
