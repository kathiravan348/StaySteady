// Editing an alert rule (UI spec 7.18): a blank new rule, labels, and a version described in the
// screen's own words for the diff.

import type { AlertRuleConfigInput } from '../../../../data/schemas';
import { AlertCategorySchema, SeveritySchema } from '../../../../data/schemas';
import { humanizeToken } from '../../../../shared/format';

export const CATEGORY_OPTIONS = AlertCategorySchema.options.map((value) => ({
  value,
  label: humanizeToken(value),
}));

export const SEVERITY_OPTIONS = SeveritySchema.options.map((value) => ({
  value,
  label: `${humanizeToken(value)} or worse`,
}));

// Quiet overnight, critical alerts still delivered, nothing escalated until the owner decides to.
export function blankAlertRule(): AlertRuleConfigInput {
  return {
    ruleId: 'rule-',
    name: '',
    category: 'action_needed',
    minimumSeverity: 'medium',
    channels: [],
    escalation: { enabled: false, afterMinutes: 30, channels: [] },
    quietHours: {
      enabled: true,
      start: { hour: 23, minute: 0 },
      end: { hour: 7, minute: 0 },
      timezone: 'Asia/Kolkata',
    },
    criticalOverridesQuietHours: true,
    enabled: true,
  };
}

const pad = (value: number): string => String(value).padStart(2, '0');
const time = (value: { hour: number; minute: number }): string =>
  `${pad(value.hour)}:${pad(value.minute)}`;

export function describeAlertRule(
  config: AlertRuleConfigInput,
  channelName: (id: string) => string,
): Record<string, string> {
  const names = (ids: readonly string[]): string => ids.map(channelName).join(', ') || 'None';
  const { escalation, quietHours } = config;
  return {
    Name: config.name,
    Category: humanizeToken(config.category),
    'Minimum severity': humanizeToken(config.minimumSeverity),
    Channels: names(config.channels),
    Escalation: escalation.enabled
      ? `After ${String(escalation.afterMinutes)} min to ${names(escalation.channels)}`
      : 'Off',
    'Quiet hours': quietHours.enabled
      ? `${time(quietHours.start)} to ${time(quietHours.end)} (${quietHours.timezone})`
      : 'Off',
    'Critical alerts during quiet hours': config.criticalOverridesQuietHours ? 'Delivered' : 'Held',
    Enabled: config.enabled ? 'Yes' : 'No',
  };
}
