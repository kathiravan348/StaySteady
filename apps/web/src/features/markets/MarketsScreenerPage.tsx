// Markets Screener screen (UI spec 8.3; Open Question 11).
// Multi-factor screening across fundamental ratios, technical signals, and compliance restrictions.

import { useState } from 'react';
import type { ReactElement } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';

import { useScreenerPresets, useScreenerSearch } from '../../data/api/screenerQueries';
import type { ScreenerFilterCriteria, ScreenerPreset } from '../../data/schemas/screener';
import { PageShell } from '../../shell/PageShell';
import styles from './screener/Screener.module.scss';
import { ScreenerFiltersPanel } from './screener/sections/ScreenerFiltersPanel';
import { ScreenerMetricsSummary } from './screener/sections/ScreenerMetricsSummary';
import { ScreenerPresetsBar } from './screener/sections/ScreenerPresetsBar';
import { ScreenerResultsTable } from './screener/sections/ScreenerResultsTable';

const DEFAULT_CRITERIA: ScreenerFilterCriteria = {
  query: '',
  markets: [],
  assetClasses: [],
  sectors: [],
  minPe: null,
  maxPe: null,
  minPb: null,
  maxPb: null,
  minRoe: null,
  minDivYield: null,
  minMarketCap: null,
  minRsi14: null,
  maxRsi14: null,
  minSma200Dist: null,
  complianceOnly: false,
  automationOnly: false,
  sortBy: 'marketCap',
  sortOrder: 'desc',
  page: 1,
  pageSize: 10,
};

export function MarketsScreenerPage(): ReactElement {
  const [criteria, setCriteria] = useState<ScreenerFilterCriteria>(DEFAULT_CRITERIA);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const {
    data: presets,
    isLoading: presetsLoading,
    isError: presetsError,
    error: presetsErr,
    refetch: refetchPresets,
  } = useScreenerPresets();

  const {
    data: searchResult,
    isLoading: searchLoading,
    isError: searchError,
    error: searchErr,
    refetch: refetchSearch,
  } = useScreenerSearch(criteria);

  const handleSelectPreset = (preset: ScreenerPreset) => {
    setActivePresetId(preset.id);
    setCriteria({
      ...preset.filters,
      page: 1,
    });
  };

  const handleFilterChange = (newFilters: ScreenerFilterCriteria) => {
    setActivePresetId(null);
    setCriteria(newFilters);
  };

  const handleResetFilters = () => {
    setActivePresetId(null);
    setCriteria(DEFAULT_CRITERIA);
  };

  const handleSortChange = (sortBy: string) => {
    setCriteria((prev) => {
      const isSame = prev.sortBy === sortBy;
      const nextOrder = isSame && prev.sortOrder === 'desc' ? 'asc' : 'desc';
      return {
        ...prev,
        sortBy,
        sortOrder: nextOrder,
        page: 1,
      };
    });
  };

  const handlePageChange = (newPage: number) => {
    setCriteria((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  if (presetsLoading || searchLoading) {
    return (
      <PageShell
        title="Instrument Screener"
        description="Filter instruments by fundamental ratios, technical signals, and compliance restrictions"
        breadcrumbs={[
          { label: 'Overview', to: '/overview' },
          { label: 'Markets', to: '/markets/watchlists' },
          { label: 'Screener' },
        ]}
      >
        <LoadingState layout="cards" count={3} />
      </PageShell>
    );
  }

  if (presetsError || searchError || !presets || !searchResult) {
    return (
      <PageShell
        title="Instrument Screener"
        description="Filter instruments by fundamental ratios, technical signals, and compliance restrictions"
        breadcrumbs={[
          { label: 'Overview', to: '/overview' },
          { label: 'Markets', to: '/markets/watchlists' },
          { label: 'Screener' },
        ]}
      >
        <ErrorState
          title="Unable to load screener data"
          message={
            presetsErr?.message ??
            searchErr?.message ??
            'An error occurred while fetching universe instruments or strategy presets.'
          }
          onRetry={() => {
            void refetchPresets();
            void refetchSearch();
          }}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Instrument Screener"
      description="Filter instruments by fundamental ratios, technical signals, and compliance restrictions"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Markets', to: '/markets/watchlists' },
        { label: 'Screener' },
      ]}
    >
      <div className={styles.page}>
        <ScreenerPresetsBar
          presets={presets}
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
        />

        <ScreenerMetricsSummary summary={searchResult.summary} />

        <ScreenerFiltersPanel
          filters={criteria}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {searchResult.rows.length === 0 && criteria.query === '' && !criteria.complianceOnly ? (
          <EmptyState
            title="No instruments found"
            description="Adjust your screening filters or select a preset to search the universe."
          />
        ) : (
          <ScreenerResultsTable
            rows={searchResult.rows}
            total={searchResult.total}
            page={searchResult.page}
            pageSize={searchResult.pageSize}
            totalPages={searchResult.totalPages}
            sortBy={criteria.sortBy}
            sortOrder={criteria.sortOrder}
            onSortChange={handleSortChange}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </PageShell>
  );
}
