// Editor state for one strategy (UI spec 7.8). The mock phase has no write API for definitions, so
// edits and saved versions live in this browser session on top of the server's version history.

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { StrategyDraftDto, StrategyVersionDto } from '../../../data/schemas';
import { StrategyVersionListSchema } from '../../../data/schemas';

const storageKey = (strategyId: string): string => `staysteady.strategy-versions.${strategyId}`;

function loadLocal(strategyId: string): readonly StrategyVersionDto[] {
  try {
    const raw = window.sessionStorage.getItem(storageKey(strategyId));
    if (raw === null) return [];
    const parsed = StrategyVersionListSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export interface DraftEditor {
  readonly draft: StrategyDraftDto | null;
  readonly isDirty: boolean;
  readonly versions: readonly StrategyVersionDto[];
  readonly update: (change: (draft: StrategyDraftDto) => StrategyDraftDto) => void;
  readonly discard: () => void;
  readonly save: (summary: string) => void;
  readonly revertTo: (version: StrategyVersionDto) => void;
}

interface EditorState {
  readonly strategyId: string | null;
  readonly draft: StrategyDraftDto | null;
  // What "no changes" means right now: the server definition until something is saved.
  readonly baseline: StrategyDraftDto | null;
}

export function useDraftEditor(
  strategyId: string | null,
  serverDraft: StrategyDraftDto | undefined,
  serverVersions: readonly StrategyVersionDto[],
): DraftEditor {
  const [state, setState] = useState<EditorState>({
    strategyId,
    draft: serverDraft ?? null,
    baseline: serverDraft ?? null,
  });
  const [localVersions, setLocalVersions] = useState<readonly StrategyVersionDto[]>(() =>
    strategyId === null ? [] : loadLocal(strategyId),
  );

  // Adopt the fetched definition when it arrives, or when the route moves to another strategy.
  if (state.strategyId !== strategyId || (state.draft === null && serverDraft !== undefined)) {
    setState({ strategyId, draft: serverDraft ?? null, baseline: serverDraft ?? null });
  }

  useEffect(() => {
    if (strategyId === null) return;
    try {
      window.sessionStorage.setItem(storageKey(strategyId), JSON.stringify(localVersions));
    } catch {
      // Storage unavailable: saved versions last until the page is reloaded.
    }
  }, [strategyId, localVersions]);

  const update = useCallback((change: (draft: StrategyDraftDto) => StrategyDraftDto): void => {
    setState((current) =>
      current.draft === null ? current : { ...current, draft: change(current.draft) },
    );
  }, []);

  const discard = useCallback((): void => {
    setState((current) => ({ ...current, draft: current.baseline }));
  }, []);

  // Reads the draft from the closure rather than from inside an updater: a state updater must be
  // pure, and React invokes it twice in development.
  const save = useCallback(
    (summary: string): void => {
      const draft = state.draft;
      if (draft === null) return;
      const saved: StrategyVersionDto = {
        version: draft.version,
        savedAt: draft.updatedAt,
        summary: summary === '' ? 'Saved from the editor.' : summary,
        draft,
      };
      setLocalVersions((versions) => [saved, ...versions]);
      setState((current) => ({ ...current, baseline: draft }));
    },
    [state.draft],
  );

  const revertTo = useCallback((version: StrategyVersionDto): void => {
    setState((current) => ({ ...current, draft: version.draft }));
  }, []);

  const versions = useMemo(
    () => [...localVersions, ...serverVersions],
    [localVersions, serverVersions],
  );

  const isDirty =
    state.draft !== null &&
    state.baseline !== null &&
    JSON.stringify(state.draft) !== JSON.stringify(state.baseline);

  return { draft: state.draft, isDirty, versions, update, discard, save, revertTo };
}
