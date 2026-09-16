// Reports (UI spec 7.16), opening on the performance report. Every report type is available from
// the screen's report selector.

import type { ReactElement } from 'react';

import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { ReportScreen } from './sections/ReportScreen';

export function ReportsPerformancePage(): ReactElement {
  return (
    <PageShell
      title="Reports"
      description="Performance, allocation, costs, income, tax and strategy attribution for any period, in one currency, with comparisons, export and schedules."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Reports' },
        { label: 'Performance' },
      ]}
    >
      <ReportScreen defaultType="performance" />
    </PageShell>
  );
}
