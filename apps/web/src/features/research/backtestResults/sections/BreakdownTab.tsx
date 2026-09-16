import { AnalyticalChart, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { moneyFromDto } from '../../../../data/api/mappers';
import type { BacktestDetailDto } from '../../../../data/schemas';
import { formatSignedMoney, formatSignedPercent } from '../../../../shared/format';
import styles from '../BacktestResults.module.scss';

export interface BreakdownTabProps {
  readonly detail: BacktestDetailDto;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// UI spec 7.10 — performance by year, market, instrument type and currency, plus monthly returns.
export function BreakdownTab({ detail }: BreakdownTabProps): ReactElement {
  const heatmap = useMemo(() => {
    const years = [...new Set(detail.monthlyReturns.map((item) => String(item.year)))].sort();
    return {
      years,
      months: MONTHS,
      data: detail.monthlyReturns.map((item): [number, number, number] => [
        item.month - 1,
        years.indexOf(String(item.year)),
        Number(item.returnPercent.toFixed(1)),
      ]),
    };
  }, [detail.monthlyReturns]);

  return (
    <div className={styles.tabBody}>
      <Card title="Monthly returns">
        <AnalyticalChart preset="monthly-returns-heatmap" data={heatmap} height={260} />
        <p className={styles.meta}>
          Each cell is that month&apos;s return; green months gained, red months lost.
        </p>
      </Card>
      <div className={styles.cardGrid}>
        {detail.breakdowns.map((group) => (
          <Card key={group.id} title={group.title}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">{group.title.replace('By ', '')}</th>
                    <th scope="col" className={styles.numeric}>
                      Trades
                    </th>
                    <th scope="col" className={styles.numeric}>
                      Return
                    </th>
                    <th scope="col" className={styles.numeric}>
                      Contribution
                    </th>
                    <th scope="col" className={styles.numeric}>
                      Win rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.key}>
                      <th scope="row">{row.label}</th>
                      <td className={styles.numeric}>{row.trades}</td>
                      <td
                        className={`${styles.numeric} ${row.returnPercent >= 0 ? styles.positive : styles.negative}`}
                      >
                        {formatSignedPercent(row.returnPercent)}
                      </td>
                      <td className={styles.numeric}>
                        {formatSignedMoney(moneyFromDto(row.contribution))}
                      </td>
                      <td className={styles.numeric}>{row.winRatePercent.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
