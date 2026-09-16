import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { AlertRuleConfigInput } from '../../../../data/schemas';
import {
  CapabilitySwitch,
  CheckboxGroup,
  NumberField,
  SelectField,
  TextField,
  TimeField,
} from '../../../../shared/config';
import { SUPPORTED_TIMEZONES } from '../../../../shared/types/dateTime';
import styles from '../../Settings.module.scss';
import { CATEGORY_OPTIONS, SEVERITY_OPTIONS } from '../model/alertRuleDraft';

export interface AlertRuleSectionProps {
  readonly draft: AlertRuleConfigInput;
  readonly isNew: boolean;
  // Every change names the field it touched, so its error can be shown from then on.
  readonly update: (
    path: string,
    change: (draft: AlertRuleConfigInput) => AlertRuleConfigInput,
  ) => void;
  readonly error: (path: string) => string | undefined;
  readonly channelOptions: readonly { value: string; label: string }[];
}

export function AlertRuleMatchSection({
  draft,
  isNew,
  update,
  error,
  channelOptions,
}: AlertRuleSectionProps): ReactElement {
  return (
    <Card title="What it matches and where it goes">
      <div className={styles.stack}>
        <div className={styles.fieldGrid}>
          <TextField
            label="Rule id"
            value={draft.ruleId}
            isDisabled={!isNew}
            hint={
              isNew
                ? 'rule- then a short lowercase name. It cannot change later.'
                : 'Cannot change.'
            }
            error={error('ruleId')}
            onChange={(value) => {
              update('ruleId', (current) => ({ ...current, ruleId: value.toLowerCase() }));
            }}
          />
          <TextField
            label="Name"
            value={draft.name}
            error={error('name')}
            onChange={(value) => {
              update('name', (current) => ({ ...current, name: value }));
            }}
          />
          <SelectField
            label="Category"
            value={draft.category}
            options={CATEGORY_OPTIONS}
            error={error('category')}
            onChange={(category) => {
              update('category', (current) => ({ ...current, category }));
            }}
          />
          <SelectField
            label="Severity"
            value={draft.minimumSeverity}
            options={SEVERITY_OPTIONS}
            error={error('minimumSeverity')}
            onChange={(minimumSeverity) => {
              update('minimumSeverity', (current) => ({ ...current, minimumSeverity }));
            }}
          />
        </div>
        <CheckboxGroup
          label="Send to"
          value={draft.channels}
          options={channelOptions}
          error={error('channels')}
          onChange={(channels) => {
            update('channels', (current) => ({ ...current, channels }));
          }}
        />
      </div>
    </Card>
  );
}

export function AlertRuleTimingSection({
  draft,
  update,
  error,
  channelOptions,
}: AlertRuleSectionProps): ReactElement {
  const { escalation, quietHours } = draft;
  return (
    <>
      <Card title="Escalation">
        <CapabilitySwitch
          label="Escalate if not acknowledged"
          description="An alert still unacknowledged after the wait is sent again to more channels."
          isSelected={escalation.enabled}
          onChange={(enabled) => {
            update('escalation', (current) => ({
              ...current,
              escalation: { ...current.escalation, enabled },
            }));
          }}
        />
        {escalation.enabled && (
          <div className={styles.stack}>
            <div className={styles.fieldGrid}>
              <NumberField
                label="Wait before escalating (minutes)"
                step="1"
                value={escalation.afterMinutes}
                error={error('escalation.afterMinutes')}
                onChange={(afterMinutes) => {
                  update('escalation.afterMinutes', (current) => ({
                    ...current,
                    escalation: { ...current.escalation, afterMinutes },
                  }));
                }}
              />
            </div>
            <CheckboxGroup
              label="Escalate to"
              value={escalation.channels}
              options={channelOptions}
              error={error('escalation.channels')}
              onChange={(channels) => {
                update('escalation.channels', (current) => ({
                  ...current,
                  escalation: { ...current.escalation, channels },
                }));
              }}
            />
          </div>
        )}
      </Card>

      <Card title="Quiet hours">
        <CapabilitySwitch
          label="Quiet hours"
          description="Alerts matching this rule wait until quiet hours end."
          isSelected={quietHours.enabled}
          onChange={(enabled) => {
            update('quietHours', (current) => ({
              ...current,
              quietHours: { ...current.quietHours, enabled },
            }));
          }}
        />
        {quietHours.enabled && (
          <div className={styles.fieldGrid}>
            <TimeField
              label="From"
              value={quietHours.start}
              error={error('quietHours.start')}
              onChange={(start) => {
                update('quietHours.start', (current) => ({
                  ...current,
                  quietHours: { ...current.quietHours, start },
                }));
              }}
            />
            <TimeField
              label="Until"
              value={quietHours.end}
              error={error('quietHours.end')}
              onChange={(end) => {
                update('quietHours.end', (current) => ({
                  ...current,
                  quietHours: { ...current.quietHours, end },
                }));
              }}
            />
            <SelectField
              label="Time zone"
              value={quietHours.timezone}
              options={SUPPORTED_TIMEZONES.map((zone) => ({ value: zone, label: zone }))}
              error={error('quietHours.timezone')}
              onChange={(timezone) => {
                update('quietHours.timezone', (current) => ({
                  ...current,
                  quietHours: { ...current.quietHours, timezone },
                }));
              }}
            />
          </div>
        )}
        <CapabilitySwitch
          label="Critical alerts break through quiet hours"
          description={
            draft.criticalOverridesQuietHours
              ? 'A critical alert is delivered at once, whatever the time.'
              : 'A critical alert waits until quiet hours end, like any other. This is rarely what you want.'
          }
          isSelected={draft.criticalOverridesQuietHours}
          onChange={(value) => {
            update('criticalOverridesQuietHours', (current) => ({
              ...current,
              criticalOverridesQuietHours: value,
            }));
          }}
        />
      </Card>

      <Card title="Status">
        <CapabilitySwitch
          label="Enabled"
          description="A disabled rule is kept, but alerts it would match go only to the alerts centre."
          isSelected={draft.enabled}
          onChange={(enabled) => {
            update('enabled', (current) => ({ ...current, enabled }));
          }}
        />
      </Card>
    </>
  );
}
