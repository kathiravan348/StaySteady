// Saved chart layouts: per instrument, then the owner's default for the instrument type, then the
// built-in default (UI spec 7.4). Stored layouts are validated; unreadable ones are ignored.

import { useEffect, useState } from 'react';

import type { InstrumentTypeDto } from '../../../data/schemas';
import type { Timeframe, WorkspaceDrawing, WorkspaceLayout } from './model/workspaceLayout';
import { builtInLayoutFor, WorkspaceLayoutSchema } from './model/workspaceLayout';

export type LayoutSource = 'instrument' | 'type' | 'built-in';

export interface WorkspaceLayoutState {
  readonly layout: WorkspaceLayout;
  readonly source: LayoutSource;
  readonly update: (change: Partial<WorkspaceLayout>) => void;
  readonly setDrawings: (timeframe: Timeframe, drawings: readonly WorkspaceDrawing[]) => void;
  readonly saveAsTypeDefault: () => boolean;
  readonly reset: () => void;
}

const instrumentKey = (id: string): string => `staysteady.workspace.layout.instrument.${id}`;
const typeKey = (type: string): string => `staysteady.workspace.layout.type.${type}`;

function readLayout(key: string): WorkspaceLayout | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    const parsed = WorkspaceLayoutSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeLayout(key: string, layout: WorkspaceLayout | null): boolean {
  try {
    if (layout === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(layout));
    return true;
  } catch {
    return false;
  }
}

interface LoadedLayout {
  readonly instrumentId: string;
  readonly layout: WorkspaceLayout;
  readonly source: LayoutSource;
  readonly isDirty: boolean;
}

function loadLayout(instrumentId: string, type: InstrumentTypeDto): LoadedLayout {
  const own = readLayout(instrumentKey(instrumentId));
  if (own !== null) return { instrumentId, layout: own, source: 'instrument', isDirty: false };
  const typeDefault = readLayout(typeKey(type));
  if (typeDefault !== null) {
    return {
      instrumentId,
      layout: { ...typeDefault, drawings: {} },
      source: 'type',
      isDirty: false,
    };
  }
  return { instrumentId, layout: builtInLayoutFor(type), source: 'built-in', isDirty: false };
}

export function useWorkspaceLayout(
  instrumentId: string,
  type: InstrumentTypeDto,
): WorkspaceLayoutState {
  const [state, setState] = useState(() => loadLayout(instrumentId, type));
  if (state.instrumentId !== instrumentId) {
    setState(loadLayout(instrumentId, type));
  }

  useEffect(() => {
    if (state.isDirty) writeLayout(instrumentKey(state.instrumentId), state.layout);
  }, [state]);

  const change = (next: (layout: WorkspaceLayout) => WorkspaceLayout): void => {
    setState((current) => ({
      ...current,
      layout: next(current.layout),
      source: 'instrument',
      isDirty: true,
    }));
  };

  return {
    layout: state.layout,
    source: state.source,
    update: (partial) => {
      change((layout) => ({ ...layout, ...partial }));
    },
    setDrawings: (timeframe, drawings) => {
      change((layout) => ({
        ...layout,
        drawings: { ...layout.drawings, [timeframe]: [...drawings] },
      }));
    },
    // Drawings belong to one instrument, so the type default leaves them out.
    saveAsTypeDefault: () => writeLayout(typeKey(type), { ...state.layout, drawings: {} }),
    reset: () => {
      writeLayout(instrumentKey(instrumentId), null);
      setState(loadLayout(instrumentId, type));
    },
  };
}
