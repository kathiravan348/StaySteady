// Seeded records for continuity, succession, nominee, and emergency access (requirements 28; UI spec 19.1, 19.3).
// Contains realistic institutions, recovery custody points without credentials, and access playbooks
// with deliberately overdue review items per spec 19.3.

import type {
  EmergencyAccessPlaybookDto,
  InstitutionAccountDto,
  RecoveryLocationDto,
} from '../../schemas/continuity';
import { toIsoUtcTimestamp } from '../../../shared/types/dateTime';
import { addDays } from './reportValuation';

export function seedInstitutions(today: string): readonly InstitutionAccountDto[] {
  return [
    {
      id: 'inst-ibkr',
      name: 'Interactive Brokers LLC',
      accountReference: 'U***9421',
      type: 'broker',
      jurisdiction: 'US',
      nomineeStatus: 'registered',
      nomineeNames: ['Ananya (Spouse) — 100% beneficiary (Transfer on Death)'],
      lastConfirmedDate: toIsoUtcTimestamp(`${addDays(today, -45)}T00:00:00.000Z`),
      reviewPeriodDays: 365,
      isOverdue: false,
      daysSinceConfirmation: 45,
    },
    {
      id: 'inst-zerodha',
      name: 'Zerodha Broking Ltd',
      accountReference: '1208***000412',
      type: 'broker',
      jurisdiction: 'IN',
      nomineeStatus: 'registered',
      nomineeNames: ['Ananya (Spouse) — 100% nominee'],
      // Deliberately past its 365-day review period per UI spec 19.3 (410 days ago).
      lastConfirmedDate: toIsoUtcTimestamp(`${addDays(today, -410)}T00:00:00.000Z`),
      reviewPeriodDays: 365,
      isOverdue: true,
      daysSinceConfirmation: 410,
    },
    {
      id: 'inst-cdsl',
      name: 'Central Depository Services India (CDSL)',
      accountReference: '12081600***9821',
      type: 'depository',
      jurisdiction: 'IN',
      nomineeStatus: 'registered',
      nomineeNames: ['Ananya (Spouse) — 100% registered nominee'],
      lastConfirmedDate: toIsoUtcTimestamp(`${addDays(today, -180)}T00:00:00.000Z`),
      reviewPeriodDays: 365,
      isOverdue: false,
      daysSinceConfirmation: 180,
    },
    {
      id: 'inst-hdfc',
      name: 'HDFC Bank Ltd',
      accountReference: '50100***1284',
      type: 'bank',
      jurisdiction: 'IN',
      nomineeStatus: 'registered',
      nomineeNames: ['Ananya (Spouse) — Registered nominee'],
      lastConfirmedDate: toIsoUtcTimestamp(`${addDays(today, -120)}T00:00:00.000Z`),
      reviewPeriodDays: 365,
      isOverdue: false,
      daysSinceConfirmation: 120,
    },
    {
      id: 'inst-chase',
      name: 'JPMorgan Chase Bank NA',
      accountReference: '9821***4410',
      type: 'bank',
      jurisdiction: 'US',
      nomineeStatus: 'registered',
      nomineeNames: ['Ananya (Spouse) — Payable on Death (POD)'],
      lastConfirmedDate: toIsoUtcTimestamp(`${addDays(today, -210)}T00:00:00.000Z`),
      reviewPeriodDays: 365,
      isOverdue: false,
      daysSinceConfirmation: 210,
    },
  ];
}

export function seedRecoveryLocations(today: string): readonly RecoveryLocationDto[] {
  return [
    {
      id: 'rec-safe',
      title: 'Physical Master Recovery Safe',
      storageDescription:
        'Fireproof biometric safe in study containing sealed envelope marked “In Case of Emergency — Nominee Instructions” with hardware authentication key, cold paper seed, and institution register.',
      custodyMethod: 'Physical biometric & dual-key access',
      lastAuditedDate: toIsoUtcTimestamp(`${addDays(today, -60)}T00:00:00.000Z`),
      auditPeriodDays: 180,
      isOverdue: false,
      daysSinceAudit: 60,
    },
    {
      id: 'rec-vault',
      title: '1Password Family Emergency Kit',
      storageDescription:
        'Encrypted recovery kit PDF stored in external bank locker; emergency contact access delegation enabled for designated nominee email with 48-hour challenge period.',
      custodyMethod: 'Digital emergency delegation with challenge timeout',
      // Deliberately past its 180-day audit period per UI spec 19.3 (215 days ago).
      lastAuditedDate: toIsoUtcTimestamp(`${addDays(today, -215)}T00:00:00.000Z`),
      auditPeriodDays: 180,
      isOverdue: true,
      daysSinceAudit: 215,
    },
    {
      id: 'rec-solicitor',
      title: 'Legal Counsel & Testamentary Memorandum',
      storageDescription:
        'Sealed Digital Assets Memorandum deposited with estate solicitor (M/s Chambers & Partners), detailing executor duties and non-credential access roadmap.',
      custodyMethod: 'Professional legal custody',
      lastAuditedDate: toIsoUtcTimestamp(`${addDays(today, -90)}T00:00:00.000Z`),
      auditPeriodDays: 365,
      isOverdue: false,
      daysSinceAudit: 90,
    },
  ];
}

export function seedEmergencyPlaybook(today: string): EmergencyAccessPlaybookDto {
  const lastTest = addDays(today, -140);
  return {
    nominatedPerson: 'Ananya (Spouse)',
    accessScope:
      'Read-Only inspection of all accounts, holdings, and asset registers. Trading and execution capabilities are strictly locked and cannot be triggered.',
    stepByStepInstructions: [
      'Locate the sealed envelope in the study fireproof safe or trigger the 1Password emergency delegation workflow.',
      'Log into the workstation with the designated offline emergency key profile.',
      'Open StaySteady in Emergency Read-Only mode to inspect current institution balances and download the complete asset pack.',
      'Notify the respective institution contacts listed in the Institution Register using the cited account references.',
      'Review automation pause status: all trading pauses automatically once the inactivity threshold expires.',
    ],
    lastTestDate: toIsoUtcTimestamp(`${lastTest}T00:00:00.000Z`),
    testIntervalDays: 180,
    isOverdue: false,
    daysSinceLastTest: 140,
    drillHistory: [
      {
        id: 'drill-1',
        drillDate: toIsoUtcTimestamp(`${lastTest}T14:30:00.000Z`),
        testedBy: 'Self with Nominee (Ananya)',
        routeTested: 'Offline emergency access playbook and institution contact verification',
        outcome: 'passed',
        notes:
          'Verified nominee could access read-only workstation, open the asset pack, and view institution account numbers without credentials.',
      },
    ],
  };
}
