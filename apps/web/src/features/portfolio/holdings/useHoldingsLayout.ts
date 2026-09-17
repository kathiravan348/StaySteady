// Saved Holdings layout: grouping and visible columns (UI spec 7.2 "saved as a layout", UI spec 9).

import type { VisibilityState } from '@staysteady/ui';
import { useEffect, useState } from 'react';
import { z } from 'zod';

export const HOLDING_GROUPINGS = [
  'flat',
  'country',
  'currency',
  'type',
  'sector',
  'industry',
  'group',
  'broker',
  'strategy',
] as const;
export type HoldingGrouping = (typeof HOLDING_GROUPINGS)[number];

const STORAGE_KEY = 'staysteady.holdings.layout';

const StoredLayoutSchema = z.object({
  grouping: z.enum(HOLDING_GROUPINGS),
  columnVisibility: z.record(z.string(), z.boolean()),
});

interface LayoutState {
  readonly grouping: HoldingGrouping;
  readonly columnVisibility: VisibilityState;
}

export interface HoldingsLayout extends LayoutState {
  readonly setGrouping: (grouping: HoldingGrouping) => void;
  readonly setColumnVisibility: (visibility: VisibilityState) => void;
  readonly resetLayout: () => void;
}

// Stored layouts are validated; anything unreadable falls back to the defaults.
function loadLayout(defaults: VisibilityState): LayoutState {
  const fallback: LayoutState = { grouping: 'flat', columnVisibility: defaults };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return fallback;
    }
    const parsed = StoredLayoutSchema.safeParse(JSON.parse(raw));
    return parsed.success
      ? {
          grouping: parsed.data.grouping,
          columnVisibility: { ...defaults, ...parsed.data.columnVisibility },
        }
      : fallback;
  } catch {
    return fallback;
  }
}

export function useHoldingsLayout(defaultVisibility: VisibilityState): HoldingsLayout {
  const [layout, setLayout] = useState<LayoutState>(() => loadLayout(defaultVisibility));

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // Storage unavailable: the layout still applies until the page is reloaded.
    }
  }, [layout]);

  return {
    ...layout,
    setGrouping: (grouping) => {
      setLayout((current) => ({ ...current, grouping }));
    },
    setColumnVisibility: (columnVisibility) => {
      setLayout((current) => ({ ...current, columnVisibility }));
    },
    resetLayout: () => {
      setLayout({ grouping: 'flat', columnVisibility: defaultVisibility });
    },
  };
}
