// Canonical broker and platform accounts (requirements 8). Summary data for portfolio screens.

import type { z } from 'zod';

import type { BrokerDto } from '../../schemas';
import { BrokerSchema } from '../../schemas';
import { parseGeneratedList } from './validated';

const CANONICAL_BROKERS_RAW: readonly z.input<typeof BrokerSchema>[] = [
  {
    id: 'brk-ibkr',
    name: 'Interactive Brokers',
    country: 'USA',
    marketIds: ['US', 'UK', 'JP', 'SG'],
    accountCurrency: 'USD',
    supportsAutomation: true,
  },
  {
    id: 'brk-zerodha',
    name: 'Zerodha',
    country: 'India',
    marketIds: ['IN'],
    accountCurrency: 'INR',
    supportsAutomation: true,
  },
  {
    id: 'brk-hl',
    name: 'Hargreaves Lansdown',
    country: 'UK',
    marketIds: ['UK'],
    accountCurrency: 'GBP',
    supportsAutomation: false,
  },
  {
    id: 'brk-private-notes',
    name: 'Private Placement Agent',
    country: 'USA',
    marketIds: ['US'],
    accountCurrency: 'USD',
    supportsAutomation: false,
  },
];

export const CANONICAL_BROKERS: readonly BrokerDto[] = parseGeneratedList(
  BrokerSchema,
  CANONICAL_BROKERS_RAW,
  'brokers',
);

export function getCanonicalBrokers(): readonly BrokerDto[] {
  return CANONICAL_BROKERS;
}
