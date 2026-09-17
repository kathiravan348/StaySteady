// Reports (UI spec 7.16), opening on the tax report. Every report type is available from
// the screen's report selector.

import type { ReactElement } from 'react';

import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { ReportsNav } from './sections/ReportsNav';
import { ReportScreen } from './sections/ReportScreen';

export function ReportsTaxPage(): ReactElement {
  return (
    <PageShell
      title="Reports"
      description="Performance, allocation, costs, income, tax and strategy attribution for any period, in one currency, with comparisons, export and schedules."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Reports' },
        { label: 'Tax' },
      ]}
    >
      <ReportsNav />
      <ReportScreen defaultType="tax" />
    </PageShell>
  );
}
