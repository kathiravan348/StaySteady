// Ownership tab (UI spec 20.1): who owns the company and how that is moving, what insiders have
// done, where it sits in its group, and for a fund, what the fund itself owns. Each part loads and
// fails on its own.

import type { ReactElement } from 'react';

import styles from '../CompanyResearch.module.scss';
import { FundLookThroughSection } from './FundLookThroughSection';
import { GroupStructureSection } from './GroupStructureSection';
import { OwnershipPatternSection } from './OwnershipPatternSection';
import type { CompanySectionProps } from './ProfileSection';

export function OwnershipTab({ instrumentId }: CompanySectionProps): ReactElement {
  return (
    <div className={styles.stack}>
      <FundLookThroughSection instrumentId={instrumentId} />
      <OwnershipPatternSection instrumentId={instrumentId} />
      <GroupStructureSection instrumentId={instrumentId} />
    </div>
  );
}
