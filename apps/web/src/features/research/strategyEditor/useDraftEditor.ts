// Editor state for one strategy (UI spec 7.8). Edits stay local until saved; a save goes to the
// strategy write endpoint (T-01), which numbers the version and returns the whole history.

import { useCallback, useState } from 'react';

import { useSaveStrategy } from '../../../data/api';
import type { StrategyDraftDto, StrategyVersionDto } from '../../../data/schemas';

export interface DraftEditor {
  readonly draft: StrategyDraftDto | null;
  readonly isDirty: boolean;
  readonly versions: readonly StrategyVersionDto[];
  readonly isSaving: boolean;
  readonly saveError: string | null;
  readonly update: (change: (draft: StrategyDraftDto) => StrategyDraftDto) => void;
  readonly discard: () => void;
  readonly save: (summary: string) => void;
  readonly revertTo: (version: StrategyVersionDto) => void;
}

interface EditorState {
  readonly strategyId: string | null;
  readonly draft: StrategyDraftDto | null;
  // What "no changes" means right now: the last definition the server holds.
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
  const mutation = useSaveStrategy();

  // Adopt the fetched definition when it arrives, or when the route moves to another strategy.
  if (state.strategyId !== strategyId || (state.draft === null && serverDraft !== undefined)) {
    setState({ strategyId, draft: serverDraft ?? null, baseline: serverDraft ?? null });
  }

  const update = useCallback((change: (draft: StrategyDraftDto) => StrategyDraftDto): void => {
    setState((current) =>
      current.draft === null ? current : { ...current, draft: change(current.draft) },
    );
  }, []);

  const discard = useCallback((): void => {
    setState((current) => ({ ...current, draft: current.baseline }));
  }, []);

  const { mutate } = mutation;
  const save = useCallback(
    (summary: string): void => {
      const draft = state.draft;
      if (draft === null || strategyId === null) return;
      mutate(
        {
          strategyId,
          draft,
          summary: summary.trim() === '' ? 'Saved from the editor.' : summary,
        },
        {
          onSuccess: (saved) => {
            setState((current) => ({ ...current, draft: saved.draft, baseline: saved.draft }));
          },
        },
      );
    },
    [state.draft, strategyId, mutate],
  );

  // Reverting loads the old definition as unsaved changes; saving it makes a new version.
  const revertTo = useCallback((version: StrategyVersionDto): void => {
    setState((current) =>
      current.baseline === null
        ? current
        : {
            ...current,
            draft: { ...version.draft, version: current.baseline.version },
          },
    );
  }, []);

  const isDirty =
    state.draft !== null &&
    state.baseline !== null &&
    JSON.stringify(state.draft) !== JSON.stringify(state.baseline);

  return {
    draft: state.draft,
    isDirty,
    versions: serverVersions,
    isSaving: mutation.isPending,
    saveError: mutation.error?.message ?? null,
    update,
    discard,
    save,
    revertTo,
  };
}
