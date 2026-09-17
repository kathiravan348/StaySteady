// Filter configuration controls panel for S-26 Markets Screener (UI spec 8.3; Open Question 11).

import type { FC } from 'react';
import { Button, Card } from '@staysteady/ui';

import type { ScreenerFilterCriteria } from '../../../../data/schemas/screener';
import styles from '../Screener.module.scss';

export interface ScreenerFiltersPanelProps {
  readonly filters: ScreenerFilterCriteria;
  readonly onChange: (filters: ScreenerFilterCriteria) => void;
  readonly onReset: () => void;
  // Sector values present in the universe, from the classification taxonomy (decision 49).
  readonly sectorOptions: readonly string[];
}

export const ScreenerFiltersPanel: FC<ScreenerFiltersPanelProps> = ({
  filters,
  onChange,
  onReset,
  sectorOptions,
}) => {
  const updateField = <K extends keyof ScreenerFilterCriteria>(
    field: K,
    value: ScreenerFilterCriteria[K],
  ) => {
    onChange({
      ...filters,
      [field]: value,
      page: 1, // reset page on filter change
    });
  };

  return (
    <Card title="Factor & Safety Screening Filters">
      <div className={styles.stack}>
        <div className={styles.gridFilters}>
          {/* Query */}
          <div className={styles.field}>
            <label htmlFor="scr-filter-query" className={styles.fieldLabel}>
              Symbol or Company
            </label>
            <input
              id="scr-filter-query"
              className={styles.input}
              type="search"
              placeholder="e.g. AAPL, Reliance, Tech"
              value={filters.query}
              onChange={(e) => updateField('query', e.target.value)}
            />
          </div>

          {/* Market */}
          <div className={styles.field}>
            <label htmlFor="scr-filter-market" className={styles.fieldLabel}>
              Market Universe
            </label>
            <select
              id="scr-filter-market"
              className={styles.select}
              value={filters.markets[0] ?? ''}
              onChange={(e) => updateField('markets', e.target.value ? [e.target.value] : [])}
            >
              <option value="">All Markets (US & IN)</option>
              <option value="us-nasdaq">US (NASDAQ)</option>
              <option value="us-nyse">US (NYSE)</option>
              <option value="in-nse">India (NSE)</option>
            </select>
          </div>

          {/* Asset Class */}
          <div className={styles.field}>
            <label htmlFor="scr-filter-asset-class" className={styles.fieldLabel}>
              Asset Class
            </label>
            <select
              id="scr-filter-asset-class"
              className={styles.select}
              value={filters.assetClasses[0] ?? ''}
              onChange={(e) =>
                updateField(
                  'assetClasses',
                  e.target.value ? [e.target.value as 'EQUITY' | 'ETF'] : [],
                )
              }
            >
              <option value="">All Classes (Equities & ETFs)</option>
              <option value="EQUITY">Common Equities</option>
              <option value="ETF">Index & Sector ETFs</option>
            </select>
          </div>

          {/* Sector */}
          <div className={styles.field}>
            <label htmlFor="scr-filter-sector" className={styles.fieldLabel}>
              Sector
            </label>
            <select
              id="scr-filter-sector"
              className={styles.select}
              value={filters.sectors[0] ?? ''}
              disabled={sectorOptions.length === 0}
              onChange={(e) => updateField('sectors', e.target.value ? [e.target.value] : [])}
            >
              <option value="">All sectors and asset classes</option>
              {sectorOptions.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>

          {/* Max P/E */}
          <div className={styles.field}>
            <label htmlFor="scr-filter-max-pe" className={styles.fieldLabel}>
              Max P/E Ratio
            </label>
            <input
              id="scr-filter-max-pe"
              className={styles.input}
              type="number"
              placeholder="No limit"
              value={filters.maxPe ?? ''}
              onChange={(e) => updateField('maxPe', e.target.value ? Number(e.target.value) : null)}
            />
          </div>

          {/* Min ROE */}
          <div className={styles.field}>
            <label htmlFor="scr-filter-min-roe" className={styles.fieldLabel}>
              Min ROE (%)
            </label>
            <input
              id="scr-filter-min-roe"
              className={styles.input}
              type="number"
              placeholder="e.g. 15"
              value={filters.minRoe ?? ''}
              onChange={(e) =>
                updateField('minRoe', e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>

          {/* Min Div Yield */}
          <div className={styles.field}>
            <label htmlFor="scr-filter-min-div" className={styles.fieldLabel}>
              Min Div Yield (%)
            </label>
            <input
              id="scr-filter-min-div"
              className={styles.input}
              type="number"
              step="0.1"
              placeholder="e.g. 2.0"
              value={filters.minDivYield ?? ''}
              onChange={(e) =>
                updateField('minDivYield', e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>

          {/* Min 200 SMA Dist */}
          <div className={styles.field}>
            <label htmlFor="scr-filter-min-sma" className={styles.fieldLabel}>
              Min 200 SMA Dist (%)
            </label>
            <input
              id="scr-filter-min-sma"
              className={styles.input}
              type="number"
              placeholder="e.g. 0"
              value={filters.minSma200Dist ?? ''}
              onChange={(e) =>
                updateField('minSma200Dist', e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>

          {/* Max RSI-14 */}
          <div className={styles.field}>
            <label htmlFor="scr-filter-max-rsi" className={styles.fieldLabel}>
              Max RSI-14
            </label>
            <input
              id="scr-filter-max-rsi"
              className={styles.input}
              type="number"
              placeholder="e.g. 70"
              value={filters.maxRsi14 ?? ''}
              onChange={(e) =>
                updateField('maxRsi14', e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>
        </div>

        <div className={styles.inlineBetween}>
          <div className={styles.inline}>
            <label
              htmlFor="scr-filter-compliance"
              className={styles.inline}
              style={{ cursor: 'pointer' }}
            >
              <input
                id="scr-filter-compliance"
                type="checkbox"
                checked={filters.complianceOnly}
                onChange={(e) => updateField('complianceOnly', e.target.checked)}
              />
              <span className={styles.fieldLabel} style={{ color: 'var(--text-primary)' }}>
                ⚖️ Unrestricted Only (Exclude S-33 Blackouts / Prohibitions)
              </span>
            </label>

            <label
              htmlFor="scr-filter-automation"
              className={styles.inline}
              style={{ cursor: 'pointer' }}
            >
              <input
                id="scr-filter-automation"
                type="checkbox"
                checked={filters.automationOnly}
                onChange={(e) => updateField('automationOnly', e.target.checked)}
              />
              <span className={styles.fieldLabel} style={{ color: 'var(--text-primary)' }}>
                🔐 Live Automation Permitted (S-29 Enabled)
              </span>
            </label>
          </div>

          <Button variant="secondary" size="sm" onPress={onReset}>
            Reset Filters
          </Button>
        </div>
      </div>
    </Card>
  );
};
