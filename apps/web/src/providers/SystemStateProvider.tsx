// System state provider: mode, master automation stop, base currency, and mock scenario (UI spec 5).

import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext, useState, useMemo } from 'react';
import type { BaseCurrencyCode } from '../shared/types/currency';

export type SystemMode = 'simulation' | 'observation' | 'manual-approval' | 'full-automation';

export type SystemHealthStatus = 'healthy' | 'degraded' | 'critical';

export type MockScenario = 'normal' | 'market-crash' | 'high-volatility' | 'connectivity-outage';

export interface SystemState {
  readonly mode: SystemMode;
  readonly setMode: (mode: SystemMode) => void;
  readonly isAutomationStopped: boolean;
  readonly toggleAutomationStop: () => void;
  readonly baseCurrency: BaseCurrencyCode;
  readonly setBaseCurrency: (currency: BaseCurrencyCode) => void;
  readonly healthStatus: SystemHealthStatus;
  readonly setHealthStatus: (status: SystemHealthStatus) => void;
  readonly mockScenario: MockScenario;
  readonly setMockScenario: (scenario: MockScenario) => void;
  readonly unreadAlertsCount: number;
}

const SystemStateContext = createContext<SystemState | null>(null);

export interface SystemStateProviderProps {
  readonly children: ReactNode;
  readonly initialMode?: SystemMode;
  readonly initialBaseCurrency?: BaseCurrencyCode;
}

export function SystemStateProvider({
  children,
  initialMode = 'simulation',
  initialBaseCurrency = 'USD',
}: SystemStateProviderProps): ReactElement {
  const [mode, setMode] = useState<SystemMode>(initialMode);
  const [isAutomationStopped, setIsAutomationStopped] = useState<boolean>(false);
  const [baseCurrency, setBaseCurrency] = useState<BaseCurrencyCode>(initialBaseCurrency);
  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus>('healthy');
  const [mockScenario, setMockScenario] = useState<MockScenario>('normal');
  const [unreadAlertsCount] = useState<number>(3);

  const toggleAutomationStop = (): void => {
    setIsAutomationStopped((prev) => !prev);
  };

  const value = useMemo<SystemState>(
    () => ({
      mode,
      setMode,
      isAutomationStopped,
      toggleAutomationStop,
      baseCurrency,
      setBaseCurrency,
      healthStatus,
      setHealthStatus,
      mockScenario,
      setMockScenario,
      unreadAlertsCount,
    }),
    [mode, isAutomationStopped, baseCurrency, healthStatus, mockScenario, unreadAlertsCount],
  );

  return <SystemStateContext.Provider value={value}>{children}</SystemStateContext.Provider>;
}

export function useSystemState(): SystemState {
  const context = useContext(SystemStateContext);
  if (!context) {
    throw new Error('useSystemState must be used within a SystemStateProvider');
  }
  return context;
}
