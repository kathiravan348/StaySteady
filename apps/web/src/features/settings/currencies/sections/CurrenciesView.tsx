import type { ReactElement } from 'react';
import { useState } from 'react';

import { useRevertCurrencyConfig, useSaveCurrencyConfig } from '../../../../data/api';
import type {
  BaseCurrencyEntryDto,
  CurrencyConfigEntryDto,
  CurrencyConfigInput,
  ProviderConfigEntryDto,
} from '../../../../data/schemas';
import { ConfigEntryList, VersionHistory } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { describeCurrency } from '../model/currencyDraft';
import { BaseCurrencySection } from './BaseCurrencySection';
import { CurrencyForm } from './CurrencyForm';

const BASE = '__base__';

// Output and input shapes are the same (no transforms), so the form gets a plain copy.
const asInput = (config: CurrencyConfigInput): CurrencyConfigInput => structuredClone(config);

export function CurrenciesView({
  entries,
  base,
  providers,
}: {
  readonly entries: readonly CurrencyConfigEntryDto[];
  readonly base: BaseCurrencyEntryDto;
  readonly providers: readonly ProviderConfigEntryDto[];
}): ReactElement {
  const [selected, setSelected] = useState<string>(BASE);
  // Bumped to throw away unsaved edits: the form is keyed on it, so a new key starts it fresh.
  const [resets, setResets] = useState(0);
  const toggle = useSaveCurrencyConfig();
  const revert = useRevertCurrencyConfig();
  const entry = entries.find((item) => item.config.currency === selected);
  const baseCurrency = base.config.currency;

  const providerName = (id: string): string =>
    providers.find((item) => item.config.providerId === id)?.config.name ?? id;
  const fxSources = providers
    .filter((item) => item.config.coverage.dataKinds.includes('fx'))
    .map((item) => ({
      value: item.config.providerId,
      label: item.config.enabled ? item.config.name : `${item.config.name} (disabled)`,
    }));
  const sourceOptions = (config: CurrencyConfigInput): { value: string; label: string }[] => {
    const named = [config.rateSourceId, config.fallbackSourceId].filter(
      (id): id is string => id !== null && !fxSources.some((option) => option.value === id),
    );
    return [
      ...fxSources,
      ...named.map((id) => ({ value: id, label: `${providerName(id)} (no FX data)` })),
    ];
  };

  return (
    <div className={styles.layout}>
      <div className={styles.stack}>
        <button
          type="button"
          className={styles.link}
          aria-current={selected === BASE ? 'true' : undefined}
          onClick={() => {
            setSelected(BASE);
          }}
        >
          Base currency: {baseCurrency}
        </button>
        <ConfigEntryList
          label="Currencies"
          entries={entries.map((item) => ({
            id: item.config.currency,
            title:
              item.config.currency === baseCurrency
                ? `${item.config.currency} (base)`
                : item.config.currency,
            subtitle: `${providerName(item.config.rateSourceId)} · ${String(item.config.conversionCostBps)} bps · stale after ${String(item.config.maxRateAgeMinutes)} min · v${String(item.versions[0]?.version ?? 1)}`,
            enabled: item.config.enabled,
            health: item.health,
          }))}
          selectedId={selected}
          isBusy={toggle.isPending}
          onSelect={setSelected}
          onToggleEnabled={(id, enabled) => {
            const target = entries.find((item) => item.config.currency === id);
            if (target === undefined) return;
            toggle.mutate({
              isNew: false,
              id,
              config: { ...asInput(target.config), enabled },
              reason: `${enabled ? 'Enabled' : 'Disabled'} from the currency list.`,
            });
          }}
        />
        {toggle.isError && <p className={styles.warning}>{toggle.error.message}</p>}
      </div>

      <div className={styles.page}>
        {selected === BASE || entry === undefined ? (
          <BaseCurrencySection
            entry={base}
            currencies={entries}
            resets={resets}
            onReset={() => {
              setResets((count) => count + 1);
            }}
          />
        ) : (
          <>
            <CurrencyForm
              key={`${entry.config.currency}-${String(entry.versions[0]?.version ?? 0)}-${String(resets)}`}
              initial={asInput(entry.config)}
              baseCurrency={baseCurrency}
              sourceOptions={sourceOptions(entry.config)}
              onCancel={() => {
                setResets((count) => count + 1);
              }}
            />
            <VersionHistory
              key={entry.config.currency}
              versions={entry.versions.map((version) => ({
                version: version.version,
                savedAt: version.savedAt,
                reason: version.reason,
                description: describeCurrency(asInput(version.snapshot), providerName),
              }))}
              isBusy={revert.isPending}
              error={revert.isError ? revert.error.message : null}
              onRevert={(version, reason) => {
                revert.mutate({ id: entry.config.currency, version, reason });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
