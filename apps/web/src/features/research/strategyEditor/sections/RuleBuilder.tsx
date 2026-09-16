import { Card, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { CombinatorDto, RuleConditionDto, RuleGroupDto } from '../../../../data/schemas';
import {
  addCondition,
  addGroup,
  countConditions,
  removeNode,
  setCombinator,
  updateCondition,
} from '../model/ruleTree';
import { ConditionRow } from './ConditionRow';
import styles from '../StrategyEditor.module.scss';

interface GroupEditorProps {
  readonly group: RuleGroupDto;
  readonly depth: number;
  readonly onAddCondition: (groupId: string) => void;
  readonly onAddGroup: (groupId: string) => void;
  readonly onCombinator: (groupId: string, combinator: CombinatorDto) => void;
  readonly onRemove: (nodeId: string) => void;
  readonly onCondition: (condition: RuleConditionDto) => void;
}

// A group reads as a sentence: "All of the following" / "Any of the following", nested as deep as
// the reader builds it.
function GroupEditor({
  group,
  depth,
  onAddCondition,
  onAddGroup,
  onCombinator,
  onRemove,
  onCondition,
}: GroupEditorProps): ReactElement {
  return (
    <div className={cx(styles.group, depth > 0 ? styles.groupNested : undefined)}>
      <div className={styles.groupHeader}>
        <label className={styles.inline}>
          <span className={styles.visuallyHidden}>Combinator</span>
          <select
            className={styles.input}
            value={group.combinator}
            onChange={(event) => {
              onCombinator(group.id, event.target.value as CombinatorDto);
            }}
          >
            <option value="all">All of the following</option>
            <option value="any">Any of the following</option>
          </select>
        </label>
        <span className={styles.inline}>
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              onAddCondition(group.id);
            }}
          >
            Add condition
          </button>
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              onAddGroup(group.id);
            }}
          >
            Add group
          </button>
          {depth > 0 && (
            <button
              type="button"
              className={styles.link}
              onClick={() => {
                onRemove(group.id);
              }}
            >
              Remove group
            </button>
          )}
        </span>
      </div>

      {group.children.length === 0 ? (
        <p className={styles.emptyGroup}>
          Nothing here yet. Add a condition to say when this should fire.
        </p>
      ) : (
        <ul className={styles.groupChildren}>
          {group.children.map((child) => (
            <li key={child.id}>
              {child.node === 'condition' ? (
                <ConditionRow
                  condition={child}
                  onChange={onCondition}
                  onRemove={() => {
                    onRemove(child.id);
                  }}
                />
              ) : (
                <GroupEditor
                  group={child}
                  depth={depth + 1}
                  onAddCondition={onAddCondition}
                  onAddGroup={onAddGroup}
                  onCombinator={onCombinator}
                  onRemove={onRemove}
                  onCondition={onCondition}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface RuleBuilderProps {
  readonly title: string;
  readonly description: string;
  readonly root: RuleGroupDto;
  readonly onChange: (root: RuleGroupDto) => void;
}

export function RuleBuilder({
  title,
  description,
  root,
  onChange,
}: RuleBuilderProps): ReactElement {
  const count = countConditions(root);
  return (
    <Card
      title={title}
      extra={
        <span className={styles.meta}>
          {count === 1 ? '1 condition' : `${String(count)} conditions`}
        </span>
      }
    >
      <p className={styles.note}>{description}</p>
      <GroupEditor
        group={root}
        depth={0}
        onAddCondition={(groupId) => {
          onChange(addCondition(root, groupId));
        }}
        onAddGroup={(groupId) => {
          onChange(addGroup(root, groupId));
        }}
        onCombinator={(groupId, combinator) => {
          onChange(setCombinator(root, groupId, combinator));
        }}
        onRemove={(nodeId) => {
          onChange(removeNode(root, nodeId));
        }}
        onCondition={(condition) => {
          onChange(updateCondition(root, condition));
        }}
      />
    </Card>
  );
}
