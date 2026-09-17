import type { ReactElement } from 'react';
import { useState } from 'react';

import { useRevertTaxRuleSet } from '../../../../data/api';
import type { TaxRuleSetConfigInput, TaxRuleSetEntryDto } from '../../../../data/schemas';
import { ConfigEntryList, VersionHistory } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { describeTaxRuleSet } from '../model/taxRulesDraft';
import { TaxRuleSetForm } from './TaxRuleSetForm';

// The schema has no transforms on the snapshot's editable fields, so the form gets a plain copy.
const asInput = (config: TaxRuleSetConfigInput): TaxRuleSetConfigInput => structuredClone(config);

export function TaxRulesView({
  entries,
}: {
  readonly entries: readonly TaxRuleSetEntryDto[];
}): ReactElement {
  const residence = entries.find((entry) => entry.config.isResidence) ?? entries[0];
  const [selected, setSelected] = useState<string>(residence?.config.country ?? '');
  const [resets, setResets] = useState(0);
  const revert = useRevertTaxRuleSet();
  const entry = entries.find((item) => item.config.country === selected) ?? residence;

  return (
    <div className={styles.layout}>
      <ConfigEntryList
        label="Tax rule sets"
        entries={entries.map((item) => ({
          id: item.config.country,
          title: item.config.isResidence
            ? `${item.config.country} (residence)`
            : item.config.country,
          subtitle: `${String(item.config.rules.length)} asset classes · v${String(item.versions[0]?.version ?? 1)}`,
          enabled: true,
          health: item.health,
        }))}
        selectedId={entry?.config.country ?? null}
        isBusy={false}
        onSelect={setSelected}
      />
      {entry !== undefined && (
        <div className={styles.page}>
          <TaxRuleSetForm
            key={`${entry.config.country}-${String(entry.versions[0]?.version ?? 0)}-${String(resets)}`}
            initial={asInput(entry.config)}
            onCancel={() => {
              setResets((count) => count + 1);
            }}
          />
          <VersionHistory
            key={entry.config.country}
            versions={entry.versions.map((version) => ({
              version: version.version,
              savedAt: version.savedAt,
              reason: version.reason,
              description: describeTaxRuleSet(asInput(version.snapshot)),
            }))}
            isBusy={revert.isPending}
            error={revert.isError ? revert.error.message : null}
            onRevert={(version, reason) => {
              revert.mutate({ id: entry.config.country, version, reason });
            }}
          />
        </div>
      )}
    </div>
  );
}
