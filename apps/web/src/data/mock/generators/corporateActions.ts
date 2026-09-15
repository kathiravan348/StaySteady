// Corporate actions generator for splits, dividends, and bonus issues (M-06).
// Fulfills UI Spec 15 requirement for corporate action testing.

import type { z } from 'zod';
import type { CorporateActionDto } from '../../schemas';
import { CorporateActionSchema } from '../../schemas';
import { parseGeneratedList } from './validated';
import { toInstrumentId } from '../../../shared/types/identifiers';

export const CANONICAL_CORPORATE_ACTIONS_RAW: readonly z.input<typeof CorporateActionSchema>[] = [
  {
    id: 'corp-us-aapl-split-4-1',
    instrumentId: toInstrumentId('inst-us-aapl'),
    type: 'split',
    effectiveDate: '2022-08-28',
    ratio: '4:1',
    description: '4-for-1 stock split distributed to shareholders of record.',
  },
  {
    id: 'corp-us-tsla-split-3-1',
    instrumentId: toInstrumentId('inst-us-tsla'),
    type: 'split',
    effectiveDate: '2023-08-25',
    ratio: '3:1',
    description: '3-for-1 stock split to make stock ownership more accessible.',
  },
  {
    id: 'corp-us-aapl-div-2025q1',
    instrumentId: toInstrumentId('inst-us-aapl'),
    type: 'dividend',
    effectiveDate: '2025-02-14',
    cashAmount: { amount: '0.25', currency: 'USD' },
    description: 'Quarterly cash dividend of $0.25 per share.',
  },
  {
    id: 'corp-us-aapl-div-2025q2',
    instrumentId: toInstrumentId('inst-us-aapl'),
    type: 'dividend',
    effectiveDate: '2025-05-16',
    cashAmount: { amount: '0.26', currency: 'USD' },
    description: 'Quarterly cash dividend of $0.26 per share.',
  },
  {
    id: 'corp-us-spy-div-2025q1',
    instrumentId: toInstrumentId('inst-us-spy'),
    type: 'dividend',
    effectiveDate: '2025-03-21',
    cashAmount: { amount: '1.78', currency: 'USD' },
    description: 'SPDR S&P 500 quarterly distribution dividend.',
  },
  {
    id: 'corp-uk-azn-div-2025',
    instrumentId: toInstrumentId('inst-uk-azn'),
    type: 'dividend',
    effectiveDate: '2025-03-28',
    cashAmount: { amount: '0.95', currency: 'GBP' },
    description: 'AstraZeneca second interim dividend for year 2024.',
  },
  {
    id: 'corp-in-reliance-bonus',
    instrumentId: toInstrumentId('inst-in-reliance'),
    type: 'bonus_issue',
    effectiveDate: '2024-10-28',
    ratio: '1:1',
    description: '1:1 bonus share issue on equity shares.',
  },
  {
    id: 'corp-in-reliance-div',
    instrumentId: toInstrumentId('inst-in-reliance'),
    type: 'dividend',
    effectiveDate: '2025-08-19',
    cashAmount: { amount: '10.00', currency: 'INR' },
    description: 'Annual dividend of Rs 10.00 per share.',
  },
  {
    id: 'corp-jp-7203-div',
    instrumentId: toInstrumentId('inst-jp-7203'),
    type: 'dividend',
    effectiveDate: '2025-03-31',
    cashAmount: { amount: '45', currency: 'JPY' },
    description: 'Toyota Motor fiscal year-end dividend per share.',
  },
];

export const CANONICAL_CORPORATE_ACTIONS: readonly CorporateActionDto[] = parseGeneratedList(
  CorporateActionSchema,
  CANONICAL_CORPORATE_ACTIONS_RAW,
  'corporateActions',
);

export function getCanonicalCorporateActions(): readonly CorporateActionDto[] {
  return CANONICAL_CORPORATE_ACTIONS;
}

export function getCorporateActionsForInstrument(
  instrumentId: string,
): readonly CorporateActionDto[] {
  return CANONICAL_CORPORATE_ACTIONS.filter((act) => act.instrumentId === instrumentId);
}
