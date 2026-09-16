// Promotion requests for strategies (UI spec 7.7). The mock phase has no write API for the
// lifecycle, so a request lives in this browser session only, exactly as the backtest result
// screen records its own promotion requests.

import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';

import type { StrategyStageDto } from '../../../data/schemas';

const RequestSchema = z.object({
  requestedStage: z.string().min(1),
  requestedAt: z.string().min(1),
});
const StoreSchema = z.record(z.string(), RequestSchema);
export type PromotionRequest = z.infer<typeof RequestSchema>;

const STORAGE_KEY = 'staysteady.strategy-promotions';

function load(): Record<string, PromotionRequest> {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    const parsed = StoreSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export interface PromotionState {
  readonly requests: Readonly<Record<string, PromotionRequest>>;
  readonly request: (strategyId: string, stage: StrategyStageDto) => void;
  readonly withdraw: (strategyId: string) => void;
}

export function useStrategyPromotions(): PromotionState {
  const [requests, setRequests] = useState<Record<string, PromotionRequest>>(load);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch {
      // Storage unavailable: requests still apply until the page is reloaded.
    }
  }, [requests]);

  const request = useCallback((strategyId: string, stage: StrategyStageDto): void => {
    setRequests((current) => ({
      ...current,
      [strategyId]: { requestedStage: stage, requestedAt: new Date().toISOString() },
    }));
  }, []);

  const withdraw = useCallback((strategyId: string): void => {
    setRequests((current) => {
      const next = { ...current };
      delete next[strategyId];
      return next;
    });
  }, []);

  return { requests, request, withdraw };
}
