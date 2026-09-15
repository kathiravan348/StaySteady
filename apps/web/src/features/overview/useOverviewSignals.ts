// Automation and health signals for the Overview headline cards. Undefined while loading or failed.

import { useApprovals, useSystemHealth } from '../../data/api';

export interface OverviewSignals {
  readonly pendingApprovals: number | undefined;
  readonly unhealthyComponents: number | undefined;
  readonly overallHealth: string | undefined;
}

export function useOverviewSignals(): OverviewSignals {
  const health = useSystemHealth();
  const approvals = useApprovals();

  return {
    pendingApprovals: approvals.data?.filter((approval) => approval.status === 'pending').length,
    unhealthyComponents: health.data?.services.filter((service) => service.status !== 'healthy')
      .length,
    overallHealth: health.data?.overallStatus,
  };
}
