// Market schedule provider: live session state calculation for configured markets (UI spec 5).

import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { IsoUtcTimestamp } from '../shared/types/dateTime';
import { nowUtc } from '../shared/types/dateTime';
import type { MarketStatusInfo } from '../shared/marketTime';
import { getAllMarketStatuses } from '../shared/marketTime';

export interface MarketScheduleState {
  readonly currentTimestamp: IsoUtcTimestamp;
  readonly marketStatuses: readonly MarketStatusInfo[];
}

const MarketScheduleContext = createContext<MarketScheduleState | null>(null);

export function MarketScheduleProvider({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const [timestamp, setTimestamp] = useState<IsoUtcTimestamp>(nowUtc);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimestamp(nowUtc());
    }, 10_000); // 10s tick to keep market sessions updated
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const marketStatuses = useMemo<readonly MarketStatusInfo[]>(
    () => getAllMarketStatuses(timestamp),
    [timestamp],
  );

  const value = useMemo<MarketScheduleState>(
    () => ({
      currentTimestamp: timestamp,
      marketStatuses,
    }),
    [timestamp, marketStatuses],
  );

  return <MarketScheduleContext.Provider value={value}>{children}</MarketScheduleContext.Provider>;
}

export function useMarketSchedule(): MarketScheduleState {
  const context = useContext(MarketScheduleContext);
  if (!context) {
    throw new Error('useMarketSchedule must be used within a MarketScheduleProvider');
  }
  return context;
}
