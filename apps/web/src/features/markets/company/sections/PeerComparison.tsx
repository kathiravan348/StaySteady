// Peer comparison on the Ratios tab (UI spec 20.1): the company and its industry peers on the same
// measures, same basis, side by side. Loads and fails on its own so the ratios above stay readable.

import { Card, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useInstruments, usePeerFundamentalMeasures } from '../../../../data/api';
import type { FundamentalMeasuresDto, StatementBasis } from '../../../../data/schemas';
import { companyResearchPath } from '../../../../routes/routes';
import styles from '../CompanyResearch.module.scss';
import { GROUP_TITLE, MEASURE_GROUPS } from '../model/ratioRows';
import { formatMeasure } from './StandingSection';

interface PeerComparisonProps {
  readonly company: FundamentalMeasuresDto;
  readonly basis: StatementBasis;
}

export function PeerComparison({ company, basis }: PeerComparisonProps): ReactElement {
  const instruments = useInstruments();
  const peerIds = company.peerSymbols.flatMap((symbol) => {
    const match = instruments.data?.find((item) => item.symbol === symbol);
    return match === undefined ? [] : [String(match.id)];
  });
  const peers = usePeerFundamentalMeasures(peerIds, basis);

  const title = 'Compared with peers';
  if (instruments.isError || peers.error !== null) {
    return (
      <Card title={title}>
        <ErrorState
          title="Peer measures unavailable"
          message={instruments.error?.message ?? peers.error?.message ?? 'Unknown error'}
          onRetry={() => {
            void instruments.refetch();
            peers.refetch();
          }}
        />
      </Card>
    );
  }
  if (instruments.data === undefined || peers.isPending) {
    return (
      <Card title={title}>
        <LoadingState layout="table" count={4} />
      </Card>
    );
  }
  if (peers.peers.length === 0) {
    return (
      <Card title={title}>
        <p className={styles.description}>
          {company.industryName === null
            ? 'This company is not classified into an industry, so it has no peer group.'
            : `No other company in ${company.industryName} has ${basis} statements collected yet, so there is nothing to compare with.`}
        </p>
      </Card>
    );
  }

  const columns = [company, ...peers.peers];
  const measureFor = (
    entry: FundamentalMeasuresDto,
    id: string,
  ): FundamentalMeasuresDto['measures'][number] | undefined =>
    entry.measures.find((measure) => measure.id === id);

  return (
    <Card title={title}>
      <div className={styles.stack}>
        {peers.peers.length < 2 && (
          <span className={styles.evidence}>
            Only one peer in {company.industryName ?? 'this industry'} has statements collected; the
            comparison widens as more are added.
          </span>
        )}
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Measure</th>
                {columns.map((entry, index) => (
                  <th key={entry.symbol} scope="col" className={styles.numberCell}>
                    {index === 0 ? (
                      <span>{entry.symbol} (this company)</span>
                    ) : (
                      <Link to={companyResearchPath(entry.instrumentId)}>{entry.symbol}</Link>
                    )}
                    <span className={styles.meta}> to {entry.latestPeriod}</span>
                  </th>
                ))}
              </tr>
            </thead>
            {MEASURE_GROUPS.map((group) => {
              const rows = company.measures.filter((measure) => measure.group === group);
              if (rows.length === 0) return null;
              return (
                <tbody key={group}>
                  <tr className={styles.totalRow}>
                    <th scope="colgroup" colSpan={columns.length + 1}>
                      {GROUP_TITLE[group]}
                    </th>
                  </tr>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <th scope="row">{row.label}</th>
                      {columns.map((entry) => {
                        const measure = measureFor(entry, row.id);
                        return (
                          <td key={entry.symbol} className={styles.numberCell}>
                            {measure === undefined ? '—' : formatMeasure(measure, measure.value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
        <span className={styles.meta}>
          Every column on the {basis} basis, each to its own latest reported year.
        </span>
      </div>
    </Card>
  );
}
