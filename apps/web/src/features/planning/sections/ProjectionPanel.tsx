import { AnalyticalChart, Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { moneyFromDto, useInflationAssumptions, useProjection } from '../../../data/api';
import type { ReportCurrencyDto } from '../../../data/schemas';
import { formatMoney } from '../../../shared/format';
import { BASE_CURRENCIES } from '../../../shared/types/currency';
import styles from '../Planning.module.scss';

interface Assumptions {
  readonly currency: ReportCurrencyDto;
  readonly monthlyContribution: string;
  readonly years: string;
  readonly expectedReturnPercent: string;
  readonly spreadPercent: string;
  readonly inflationPercent: string;
}

const LABELS: Readonly<Record<Exclude<keyof Assumptions, 'currency'>, string>> = {
  monthlyContribution: 'Monthly contribution',
  years: 'Years ahead',
  expectedReturnPercent: 'Expected yearly return (%)',
  spreadPercent: 'Cautious and hopeful spread (± %)',
  inflationPercent: 'Inflation (%)',
};

// UI spec 7.17 — adjust assumptions and see projected outcomes: three cases from today's portfolio
// value, in nominal terms and in today's money.
export function ProjectionPanel(): ReactElement {
  const projection = useProjection();
  const assumptions = useInflationAssumptions();
  const [form, setForm] = useState<Assumptions>({
    currency: 'USD',
    monthlyContribution: '1000',
    years: '10',
    expectedReturnPercent: '6',
    spreadPercent: '3',
    inflationPercent: '4',
  });
  const numbers = {
    years: Number(form.years),
    expectedReturnPercent: Number(form.expectedReturnPercent),
    spreadPercent: Number(form.spreadPercent),
    inflationPercent: Number(form.inflationPercent),
  };
  const problem = !/^\d+(\.\d{1,2})?$/.test(form.monthlyContribution)
    ? 'Enter a monthly contribution, such as 500.'
    : !Number.isInteger(numbers.years) || numbers.years < 1 || numbers.years > 50
      ? 'Years must be a whole number from 1 to 50.'
      : Object.values(numbers).some((value) => !Number.isFinite(value))
        ? 'Every assumption must be a number.'
        : null;
  const data = projection.data;
  // The saved inflation assumption for the projection currency's country (E-07; requirements 30).
  const country = { USD: 'US', INR: 'IN', GBP: 'GB', EUR: null }[form.currency];
  const saved = assumptions.data?.find((entry) => entry.config.country === country)?.config;

  return (
    <Card
      title="Projected outcomes"
      extra={<span className={styles.meta}>From today&apos;s portfolio value</span>}
    >
      <div className={styles.stack}>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Currency</span>
            <select
              className={styles.input}
              value={form.currency}
              onChange={(event) => {
                const next = BASE_CURRENCIES.find((code) => code === event.target.value);
                if (next !== undefined) setForm({ ...form, currency: next });
              }}
            >
              {BASE_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
          {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((key) => (
            <label key={key} className={styles.field}>
              <span className={styles.fieldLabel}>{LABELS[key]}</span>
              <input
                className={styles.input}
                inputMode="decimal"
                value={form[key]}
                onChange={(event) => {
                  setForm({ ...form, [key]: event.target.value });
                }}
              />
            </label>
          ))}
        </div>
        {saved !== undefined && String(saved.assumedAnnualPercent) !== form.inflationPercent && (
          <span className={styles.inline}>
            <span className={styles.meta}>
              Saved inflation assumption for {saved.country}: {saved.assumedAnnualPercent}% a year.
            </span>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => {
                setForm({ ...form, inflationPercent: String(saved.assumedAnnualPercent) });
              }}
            >
              Use it
            </Button>
          </span>
        )}
        {problem !== null && <p className={styles.warning}>{problem}</p>}
        {projection.isError && <p className={styles.warning}>{projection.error.message}</p>}
        <span className={styles.inline}>
          <Button
            isDisabled={problem !== null}
            isLoading={projection.isPending}
            onPress={() => {
              projection.mutate({
                currency: form.currency,
                monthlyContribution: form.monthlyContribution,
                ...numbers,
              });
            }}
          >
            Project
          </Button>
        </span>

        {data !== undefined && (
          <div className={styles.stack}>
            <AnalyticalChart
              preset="comparison-curves"
              data={{
                dates: data.dates,
                series: data.cases.map((item) => ({
                  name: `${item.name} (${String(item.returnPercent)}%)`,
                  values: item.values,
                })),
                baseline: Number(data.start.amount),
              }}
              height={280}
            />
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Case</th>
                    <th scope="col" className={styles.end}>
                      Yearly return
                    </th>
                    <th scope="col" className={styles.end}>
                      Value at the end
                    </th>
                    <th scope="col" className={styles.end}>
                      In today&apos;s money
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.cases.map((item) => (
                    <tr key={item.name}>
                      <th scope="row">{item.name}</th>
                      <td className={styles.end}>{item.returnPercent}%</td>
                      <td className={styles.end}>{formatMoney(moneyFromDto(item.final))}</td>
                      <td className={styles.end}>{formatMoney(moneyFromDto(item.finalReal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.meta}>
              Starts from {formatMoney(moneyFromDto(data.start))} and adds{' '}
              {formatMoney(moneyFromDto(data.contributed))} in total. The line across the chart is
              today&apos;s value. Returns compound monthly and are assumptions, not forecasts; costs
              and taxes are not deducted.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
