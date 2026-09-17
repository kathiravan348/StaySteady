// Counterparties holding assets for the owner (M-17; requirements 32; UI spec 19.4). Linked to the
// canonical brokers and to the institutions in the manual asset register. With the seeded holdings,
// Interactive Brokers holds more than the over-weight share of net worth. Protection limits are mock
// figures summarising public schemes, not advice.

import type { z } from 'zod';

import type { CounterpartiesDto } from '../../schemas/counterparties';
import { CounterpartiesSchema } from '../../schemas/counterparties';
import { EMPLOYER } from './netWorthAssets';
import { parseGenerated } from './validated';

export const COUNTERPARTY_MAX_SHARE_PERCENT = 25;

type ProfileInput = z.input<typeof CounterpartiesSchema>['profiles'][number];

const PROFILES: readonly ProfileInput[] = [
  {
    id: 'cp-ibkr',
    name: 'Interactive Brokers LLC',
    kind: 'broker',
    jurisdiction: 'US',
    brokerIds: ['brk-ibkr'],
    institutionNames: [],
    protectionScheme: 'SIPC',
    protectionLimit: { amount: '500000.00', currency: 'USD' },
    protectionNote:
      'Covers missing securities and cash if the broker fails, cash within 250,000 USD.',
  },
  {
    id: 'cp-zerodha',
    name: 'Zerodha Broking Ltd',
    kind: 'broker',
    jurisdiction: 'IN',
    brokerIds: ['brk-zerodha'],
    institutionNames: [],
    protectionScheme: 'Exchange investor protection fund',
    protectionLimit: null,
    protectionNote: 'Shares sit in the owner’s own CDSL demat account, not on the broker’s books.',
  },
  {
    id: 'cp-hl',
    name: 'Hargreaves Lansdown',
    kind: 'broker',
    jurisdiction: 'GB',
    brokerIds: ['brk-hl'],
    institutionNames: [],
    protectionScheme: 'FSCS',
    protectionLimit: { amount: '85000.00', currency: 'GBP' },
    protectionNote: 'Covers a shortfall in client assets if the platform fails.',
  },
  {
    id: 'cp-private-notes',
    name: 'Private Placement Agent',
    kind: 'broker',
    jurisdiction: 'US',
    brokerIds: ['brk-private-notes'],
    institutionNames: [],
    protectionScheme: null,
    protectionLimit: null,
    protectionNote: 'No scheme applies; the unlisted note is a direct exposure to its issuer.',
  },
  {
    id: 'cp-hdfc-bank',
    name: 'HDFC Bank',
    kind: 'bank',
    jurisdiction: 'IN',
    brokerIds: [],
    institutionNames: ['HDFC Bank'],
    protectionScheme: 'DICGC',
    protectionLimit: { amount: '500000.00', currency: 'INR' },
    protectionNote: 'Deposit insurance per depositor per bank, principal and interest together.',
  },
  {
    id: 'cp-icici-bank',
    name: 'ICICI Bank',
    kind: 'bank',
    jurisdiction: 'IN',
    brokerIds: [],
    institutionNames: ['ICICI Bank'],
    protectionScheme: 'DICGC',
    protectionLimit: { amount: '500000.00', currency: 'INR' },
    protectionNote: 'Deposit insurance per depositor per bank, principal and interest together.',
  },
  {
    id: 'cp-sbi',
    name: 'State Bank of India',
    kind: 'bank',
    jurisdiction: 'IN',
    brokerIds: [],
    institutionNames: ['State Bank of India'],
    protectionScheme: 'Government of India (Public Provident Fund)',
    protectionLimit: null,
    protectionNote: 'The bank only administers the account; the balance is a government liability.',
  },
  {
    id: 'cp-epfo',
    name: 'Employees’ Provident Fund Organisation',
    kind: 'government',
    jurisdiction: 'IN',
    brokerIds: [],
    institutionNames: ['EPFO'],
    protectionScheme: 'Statutory fund',
    protectionLimit: null,
    protectionNote:
      'Statutory body; withdrawal is restricted until retirement or a permitted event.',
  },
  {
    id: 'cp-rbi',
    name: 'Reserve Bank of India',
    kind: 'government',
    jurisdiction: 'IN',
    brokerIds: [],
    institutionNames: ['Reserve Bank of India'],
    protectionScheme: 'Sovereign',
    protectionLimit: null,
    protectionNote: 'Sovereign Gold Bonds are issued on behalf of the Government of India.',
  },
  {
    id: 'cp-lic',
    name: 'Life Insurance Corporation of India',
    kind: 'insurer',
    jurisdiction: 'IN',
    brokerIds: [],
    institutionNames: ['LIC'],
    protectionScheme: 'Sovereign guarantee (LIC Act, s. 37)',
    protectionLimit: null,
    protectionNote: 'Policy sums are guaranteed by the central government.',
  },
  {
    id: 'cp-northwind-plan',
    name: `${EMPLOYER} equity plan`,
    kind: 'employer_plan',
    jurisdiction: 'IN',
    brokerIds: [],
    institutionNames: [`${EMPLOYER} equity plan`],
    protectionScheme: null,
    protectionLimit: null,
    protectionNote: 'Value depends on one employer; unvested units lapse on leaving.',
  },
];

export function generateCounterparties(): CounterpartiesDto {
  return parseGenerated(
    CounterpartiesSchema,
    { maxSharePercent: COUNTERPARTY_MAX_SHARE_PERCENT, profiles: [...PROFILES] },
    'counterparties',
  );
}
