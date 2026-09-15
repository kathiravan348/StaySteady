// Session-only position edits (mock phase: no write API). Validated on load; unreadable data resets.

import { useEffect, useMemo, useState } from 'react';

import type { ManualTransactionDraft, PositionEdits } from './model/positionEdits';
import {
  draftToManualTransaction,
  EMPTY_POSITION_EDITS,
  PositionEditsSchema,
} from './model/positionEdits';

export interface PositionEditActions {
  readonly setExitLevel: (level: string | null) => void;
  readonly addNote: (text: string) => void;
  readonly removeNote: (id: string) => void;
  readonly addManualTransaction: (draft: ManualTransactionDraft) => void;
  readonly removeManualTransaction: (id: string) => void;
  readonly requestClose: () => void;
  readonly withdrawClose: () => void;
}

export interface PositionEditsResult {
  readonly edits: PositionEdits;
  readonly actions: PositionEditActions;
}

const storageKey = (instrumentId: string): string => `staysteady.position.${instrumentId}`;

function loadEdits(instrumentId: string): PositionEdits {
  try {
    const raw = window.sessionStorage.getItem(storageKey(instrumentId));
    if (raw === null) {
      return EMPTY_POSITION_EDITS;
    }
    const parsed = PositionEditsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_POSITION_EDITS;
  } catch {
    return EMPTY_POSITION_EDITS;
  }
}

export function usePositionEdits(instrumentId: string): PositionEditsResult {
  const [state, setState] = useState(() => ({
    instrumentId,
    edits: loadEdits(instrumentId),
  }));
  // Navigating to another position loads that position's edits.
  if (state.instrumentId !== instrumentId) {
    setState({ instrumentId, edits: loadEdits(instrumentId) });
  }

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey(state.instrumentId), JSON.stringify(state.edits));
    } catch {
      // Storage unavailable: edits still apply until the page is reloaded.
    }
  }, [state]);

  const actions = useMemo<PositionEditActions>(() => {
    const update = (change: (edits: PositionEdits) => PositionEdits): void => {
      setState((current) => ({ ...current, edits: change(current.edits) }));
    };
    return {
      setExitLevel: (exitLevel) => {
        update((edits) => ({ ...edits, exitLevel }));
      },
      addNote: (text) => {
        const note = { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() };
        update((edits) => ({ ...edits, notes: [note, ...edits.notes] }));
      },
      removeNote: (id) => {
        update((edits) => ({ ...edits, notes: edits.notes.filter((note) => note.id !== id) }));
      },
      addManualTransaction: (draft) => {
        const entry = draftToManualTransaction(draft, `manual-${crypto.randomUUID()}`);
        update((edits) => ({
          ...edits,
          manualTransactions: [...edits.manualTransactions, entry],
        }));
      },
      removeManualTransaction: (id) => {
        update((edits) => ({
          ...edits,
          manualTransactions: edits.manualTransactions.filter((entry) => entry.id !== id),
        }));
      },
      requestClose: () => {
        update((edits) => ({ ...edits, closeRequestedAt: new Date().toISOString() }));
      },
      withdrawClose: () => {
        update((edits) => ({ ...edits, closeRequestedAt: null }));
      },
    };
  }, []);

  return { edits: state.edits, actions };
}
