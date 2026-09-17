// System Health — live status (UI spec 7.15): what is broken right now, data freshness and alert
// channel tests. Each panel loads and fails on its own, so the page stays useful during outages.

import type { ReactElement } from 'react';

import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import styles from './Health.module.scss';
import { AlertChannelsPanel } from './sections/AlertChannelsPanel';
import { DepositoryReconciliationSection } from './sections/DepositoryReconciliationSection';
import { FreshnessPanel } from './sections/FreshnessPanel';
import { HealthNav } from './sections/HealthNav';
import { StatusBoard } from './sections/StatusBoard';

export function HealthStatusPage(): ReactElement {
  return (
    <PageShell
      title="System health"
      description="What is working, what is not, and how fresh the data is."
      breadcrumbs={[{ label: 'Overview', to: ROUTES.OVERVIEW }, { label: 'System health' }]}
    >
      <div className={styles.page}>
        <HealthNav />
        <StatusBoard />
        <DepositoryReconciliationSection />
        <div className={styles.twoColumn}>
          <FreshnessPanel />
          <AlertChannelsPanel />
        </div>
      </div>
    </PageShell>
  );
}
