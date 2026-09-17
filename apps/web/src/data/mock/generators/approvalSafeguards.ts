// The safety layer's view of one approval (E-03; requirements 27 and 29): the compliance result, the
// cooling-off window and whether a stated reason is required, and the rules a decision must meet.
// Pure: the handler supplies the eligibility check, the saved safeguards and the FX table.

import { Decimal } from 'decimal.js';

import type {
  ApprovalQueueItemDto,
  ApprovalRequestDto,
  EligibilityCheckResult,
} from '../../schemas';
import type { OperatingPolicyConfigInput } from '../../schemas/config-assumptions';
import type { FxQuote } from '../../../shared/money';
import { convertMoneyWithTable, createMoney } from '../../../shared/money';
import type { IsoUtcTimestamp } from '../../../shared/types/dateTime';
import { toIsoUtcTimestamp } from '../../../shared/types/dateTime';

type Safeguards = OperatingPolicyConfigInput['safeguards'];
type Eligibility = (symbol: string, action: 'BUY' | 'SELL') => EligibilityCheckResult;

export interface SafeguardInputs {
  readonly checkEligibility: Eligibility;
  readonly safeguards: Safeguards;
  readonly fxTable: readonly FxQuote[];
}

// When the owner approved it, if they did; cooling off starts then.
export interface ApprovedAt {
  readonly decidedAt: IsoUtcTimestamp;
}

export function complianceFrom(check: EligibilityCheckResult): ApprovalRequestDto['compliance'] {
  return {
    status: check.status === 'ALLOWED' ? 'passed' : 'refused',
    rule: check.rule,
    summary:
      check.status === 'ALLOWED' ? 'No restriction applies to this trade.' : check.primaryReason,
    policyClause: check.policyClause,
    preClearanceRequired: check.preClearanceRequired,
  };
}

export function withSafeguards(
  request: ApprovalQueueItemDto,
  inputs: SafeguardInputs,
  approved: ApprovedAt | null,
): ApprovalRequestDto {
  const check = inputs.checkEligibility(
    request.instrumentSymbol,
    request.side === 'buy' ? 'BUY' : 'SELL',
  );
  const { coolingOffMinutes, coolingOffAbove, requireStatedReason } = inputs.safeguards;
  const cost = request.impact.estimatedCost;
  const costInThreshold = convertMoneyWithTable(
    createMoney(cost.amount, cost.currency),
    coolingOffAbove.currency,
    inputs.fxTable,
  ).amount;
  const applies = coolingOffMinutes > 0 && costInThreshold.gte(new Decimal(coolingOffAbove.amount));
  return {
    ...request,
    compliance: complianceFrom(check),
    coolingOff: applies
      ? {
          minutes: coolingOffMinutes,
          appliesAbove: { amount: coolingOffAbove.amount, currency: coolingOffAbove.currency },
          executableAt:
            approved === null
              ? null
              : toIsoUtcTimestamp(
                  new Date(
                    Date.parse(approved.decidedAt) + coolingOffMinutes * 60_000,
                  ).toISOString(),
                ),
        }
      : null,
    reasonRequired: requireStatedReason,
  };
}

export interface DecisionAttempt {
  readonly decision: 'approved' | 'rejected';
  readonly reason: string | null;
}

export interface DecisionRefusal {
  readonly status: 400 | 409;
  readonly message: string;
}

// Why the safety layer refuses this decision, or null when it may be recorded. Nothing bypasses it:
// the queue screen disables the same actions, but the server is where the rule is kept.
export function refuseDecision(
  current: ApprovalRequestDto,
  attempt: DecisionAttempt,
  nowMs: number,
): DecisionRefusal | null {
  if (current.reasonRequired && (attempt.reason ?? '').trim() === '') {
    return {
      status: 400,
      message: 'Say why: a stated reason is required and is kept in the decision journal',
    };
  }
  if (current.status === 'pending') {
    if (attempt.decision === 'approved' && current.compliance.status === 'refused') {
      return {
        status: 409,
        message: `Compliance refuses this trade: ${current.compliance.summary}`,
      };
    }
    return null;
  }
  const executableAt = current.coolingOff?.executableAt ?? null;
  const isCoolingOff =
    current.status === 'approved' && executableAt !== null && Date.parse(executableAt) > nowMs;
  if (isCoolingOff && attempt.decision === 'rejected') return null;
  return {
    status: 409,
    message: isCoolingOff
      ? 'Already approved; during cooling off it can only be withdrawn'
      : 'This approval has already been decided',
  };
}
