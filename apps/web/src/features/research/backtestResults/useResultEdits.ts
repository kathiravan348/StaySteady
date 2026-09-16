// Saving, naming, tagging and stage promotion for a backtest result (UI spec 7.10 actions).
// Mock phase: there is no write API for these yet, so they live in this browser session only.

import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

const StoredEditsSchema = z.object({
  name: z.string().max(80),
  tags: z.array(z.string().min(1).max(24)),
  isSaved: z.boolean(),
  promotionRequestedAt: z.string().nullable(),
});
export type ResultEdits = z.infer<typeof StoredEditsSchema>;

export interface ResultEditActions {
  readonly setName: (name: string) => void;
  readonly addTag: (tag: string) => void;
  readonly removeTag: (tag: string) => void;
  readonly save: () => void;
  readonly requestPromotion: () => void;
  readonly withdrawPromotion: () => void;
}

const EMPTY: ResultEdits = { name: '', tags: [], isSaved: false, promotionRequestedAt: null };
const storageKey = (backtestId: string): string => `staysteady.backtest.${backtestId}`;

function load(backtestId: string): ResultEdits {
  try {
    const raw = window.sessionStorage.getItem(storageKey(backtestId));
    if (raw === null) return EMPTY;
    const parsed = StoredEditsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function useResultEdits(backtestId: string): {
  readonly edits: ResultEdits;
  readonly actions: ResultEditActions;
} {
  const [state, setState] = useState(() => ({ backtestId, edits: load(backtestId) }));
  if (state.backtestId !== backtestId) {
    setState({ backtestId, edits: load(backtestId) });
  }

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey(state.backtestId), JSON.stringify(state.edits));
    } catch {
      // Storage unavailable: the edits still apply until the page is reloaded.
    }
  }, [state]);

  const actions = useMemo<ResultEditActions>(() => {
    const update = (change: (edits: ResultEdits) => ResultEdits): void => {
      setState((current) => ({ ...current, edits: change(current.edits) }));
    };
    return {
      setName: (name) => {
        update((edits) => ({ ...edits, name }));
      },
      addTag: (tag) => {
        update((edits) =>
          edits.tags.includes(tag) ? edits : { ...edits, tags: [...edits.tags, tag] },
        );
      },
      removeTag: (tag) => {
        update((edits) => ({ ...edits, tags: edits.tags.filter((item) => item !== tag) }));
      },
      save: () => {
        update((edits) => ({ ...edits, isSaved: true }));
      },
      requestPromotion: () => {
        update((edits) => ({ ...edits, promotionRequestedAt: new Date().toISOString() }));
      },
      withdrawPromotion: () => {
        update((edits) => ({ ...edits, promotionRequestedAt: null }));
      },
    };
  }, []);

  return { edits: state.edits, actions };
}
