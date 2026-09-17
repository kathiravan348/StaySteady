import type { ReactElement } from 'react';
import { useState } from 'react';

import { useRevertInflationAssumption, useRevertOperatingPolicy } from '../../../../data/api';
import type {
  InflationAssumptionConfigInput,
  InflationAssumptionEntryDto,
  InflationHistoryDto,
  OperatingPolicyConfigInput,
  OperatingPolicyEntryDto,
} from '../../../../data/schemas';
import { ConfigEntryList, VersionHistory } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import {
  COUNTRY_LABEL,
  describeInflation,
  describeOperatingPolicy,
} from '../model/assumptionsDraft';
import { InflationAssumptionForm } from './InflationAssumptionForm';
import { OperatingPolicyForm } from './OperatingPolicyForm';

const POLICY = '__policy__';

// Output and input shapes are the same (no transforms), so the forms get plain copies.
const asInflationInput = (config: InflationAssumptionConfigInput): InflationAssumptionConfigInput =>
  structuredClone(config);
const asPolicyInput = (config: OperatingPolicyConfigInput): OperatingPolicyConfigInput =>
  structuredClone(config);

export interface AssumptionsViewProps {
  readonly inflation: readonly InflationAssumptionEntryDto[];
  readonly policy: OperatingPolicyEntryDto;
  readonly history: InflationHistoryDto;
}

export function AssumptionsView({
  inflation,
  policy,
  history,
}: AssumptionsViewProps): ReactElement {
  const [selected, setSelected] = useState<string>(POLICY);
  // Bumped to throw away unsaved edits: forms are keyed on it.
  const [resets, setResets] = useState(0);
  const revertInflation = useRevertInflationAssumption();
  const revertPolicy = useRevertOperatingPolicy();
  const entry = inflation.find((item) => item.config.country === selected);
  const discard = (): void => {
    setResets((count) => count + 1);
  };

  return (
    <div className={styles.layout}>
      <div className={styles.stack}>
        <button
          type="button"
          className={styles.link}
          aria-current={selected === POLICY ? 'true' : undefined}
          onClick={() => {
            setSelected(POLICY);
          }}
        >
          Operating policy: cost budget, counterparties, export
        </button>
        <ConfigEntryList
          label="Inflation assumptions"
          entries={inflation.map((item) => ({
            id: item.config.country,
            title: COUNTRY_LABEL[item.config.country],
            subtitle: `${item.config.assumedAnnualPercent.toFixed(1)}% a year · v${String(item.versions[0]?.version ?? 1)}`,
            enabled: true,
            health: item.health,
          }))}
          selectedId={selected}
          isBusy={false}
          onSelect={setSelected}
        />
      </div>

      <div className={styles.page}>
        {entry === undefined ? (
          <>
            {policy.health.status !== 'healthy' && (
              <p className={styles.warning}>{policy.health.summary}</p>
            )}
            <OperatingPolicyForm
              key={`policy-${String(policy.versions[0]?.version ?? 0)}-${String(resets)}`}
              initial={asPolicyInput(policy.config)}
              costs={policy.costs}
              onCancel={discard}
            />
            <VersionHistory
              versions={policy.versions.map((version) => ({
                version: version.version,
                savedAt: version.savedAt,
                reason: version.reason,
                description: describeOperatingPolicy(asPolicyInput(version.snapshot)),
              }))}
              isBusy={revertPolicy.isPending}
              error={revertPolicy.isError ? revertPolicy.error.message : null}
              onRevert={(version, reason) => {
                revertPolicy.mutate({ id: policy.config.id, version, reason });
              }}
            />
          </>
        ) : (
          <>
            <InflationAssumptionForm
              key={`${entry.config.country}-${String(entry.versions[0]?.version ?? 0)}-${String(resets)}`}
              initial={asInflationInput(entry.config)}
              recorded={
                history.find((series) => series.country === entry.config.country)?.years ?? []
              }
              onCancel={discard}
            />
            <VersionHistory
              key={entry.config.country}
              versions={entry.versions.map((version) => ({
                version: version.version,
                savedAt: version.savedAt,
                reason: version.reason,
                description: describeInflation(asInflationInput(version.snapshot)),
              }))}
              isBusy={revertInflation.isPending}
              error={revertInflation.isError ? revertInflation.error.message : null}
              onRevert={(version, reason) => {
                revertInflation.mutate({ id: entry.config.country, version, reason });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
