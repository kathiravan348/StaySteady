// Seed data for Compliance (requirements 27; UI spec 19.1, 19.3, 19.4).
// Includes restricted instruments, active and upcoming blackout windows, holding locks,
// refusals at signal stage, and personal disclosure obligations.

import type {
  BlackoutWindow,
  DisclosureObligation,
  HoldingPeriodLock,
  RefusalRecord,
  RestrictedInstrument,
} from '../../schemas/compliance';
import { toIsoUtcTimestamp } from '../../../shared/types/dateTime';
import { addDays } from './reportValuation';

export function seedRestrictedInstruments(today: string): readonly RestrictedInstrument[] {
  return [
    {
      id: 'res-nvda',
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      assetClass: 'EQUITY',
      jurisdiction: 'US',
      reasonCategory: 'MNPI_EXPOSURE',
      policyClause: 'Global Ethics & Anti-Insider Trading Policy §4.2',
      effectiveFrom: toIsoUtcTimestamp(`${addDays(today, -120)}T00:00:00.000Z`),
      reviewDueDate: toIsoUtcTimestamp(`${addDays(today, 60)}T00:00:00.000Z`),
      isReviewOverdue: false,
      notes: 'Active advisory mandate on corporate infrastructure financing; confidential list.',
      addedBy: 'Compliance Oversight Committee',
    },
    {
      id: 'res-northwind',
      symbol: 'NORTHWIND',
      name: 'Northwind Systems Inc.',
      assetClass: 'ALL',
      jurisdiction: 'US',
      reasonCategory: 'EMPLOYER_EQUITY',
      policyClause: 'Staff Personal Account Dealing Rules §2.1',
      effectiveFrom: toIsoUtcTimestamp(`${addDays(today, -365)}T00:00:00.000Z`),
      reviewDueDate: toIsoUtcTimestamp(`${addDays(today, 180)}T00:00:00.000Z`),
      isReviewOverdue: false,
      notes:
        'Primary employer equity; all open-market dealing strictly prohibited outside open windows.',
      addedBy: 'Personal Trading Portal (Auto-sync)',
    },
    {
      id: 'res-infy',
      symbol: 'INFY',
      name: 'Infosys Limited',
      assetClass: 'EQUITY',
      jurisdiction: 'IN',
      reasonCategory: 'AUDIT_CLIENT',
      policyClause: 'Independence & Conflict of Interest Manual §5.4',
      effectiveFrom: toIsoUtcTimestamp(`${addDays(today, -200)}T00:00:00.000Z`),
      reviewDueDate: toIsoUtcTimestamp(`${addDays(today, 30)}T00:00:00.000Z`),
      isReviewOverdue: false,
      notes: 'Statutory audit client of affiliate accounting partnership.',
      addedBy: 'Regional Compliance Office (IN)',
    },
    {
      id: 'res-tsla',
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      assetClass: 'DERIVATIVE',
      jurisdiction: 'US',
      reasonCategory: 'SHORT_SWING_RULE',
      policyClause: 'Senior Associate Securities Policy §3.8',
      effectiveFrom: toIsoUtcTimestamp(`${addDays(today, -90)}T00:00:00.000Z`),
      reviewDueDate: toIsoUtcTimestamp(`${addDays(today, 90)}T00:00:00.000Z`),
      isReviewOverdue: false,
      notes: 'Prohibition on leveraged options and short-swing derivative positioning.',
      addedBy: 'Risk & Safety Governance',
    },
    {
      id: 'res-ba',
      symbol: 'BA',
      name: 'The Boeing Company',
      assetClass: 'EQUITY',
      jurisdiction: 'US',
      reasonCategory: 'REGULATORY_SANCTION',
      policyClause: 'Cross-Border Securities Policy §7.1',
      // Deliberately past its review date per UI spec 19.3
      effectiveFrom: toIsoUtcTimestamp(`${addDays(today, -420)}T00:00:00.000Z`),
      reviewDueDate: toIsoUtcTimestamp(`${addDays(today, -15)}T00:00:00.000Z`),
      isReviewOverdue: true,
      notes: 'Defense export compliance oversight quiet mandate. Overdue for annual review.',
      addedBy: 'Legal Counsel',
    },
  ];
}

