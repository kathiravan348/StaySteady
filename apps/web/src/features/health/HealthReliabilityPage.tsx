// System Health — provider and broker reliability (UI spec 7.15).

import type { ReactElement } from 'react';

import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import styles from './Health.module.scss';
import { HealthNav } from './sections/HealthNav';
import { ReliabilityPanel } from './sections/ReliabilityPanel';

export function HealthReliabilityPage(): ReactElement {
  return (
    <PageShell
      title="Provider and broker reliability"
      description="Uptime history, failures and failovers, and usage against limits and budgets."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'System health', to: ROUTES.HEALTH_STATUS },
        { label: 'Reliability' },
      ]}
    >
      <div className={styles.page}>
        <HealthNav />
        <ReliabilityPanel />
      </div>
    </PageShell>
  );
}
