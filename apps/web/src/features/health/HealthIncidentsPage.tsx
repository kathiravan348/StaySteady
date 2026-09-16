// System Health — incident history (UI spec 7.15): every failure, filterable and searchable.

import type { ReactElement } from 'react';

import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import styles from './Health.module.scss';
import { HealthNav } from './sections/HealthNav';
import { IncidentsPanel } from './sections/IncidentsPanel';

export function HealthIncidentsPage(): ReactElement {
  return (
    <PageShell
      title="Incident history"
      description="Failures with their duration, affected components, automatic actions and resolution."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'System health', to: ROUTES.HEALTH_STATUS },
        { label: 'Incidents' },
      ]}
    >
      <div className={styles.page}>
        <HealthNav />
        <IncidentsPanel />
      </div>
    </PageShell>
  );
}
