// For a fund, ownership means what it owns (decision 51): the largest holdings and the sector
// weights, with a mark against holdings the owner also holds directly. Renders nothing for an
// instrument that is not a fund, because that is a fact about it rather than a gap.

import { AnalyticalChart, Badge, Card, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import {
  useFundLookThrough,
  useInstrumentClassification,
  usePortfolioHoldings,
} from '../../../../data/api';
import { moneyFromDto } from '../../../../data/api/mappers';
import { formatIsoDate, formatMoney } from '../../../../shared/format';
import { companyResearchPath } from '../../../../routes/routes';
import styles from '../CompanyResearch.module.scss';
import type { CompanySectionProps } from './ProfileSection';

export function FundLookThroughSection({ instrumentId }: CompanySectionProps): ReactElement | null {
  const classification = useInstrumentClassification(instrumentId);
  const lookThrough = useFundLookThrough(instrumentId);
  const holdings = usePortfolioHoldings();
  const title = 'What the fund holds';

  if (classification.data !== undefined && classification.data.kind !== 'fund') return null;

  if (lookThrough.isError || holdings.isError) {
    return (
      <Card title={title}>
        <ErrorState
          title="Fund holdings unavailable"
          message={lookThrough.error?.message ?? holdings.error?.message ?? 'Unknown error'}
          onRetry={() => {
            void lookThrough.refetch();
            void holdings.refetch();
          }}
        />
      </Card>
    );
  }
  if (lookThrough.data === undefined || holdings.data === undefined) {
    return (
      <Card title={title}>
        <LoadingState layout="table" count={5} />
      </Card>
    );
  }
  const fund = lookThrough.data.lookThrough;
  if (fund === null) return null;

  const held = new Set(holdings.data.map((holding) => String(holding.instrumentId)));

  return (
    <Card title={title}>
      <div className={styles.stack}>
        <div className={styles.inline}>
          <span>{fund.fundName}</span>
          {fund.indexTracked !== null && <Badge variant="neutral">{fund.indexTracked}</Badge>}
          <span className={styles.meta}>{String(fund.holdingCount)} holdings</span>
          {fund.assetsUnderManagement !== null && (
            <span className={styles.meta}>
              {formatMoney(moneyFromDto(fund.assetsUnderManagement), { compact: true })} managed
            </span>
          )}
        </div>
        <div className={styles.columns}>
          <ul className={styles.list}>
            {fund.topHoldings.map((holding) => (
              <li key={holding.symbol} className={styles.splitRow}>
                <span className={styles.splitLabel}>
                  {holding.instrumentId === null ? (
                    holding.name
                  ) : (
                    <Link to={companyResearchPath(String(holding.instrumentId))}>
                      {holding.name}
                    </Link>
                  )}
                  {holding.instrumentId !== null && held.has(String(holding.instrumentId)) && (
                    <>
                      {' '}
                      <Badge variant="info">Also held directly</Badge>
                    </>
                  )}
                </span>
                <span className={styles.splitValue}>{holding.weightPercent.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
          <AnalyticalChart
            preset="allocation-donut"
            data={{
              items: fund.sectorWeights.map((weight) => ({
                name: weight.sectorName,
                value: weight.weightPercent,
              })),
            }}
            height={240}
          />
        </div>
        <span className={styles.evidence}>{fund.note}</span>
        <span className={styles.meta}>
          {fund.source}, to {formatIsoDate(fund.asOf)}.
        </span>
      </div>
    </Card>
  );
}
