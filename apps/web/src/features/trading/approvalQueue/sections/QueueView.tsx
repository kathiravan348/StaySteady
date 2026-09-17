import { Badge, Button, EmptyState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useDecideApproval } from '../../../../data/api';
import type { ApprovalDecisionDto, ApprovalRequestDto } from '../../../../data/schemas';
import { useNow } from '../useNow';
import { ApprovalCard } from './ApprovalCard';
import { BulkApproveDialog } from './BulkApproveDialog';
import { DecisionDialog, type DecisionMode } from './DecisionDialog';
import styles from '../ApprovalQueue.module.scss';

export interface QueueViewProps {
  readonly requests: readonly ApprovalRequestDto[];
}

const APPROVE_AS_PROPOSED: ApprovalDecisionDto = {
  decision: 'approved',
  reason: null,
  modifiedQuantity: null,
  modifiedLimitPrice: null,
};

export function QueueView({ requests }: QueueViewProps): ReactElement {
  const nowMs = useNow();
  const decide = useDecideApproval();
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [dialog, setDialog] = useState<{ id: string; mode: DecisionMode } | null>(null);
  const [isBulkOpen, setBulkOpen] = useState(false);

  const pending = requests.filter((request) => request.status === 'pending');
  const decided = requests.filter((request) => request.status !== 'pending');
  const selectedRequests = pending.filter((request) => selected.includes(request.approvalId));
  const dialogRequest = requests.find((request) => request.approvalId === dialog?.id);

  const submit = (approvalId: string, decision: ApprovalDecisionDto): void => {
    decide.mutate(
      { approvalId, decision },
      {
        onSettled: () => {
          setSelected((current) => current.filter((id) => id !== approvalId));
        },
      },
    );
  };

  const approveAll = (reason: string | null): void => {
    selectedRequests.forEach((request) => {
      submit(request.approvalId, { ...APPROVE_AS_PROPOSED, reason });
    });
    setBulkOpen(false);
    setSelected([]);
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <Badge variant={pending.length > 0 ? 'warning' : 'neutral'}>
            {pending.length === 1 ? '1 awaiting you' : `${String(pending.length)} awaiting you`}
          </Badge>
          {decide.isError && (
            <span className={styles.meta}>
              Could not record that decision: {decide.error.message}
            </span>
          )}
        </span>
        <span className={styles.inline}>
          <span className={styles.meta}>
            {selected.length === 0
              ? 'Select orders to approve several at once'
              : `${String(selected.length)} selected`}
          </span>
          <Button
            variant="secondary"
            isDisabled={selected.length < 2 || decide.isPending}
            onPress={() => {
              setBulkOpen(true);
            }}
          >
            Approve selected
          </Button>
        </span>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          title="Nothing is waiting for you"
          description="Orders that need your decision before they are placed appear here."
        />
      ) : (
        <ul className={styles.page}>
          {pending.map((request) => (
            <ApprovalCard
              key={request.approvalId}
              request={request}
              nowMs={nowMs}
              isSelected={selected.includes(request.approvalId)}
              isBusy={decide.isPending}
              onSelect={(isSelected) => {
                setSelected((current) =>
                  isSelected
                    ? [...current, request.approvalId]
                    : current.filter((id) => id !== request.approvalId),
                );
              }}
              onApprove={() => {
                if (request.reasonRequired) {
                  setDialog({ id: request.approvalId, mode: 'approve' });
                } else {
                  submit(request.approvalId, APPROVE_AS_PROPOSED);
                }
              }}
              onModify={() => {
                setDialog({ id: request.approvalId, mode: 'modify' });
              }}
              onReject={() => {
                setDialog({ id: request.approvalId, mode: 'reject' });
              }}
            />
          ))}
        </ul>
      )}

      {decided.length > 0 && (
        <>
          <p className={styles.note}>Already decided</p>
          <ul className={styles.page}>
            {decided.map((request) => (
              <ApprovalCard
                key={request.approvalId}
                request={request}
                nowMs={nowMs}
                isSelected={false}
                isBusy={decide.isPending}
                onSelect={() => undefined}
                onApprove={() => undefined}
                onModify={() => undefined}
                onReject={() => {
                  setDialog({ id: request.approvalId, mode: 'reject' });
                }}
              />
            ))}
          </ul>
        </>
      )}

      {dialog !== null && dialogRequest !== undefined && (
        <DecisionDialog
          request={dialogRequest}
          mode={dialog.mode}
          isBusy={decide.isPending}
          onClose={() => {
            setDialog(null);
          }}
          onSubmit={(decision) => {
            submit(dialogRequest.approvalId, decision);
            setDialog(null);
          }}
        />
      )}

      {isBulkOpen && (
        <BulkApproveDialog
          requests={selectedRequests}
          isBusy={decide.isPending}
          onClose={() => {
            setBulkOpen(false);
          }}
          onConfirm={approveAll}
        />
      )}
    </div>
  );
}