export function seedBlackoutWindows(today: string): readonly BlackoutWindow[] {
  return [
    {
      id: 'bo-q3-earnings',
      name: 'Q3 FY26 Corporate Earnings Blackout Window',
      scope: 'Employer & Affiliate Securities (Northwind)',
      windowType: 'QUARTERLY_EARNINGS',
      startDate: toIsoUtcTimestamp(`${addDays(today, -14)}T00:00:00.000Z`),
      endDate: toIsoUtcTimestamp(`${addDays(today, 12)}T00:00:00.000Z`),
      status: 'ACTIVE',
      daysRemaining: 12,
      preClearanceRequired: true,
      policyReference: 'Staff Personal Account Dealing Rules §3.1',
      notes:
        'Mandatory pre-quarterly earnings quiet period; zero trading allowed without pre-clearance.',
    },
    {
      id: 'bo-project-titan',
      name: 'Project Titan M&A Advisory Quiet Period',
      scope: 'Enterprise Cloud Software Sector (Select Basket)',
      windowType: 'MA_TRANSACTION',
      startDate: toIsoUtcTimestamp(`${addDays(today, -5)}T00:00:00.000Z`),
      endDate: toIsoUtcTimestamp(`${addDays(today, 9)}T00:00:00.000Z`),
      status: 'ACTIVE',
      daysRemaining: 9,
      preClearanceRequired: true,
      policyReference: 'M&A Advisory Conflict Protocols §1.3',
      notes:
        'Transactions in cloud infrastructure and enterprise software require prior ethics approval.',
    },
    {
      id: 'bo-q4-quiet',
      name: 'Q4 FY26 Pre-Close Annual Blackout',
      scope: 'All Global Equities & Listed Options',
      windowType: 'QUARTERLY_EARNINGS',
      startDate: toIsoUtcTimestamp(`${addDays(today, 45)}T00:00:00.000Z`),
      endDate: toIsoUtcTimestamp(`${addDays(today, 75)}T00:00:00.000Z`),
      status: 'UPCOMING',
      daysRemaining: 45,
      preClearanceRequired: true,
      policyReference: 'Code of Conduct & Trading Guidelines §8.1',
      notes: 'Scheduled year-end blackout window covering major public market securities.',
    },
  ];
}

export function seedHoldingLocks(today: string): readonly HoldingPeriodLock[] {
  return [
    {
      id: 'lock-aapl',
      symbol: 'AAPL',
      instrumentName: 'Apple Inc.',
      lotId: 'lot-aapl-20260905',
      acquisitionDate: toIsoUtcTimestamp(`${addDays(today, -12)}T00:00:00.000Z`),
      quantity: 50,
      minimumHoldingDays: 30,
      unlockDate: toIsoUtcTimestamp(`${addDays(today, 18)}T00:00:00.000Z`),
      daysRemaining: 18,
      ruleReference: 'Staff 30-day minimum holding rule §6.1',
    },
    {
      id: 'lock-msft',
      symbol: 'MSFT',
      instrumentName: 'Microsoft Corporation',
      lotId: 'lot-msft-20260825',
      acquisitionDate: toIsoUtcTimestamp(`${addDays(today, -22)}T00:00:00.000Z`),
      quantity: 30,
      minimumHoldingDays: 30,
      unlockDate: toIsoUtcTimestamp(`${addDays(today, 8)}T00:00:00.000Z`),
      daysRemaining: 8,
      ruleReference: 'Staff 30-day minimum holding rule §6.1',
    },
    {
      id: 'lock-reliance',
      symbol: 'RELIANCE',
      instrumentName: 'Reliance Industries Limited',
      lotId: 'lot-rel-20260701',
      acquisitionDate: toIsoUtcTimestamp(`${addDays(today, -75)}T00:00:00.000Z`),
      quantity: 100,
      minimumHoldingDays: 90,
      unlockDate: toIsoUtcTimestamp(`${addDays(today, 15)}T00:00:00.000Z`),
      daysRemaining: 15,
      ruleReference: 'Core long-term holding commitment §6.3',
    },
  ];
}

