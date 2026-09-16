import { AnalyticalChart, Badge, Card, KeyValuePair, UsageMeter } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { moneyFromDto } from '../../../../data/api/mappers';
import type { BacktestDetailDto } from '../../../../data/schemas';
import {
  formatMoney,
  formatSignedMoney,
  formatSignedPercent,
  pluralize,
} from '../../../../shared/format';
import styles from '../BacktestResults.module.scss';

export interface DetailTabProps {
  readonly detail: BacktestDetailDto;
}

// UI spec 7.10 — total fees, slippage and conversion costs, and what they took from the return.
export function CostsTab({ detail }: DetailTabProps): ReactElement {
  const { costs } = detail;
  const code = { showCurrency: 'code' } as const;
  const donut = useMemo(
    () => ({
      items: [
        { name: 'Fees', value: Number(costs.fees.amount) },
        { name: 'Slippage', value: Number(costs.slippage.amount) },
        { name: 'Currency conversion', value: Number(costs.currencyConversion.amount) },
      ],
    }),
    [costs],
  );

  return (
    <div className={styles.cardGrid}>
      <Card title="Where the costs went">
        <AnalyticalChart preset="allocation-donut" data={donut} height={240} />
      </Card>
      <Card title="Costs against the return">
        <div className={styles.keyValues}>
          <KeyValuePair
            label="Gross return"
            value={formatSignedMoney(moneyFromDto(costs.grossReturn))}
            isMono
          />
          <KeyValuePair
            label="Total costs"
            value={formatMoney(moneyFromDto(costs.total), code)}
            isMono
          />
          <KeyValuePair
            label="Net return"
            value={formatSignedMoney(moneyFromDto(costs.netReturn))}
            isMono
          />
          <KeyValuePair label="Fees" value={formatMoney(moneyFromDto(costs.fees), code)} isMono />
          <KeyValuePair
            label="Slippage"
            value={formatMoney(moneyFromDto(costs.slippage), code)}
            isMono
          />
          <KeyValuePair
            label="Currency conversion"
            value={formatMoney(moneyFromDto(costs.currencyConversion), code)}
            isMono
          />
          <KeyValuePair
            label="Average cost per trade"
            value={formatMoney(moneyFromDto(costs.averageCostPerTrade), code)}
            isMono
          />
        </div>
        <UsageMeter
          label="Costs as a share of gross return"
          used={Number(costs.total.amount)}
          limit={Math.max(Number(costs.grossReturn.amount), Number(costs.total.amount))}
          formatValue={(value) => `${value.toLocaleString('en', { maximumFractionDigits: 0 })}`}
          warningAt={0.2}
          criticalAt={0.4}
          description={`Costs took ${costs.costsAsPercentOfGross.toFixed(2)}% of the gross return.`}
        />
      </Card>
    </div>
  );
}

// UI spec 7.10 — out-of-sample comparison, parameter sensitivity and outlier dependency.
export function ValidationTab({ detail }: DetailTabProps): ReactElement {
  const { validation } = detail;
  const degradation = validation.inSample.returnPercent - validation.outOfSample.returnPercent;

  return (
    <div className={styles.cardGrid}>
      <Card
        title="In-sample against out-of-sample"
        extra={
          <Badge variant={degradation > 20 ? 'critical' : degradation > 8 ? 'warning' : 'positive'}>
            {degradation > 20 ? 'Much weaker later' : degradation > 8 ? 'Weaker later' : 'Holds up'}
          </Badge>
        }
      >
        <div className={styles.keyValues}>
          <KeyValuePair
            label={`Earlier period (${validation.inSample.startDate} to ${validation.inSample.endDate})`}
            value={`${formatSignedPercent(validation.inSample.returnPercent)} · Sharpe ${validation.inSample.sharpeRatio.toFixed(2)}`}
            isMono
          />
          <KeyValuePair
            label={`Later period (${validation.outOfSample.startDate} to ${validation.outOfSample.endDate})`}
            value={`${formatSignedPercent(validation.outOfSample.returnPercent)} · Sharpe ${validation.outOfSample.sharpeRatio.toFixed(2)}`}
            isMono
          />
        </div>
        <p className={styles.meta}>
          The settings were chosen with the earlier period in view, so the later period is the more
          honest test.
        </p>
      </Card>

      <Card title="Parameter sensitivity">
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Setting</th>
                <th scope="col" className={styles.numeric}>
                  Total return
                </th>
              </tr>
            </thead>
            <tbody>
              {validation.sensitivity.map((point) => (
                <tr key={point.value}>
                  <th scope="row">
                    {point.value}
                    {point.isChosen && (
                      <>
                        {' '}
                        <Badge variant="info">Chosen</Badge>
                      </>
                    )}
                  </th>
                  <td
                    className={`${styles.numeric} ${point.returnPercent >= 0 ? styles.positive : styles.negative}`}
                  >
                    {formatSignedPercent(point.returnPercent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.meta}>
          A result that collapses when the setting moves slightly was probably fitted to the past.
        </p>
      </Card>

      <Card title="Outlier dependency">
        <div className={styles.keyValues}>
          <KeyValuePair
            label={`Profit from the top ${pluralize(validation.topTradeCount, 'trade')}`}
            value={`${validation.topTradeSharePercent.toFixed(1)}% of total profit`}
            isMono
          />
          <KeyValuePair
            label="Trades carrying half the profit"
            value={pluralize(validation.tradesNeededForHalfProfit, 'trade')}
            isMono
          />
        </div>
        <UsageMeter
          label="Share of profit from the top trades"
          used={validation.topTradeSharePercent}
          limit={100}
          formatValue={(value) => `${value.toFixed(0)}%`}
          warningAt={0.3}
          criticalAt={0.4}
          description="The more the profit sits in a few trades, the less the average result means."
        />
      </Card>
    </div>
  );
}
