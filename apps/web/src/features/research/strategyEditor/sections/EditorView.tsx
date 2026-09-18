import { Badge, Button } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { InstrumentDto, StrategyDraftDto, StrategyVersionDto } from '../../../../data/schemas';
import type { DraftEditor } from '../useDraftEditor';
import { PreviewPanel } from './PreviewPanel';
import { RuleBuilder } from './RuleBuilder';
import {
  HoldingAndExitSection,
  NewsAndRiskSection,
  ScopeSection,
  SizingSection,
} from './SettingsSections';
import { ValidationPanel } from './ValidationPanel';
import { VersionHistory } from './VersionHistory';
import styles from '../StrategyEditor.module.scss';

export interface EditorViewProps {
  readonly draft: StrategyDraftDto;
  readonly editor: DraftEditor;
  readonly instruments: readonly InstrumentDto[];
  readonly versions: readonly StrategyVersionDto[];
}

export function EditorView({
  draft,
  editor,
  instruments,
  versions,
}: EditorViewProps): ReactElement {
  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <Badge variant={editor.isDirty ? 'warning' : 'neutral'}>
            {editor.isDirty ? 'Unsaved changes' : 'No changes'}
          </Badge>
          <span className={styles.meta}>v{draft.version}</span>
        </span>
        <span className={styles.inline}>
          <Button
            variant="secondary"
            isDisabled={!editor.isDirty}
            onPress={() => {
              editor.discard();
            }}
          >
            Discard changes
          </Button>
          <Button
            isDisabled={!editor.isDirty || editor.isSaving}
            onPress={() => {
              editor.save('Saved from the editor.');
            }}
          >
            {editor.isSaving ? 'Saving' : 'Save version'}
          </Button>
        </span>
      </div>
      {editor.saveError === null ? null : (
        <p role="alert" className={styles.saveError}>
          Not saved: {editor.saveError}
        </p>
      )}

      <div className={styles.layout}>
        <div className={styles.column}>
          <ScopeSection draft={draft} onChange={editor.update} instruments={instruments} />
          <RuleBuilder
            title="Entry conditions"
            description="When all or any of these are true, the strategy opens a position."
            root={draft.entry}
            onChange={(entry) => {
              editor.update((current) => ({ ...current, entry }));
            }}
          />
          <RuleBuilder
            title="Exit conditions"
            description="When these are true, an open position is closed. Forced exits below apply regardless."
            root={draft.exit}
            onChange={(exit) => {
              editor.update((current) => ({ ...current, exit }));
            }}
          />
          <SizingSection draft={draft} onChange={editor.update} />
          <HoldingAndExitSection draft={draft} onChange={editor.update} />
          <NewsAndRiskSection draft={draft} onChange={editor.update} />
        </div>

        <div className={styles.column}>
          <ValidationPanel draft={draft} />
          <PreviewPanel draft={draft} instruments={instruments} />
          <VersionHistory draft={draft} versions={versions} onRevert={editor.revertTo} />
        </div>
      </div>
    </div>
  );
}
