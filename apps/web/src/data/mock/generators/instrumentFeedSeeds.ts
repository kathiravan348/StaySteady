// Filings and announced corporate actions for the research feed (R-11; requirements 38). Filings
// are dated by days before the reference date; announced actions carry the dates the company gave,
// matching the calendar's ex-dates.

import type { AnnouncedActionDto, FilingKind } from '../../schemas/instrument-feed';

export interface FilingSeed {
  readonly daysAgo: number;
  readonly kind: FilingKind;
  readonly title: string;
  readonly summary: string;
  readonly filedWith: string;
}

export interface AnnouncedActionSeed {
  readonly id: string;
  readonly type: AnnouncedActionDto['type'];
  readonly announcedOn: string;
  readonly expectedEffectiveDate: string;
  readonly description: string;
  readonly isConfirmed: boolean;
}

export const FILING_SEEDS: Readonly<Record<string, readonly FilingSeed[]>> = {
  TATAMOTORS: [
    {
      daysAgo: 6,
      kind: 'board_meeting',
      title: 'Intimation of board meeting to approve Q2 results',
      summary: 'Board to meet on 29 September; trading window closed for designated persons.',
      filedWith: 'NSE, BSE',
    },
    {
      daysAgo: 38,
      kind: 'rating_change',
      title: 'Credit rating reaffirmed with a stable outlook',
      summary: 'Long-term rating on the non-convertible debentures reaffirmed.',
      filedWith: 'NSE, BSE',
    },
    {
      daysAgo: 80,
      kind: 'shareholding',
      title: 'Shareholding pattern for the quarter ended 30 June',
      summary: 'Promoter holding unchanged; share of it pledged rose again.',
      filedWith: 'NSE, BSE',
    },
    {
      daysAgo: 120,
      kind: 'results',
      title: 'Audited results for the year ended 31 March',
      summary: 'Consolidated and standalone results with the auditor’s unmodified opinion.',
      filedWith: 'NSE, BSE, NYSE',
    },
    {
      daysAgo: 300,
      kind: 'management_change',
      title: 'Appointment of chief executive',
      summary: 'Shailesh Chandra appointed chief executive with effect from the next quarter.',
      filedWith: 'NSE, BSE',
    },
  ],
  RELIANCE: [
    {
      daysAgo: 25,
      kind: 'management_change',
      title: 'Change in head of the new energy business',
      summary: 'Appointment of a new chief executive for the clean energy division.',
      filedWith: 'NSE, BSE',
    },
    {
      daysAgo: 95,
      kind: 'results',
      title: 'Results for the quarter ended 30 June',
      summary: 'Unaudited consolidated and standalone results.',
      filedWith: 'NSE, BSE',
    },
  ],
  TCS: [
    {
      daysAgo: 70,
      kind: 'auditor_change',
      title: 'Appointment of statutory auditor for a second term',
      summary: 'Shareholders approved the reappointment at the annual general meeting.',
      filedWith: 'NSE, BSE',
    },
  ],
  AAPL: [
    {
      daysAgo: 48,
      kind: 'results',
      title: 'Form 10-Q for the fiscal third quarter',
      summary: 'Quarterly report with condensed consolidated financial statements.',
      filedWith: 'SEC',
    },
    {
      daysAgo: 20,
      kind: 'announcement',
      title: 'Form 4: statement of changes in beneficial ownership',
      summary: 'Sale of shares by an officer under a pre-arranged trading plan.',
      filedWith: 'SEC',
    },
  ],
};

export const ANNOUNCED_ACTION_SEEDS: Readonly<Record<string, readonly AnnouncedActionSeed[]>> = {
  TATAMOTORS: [
    {
      id: 'ann-tatamotors-interim-div',
      type: 'dividend',
      announcedOn: '2026-09-12',
      expectedEffectiveDate: '2026-10-21',
      description:
        'Board to consider an interim dividend at the results meeting; ex-date 21 October if declared.',
      isConfirmed: false,
    },
  ],
  AAPL: [
    {
      id: 'ann-aapl-div-q4',
      type: 'dividend',
      announcedOn: '2026-07-31',
      expectedEffectiveDate: '2026-11-13',
      description:
        'Quarterly cash dividend of $0.27 per share declared with the third-quarter results.',
      isConfirmed: true,
    },
  ],
};
