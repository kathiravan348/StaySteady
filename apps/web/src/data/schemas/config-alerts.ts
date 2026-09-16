// Alert rule configuration (UI spec 7.18): which alerts go where, when they escalate, and quiet hours
// with a critical override. Cross-field rules live in the schema, as in every configuration area.

import { z } from 'zod';

import {
  IanaTimeZoneSchema,
  IsoUtcTimestampSchema,
  SeveritySchema,
  TimeOfDaySchema,
} from './common';
import { ChangeReasonSchema, ConfigHealthSchema } from './config';
import { AlertCategorySchema } from './system';

export const AlertRuleConfigSchema = z
  .object({
    ruleId: z
      .string()
      .regex(/^rule-[a-z0-9-]{2,30}$/, 'Use rule- then lowercase letters, digits or dashes'),
    name: z.string().trim().min(1, 'A rule needs a name'),
    category: AlertCategorySchema,
    // Alerts of this severity or worse match the rule.
    minimumSeverity: SeveritySchema,
    channels: z.array(z.string().min(1)).min(1, 'Send to at least one channel'),
    escalation: z.object({
      enabled: z.boolean(),
      afterMinutes: z
        .number()
        .int('Whole minutes only')
        .min(1, 'At least one minute')
        .max(1440, 'At most a day'),
      channels: z.array(z.string().min(1)),
    }),
    quietHours: z.object({
      enabled: z.boolean(),
      start: TimeOfDaySchema,
      end: TimeOfDaySchema,
      timezone: IanaTimeZoneSchema,
    }),
    // Critical alerts are delivered during quiet hours when this is on.
    criticalOverridesQuietHours: z.boolean(),
    enabled: z.boolean(),
  })
  .superRefine((config, ctx) => {
    const issue = (path: string[], message: string): void => {
      ctx.addIssue({ code: 'custom', path, message });
    };
    const { escalation, quietHours } = config;
    if (escalation.enabled) {
      if (escalation.channels.length === 0) {
        issue(['escalation', 'channels'], 'Escalate to at least one channel');
      } else if (escalation.channels.every((channel) => config.channels.includes(channel))) {
        issue(
          ['escalation', 'channels'],
          'Escalation must reach a channel the alert did not already go to',
        );
      }
    }
    if (
      quietHours.enabled &&
      quietHours.start.hour === quietHours.end.hour &&
      quietHours.start.minute === quietHours.end.minute
    ) {
      issue(['quietHours', 'end'], 'Quiet hours must start and end at different times');
    }
  });
export type AlertRuleConfigDto = z.infer<typeof AlertRuleConfigSchema>;
export type AlertRuleConfigInput = z.input<typeof AlertRuleConfigSchema>;

export const AlertRuleConfigEntrySchema = z.object({
  config: AlertRuleConfigSchema,
  health: ConfigHealthSchema,
  versions: z
    .array(
      z.object({
        version: z.number().int().positive(),
        savedAt: IsoUtcTimestampSchema,
        reason: z.string().min(1),
        snapshot: AlertRuleConfigSchema,
      }),
    )
    .min(1),
});
export type AlertRuleConfigEntryDto = z.infer<typeof AlertRuleConfigEntrySchema>;

export const AlertRuleConfigListSchema = z.array(AlertRuleConfigEntrySchema);

export const SaveAlertRuleConfigRequestSchema = z.object({
  config: AlertRuleConfigSchema,
  reason: ChangeReasonSchema,
});

export const TestAlertRuleRequestSchema = z.object({ config: AlertRuleConfigSchema });