export function seedRefusals(today: string): readonly RefusalRecord[] {
  return [
    {
      id: 'ref-01',
      timestamp: toIsoUtcTimestamp(`${addDays(today, -2)}T14:32:00.000Z`),
      symbol: 'NVDA',
      instrumentName: 'NVIDIA Corporation',
      action: 'BUY',
      source: 'AUTOMATED_SIGNAL',
      strategyName: 'Dual Moving Average Momentum',
      ruleViolated: 'Restricted List Policy §4.2',
      policyClause: 'Global Ethics & Anti-Insider Trading Policy §4.2',
      refusalReason:
        'Refused at signal stage: Instrument NVDA is on the permanent employer restricted list. Order prevented from reaching broker.',
      stage: 'SIGNAL_STAGE',
    },
    {
      id: 'ref-02',
      timestamp: toIsoUtcTimestamp(`${addDays(today, -6)}T10:15:00.000Z`),
      symbol: 'NORTHWIND',
      instrumentName: 'Northwind Systems Inc.',
      action: 'SELL',
      source: 'MANUAL_TRADE',
      strategyName: null,
      ruleViolated: 'Active Blackout Window §3.1',
      policyClause: 'Staff Personal Account Dealing Rules §2.1',
      refusalReason:
        'Refused at signal stage: Active Q3 Earnings Blackout Window prohibits all open-market transactions without written pre-clearance.',
      stage: 'SIGNAL_STAGE',
    },
    {
      id: 'ref-03',
      timestamp: toIsoUtcTimestamp(`${addDays(today, -10)}T16:45:00.000Z`),
      symbol: 'AAPL',
      instrumentName: 'Apple Inc.',
      action: 'SELL',
      source: 'MANUAL_TRADE',
      strategyName: null,
      ruleViolated: 'Minimum Holding Period Lock §6.1',
      policyClause: 'Staff 30-day minimum holding rule §6.1',
      refusalReason:
        'Refused at signal stage: 50 shares of AAPL acquired within past 30 days are locked until holding period expires (18 days remaining).',
      stage: 'SIGNAL_STAGE',
    },
    {
      id: 'ref-04',
      timestamp: toIsoUtcTimestamp(`${addDays(today, -14)}T11:20:00.000Z`),
      symbol: 'TSLA',
      instrumentName: 'Tesla, Inc.',
      action: 'BUY',
      source: 'LIMIT_OVERRIDE',
      strategyName: 'RSI Oversold Mean Reversion',
      ruleViolated: 'Derivatives & Short-Swing Speculation §3.8',
      policyClause: 'Senior Associate Securities Policy §3.8',
      refusalReason:
        'Refused at signal stage: Derivative options and speculative short-term positioning on TSLA prohibited by employer policy.',
      stage: 'SIGNAL_STAGE',
    },
  ];
}

export function seedDisclosures(today: string): readonly DisclosureObligation[] {
  return [
    {
      id: 'disc-q3',
      title: 'Q3 FY26 Personal Securities Transaction Report',
      frequency: 'QUARTERLY',
      nextDeadline: toIsoUtcTimestamp(`${addDays(today, 28)}T00:00:00.000Z`),
      daysUntilDeadline: 28,
      status: 'PENDING',
      jurisdiction: 'US',
      recipient: 'Corporate Compliance Office',
    },
    {
      id: 'disc-annual',
      title: 'Annual Declaration of Outside Business Interests & Family Accounts',
      frequency: 'ANNUAL',
      nextDeadline: toIsoUtcTimestamp(`${addDays(today, 75)}T00:00:00.000Z`),
      daysUntilDeadline: 75,
      status: 'PENDING',
      jurisdiction: 'Global',
      recipient: 'Global Ethics & Legal Committee',
    },
    {
      id: 'disc-q2',
      title: 'Q2 FY26 Confirmatory Brokerage Trade Disclosure',
      frequency: 'QUARTERLY',
      nextDeadline: toIsoUtcTimestamp(`${addDays(today, -62)}T00:00:00.000Z`),
      daysUntilDeadline: -62,
      status: 'SUBMITTED',
      jurisdiction: 'US',
      recipient: 'Personal Trading Oversight System',
    },
  ];
}
