// Strategy Editor screen (UI spec 7.8): define a strategy without writing system-level code.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useInstruments, useStrategyDraft, useStrategyVersions } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { EditorView } from './strategyEditor/sections/EditorView';
import { useDraftEditor } from './strategyEditor/useDraftEditor';
import styles from './strategyEditor/StrategyEditor.module.scss';

function EditorBody({ strategyId }: { readonly strategyId: string }): ReactElement {
  const draftQuery = useStrategyDraft(strategyId);
  const versionsQuery = useStrategyVersions(strategyId);
  const instruments = useInstruments();
  const editor = useDraftEditor(strategyId, draftQuery.data, versionsQuery.data ?? []);

  if (draftQuery.isError) {
    const isMissing = draftQuery.error.message.includes('404');
    return isMissing ? (
      <EmptyState
        title="Strategy not found"
        description={`No strategy has the id "${strategyId}".`}
        action={
          <Link to={ROUTES.RESEARCH_STRATEGIES} className={styles.link}>
            Back to the strategy library
          </Link>
        }
      />
    ) : (
      <ErrorState
        title="Strategy unavailable"
        message={draftQuery.error.message}
        onRetry={() => {
          void draftQuery.refetch();
        }}
      />
    );
  }
  if (editor.draft === null || instruments.data === undefined) {
    return <LoadingState layout="detail" count={6} />;
  }
  return (
    <EditorView
      draft={editor.draft}
      editor={editor}
      instruments={instruments.data}
      versions={editor.versions}
    />
  );
}

export function ResearchEditorPage(): ReactElement {
  const { id } = useParams<{ id?: string }>();

  return (
    <PageShell
      title={id === undefined ? 'Strategy editor' : 'Edit strategy'}
      description="Scope, entry and exit conditions, sizing, forced exits and risk, checked as you write them."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Strategies', to: ROUTES.RESEARCH_STRATEGIES },
        { label: id ?? 'New' },
      ]}
    >
      {id === undefined ? (
        <EmptyState
          title="Pick a strategy to edit"
          description="Open a strategy from the library to see and change its definition."
          action={
            <Link to={ROUTES.RESEARCH_STRATEGIES} className={styles.link}>
              Go to the strategy library
            </Link>
          }
        />
      ) : (
        <EditorBody strategyId={id} />
      )}
    </PageShell>
  );
}
