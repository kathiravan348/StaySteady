// Financials tab (UI spec 20.1): the three statements as reported, annual or quarterly,
// consolidated or standalone, with the change per line and the date each column was published.

import { AnalyticalChart, Badge, Card, ErrorState, LoadingState } from '@staysteady/ui';
import { Decimal } from 'decimal.js';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useFinancialStatements } from '../../../../data/api';
import { moneyFromDto } from '../../../../data/api/mappers';
import type { FinancialStatementDto, StatementBasis } from '../../../../data/schemas';
import type { StatementLine } from '../model/statementTables';
import { formatIsoDate, formatMoney, formatSignedPercent } from '../../../../shared/format';
import { ToggleGroup } from '../../../../shared/ui/ToggleGroup';
import styles from '../CompanyResearch.module.scss';
import { changePercent, periodsFor, STATEMENT_TABLES } from '../model/statementTables';
import type { CompanySectionProps } from './ProfileSection';

const PERIOD_TYPES = ['annual', 'quarter'] as const;
type PeriodType = (typeof PERIOD_TYPES)[number];
const PERIOD_LABEL: Readonly<Record<PeriodType, string>> = {
  annual: 'Annual',
  quarter: 'Quarterly',
};
const COLUMNS = 5;

// Charts plot numbers, so money converts once here, for display only, through decimal arithmetic
// rather than parseFloat (decision 4). The tables above keep the reported amounts as they are.
const billions = (amount: string): number => new Decimal(amount).dividedBy(1e9).toNumber();

function StatementTableView({
  title,
  periods,
  lines,
}: {
  readonly title: string;
  readonly periods: readonly FinancialStatementDto[];
  readonly lines: readonly StatementLine[];
}): ReactElement {
  return (
    <Card title={title}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Line</th>
              {periods.map((period) => (
                <th key={period.periodEnd} scope="col">
                  <span className={styles.stack}>
                    <span>{period.fiscalPeriod}</span>
                    <span className={styles.meta}>
                      to {formatIsoDate(period.periodEnd)} · published{' '}
                      {formatIsoDate(period.publishedOn)}
                    </span>
                  </span>
                </th>
              ))}
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const latest = periods[0];
              const previous = periods[1];
              const change =
                latest === undefined || previous === undefined
                  ? null
                  : changePercent(line.pick(latest).amount, line.pick(previous).amount);
              return (
                <tr key={line.id} className={line.isTotal === true ? styles.totalRow : undefined}>
                  <th scope="row">{line.label}</th>
                  {periods.map((period) => (
                    <td key={period.periodEnd} className={styles.numberCell}>
                      {formatMoney(moneyFromDto(line.pick(period)), { compact: true })}
                    </td>
                  ))}
                  <td className={styles.numberCell}>
                    {change === null ? '—' : formatSignedPercent(change)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function FinancialsTab({ instrumentId }: CompanySectionProps): ReactElement {
  const statements = useFinancialStatements(instrumentId);
  const [periodType, setPeriodType] = useState<PeriodType>('annual');
  const [basis, setBasis] = useState<StatementBasis>('consolidated');

  if (statements.isError) {
    return (
      <ErrorState
        title="Statements unavailable"
        message={statements.error.message}
        onRetry={() => {
          void statements.refetch();
        }}
      />
    );
  }
  if (statements.data === undefined) {
    return <LoadingState layout="table" count={6} />;
  }
  const reported = statements.data.statements;
  if (reported === null) {
    return (
      <Card title="Financial statements">
        <p className={styles.description}>{statements.data.unavailableReason}</p>
      </Card>
    );
  }

  const source = periodType === 'annual' ? reported.annual : reported.quarterly;
  const activeBasis = reported.basesAvailable.includes(basis) ? basis : 'consolidated';
  const periods = periodsFor(source, activeBasis, periodType, COLUMNS);
  const annual = periodsFor(reported.annual, activeBasis, 'annual', COLUMNS);
  const chartPeriods = [...annual].reverse();
  const restated = periods.find((period) => period.isRestated);

  return (
    <div className={styles.stack}>
      <div className={styles.inline}>
        <ToggleGroup
          label="Reporting period"
          options={PERIOD_TYPES}
          value={periodType}
          onChange={setPeriodType}
          formatOption={(option) => PERIOD_LABEL[option]}
        />
        {reported.basesAvailable.length > 1 && (
          <ToggleGroup
            label="Basis"
            options={reported.basesAvailable}
            value={activeBasis}
            onChange={setBasis}
            formatOption={(option) => (option === 'consolidated' ? 'Consolidated' : 'Standalone')}
          />
        )}
        <Badge variant="neutral">{reported.reportingCurrency}</Badge>
        <span className={styles.meta}>Year ends {reported.fiscalYearEnd}</span>
      </div>
      <p className={styles.evidence}>{reported.note}</p>
      {restated !== undefined && (
        <div className={styles.inline}>
          <Badge variant="negative">Restated</Badge>
          <span className={styles.evidence}>
            {restated.fiscalPeriod}: {restated.restatementNote}
          </span>
        </div>
      )}

      {STATEMENT_TABLES.map((table) => (
        <StatementTableView
          key={table.id}
          title={table.title}
          periods={periods}
          lines={table.lines}
        />
      ))}

      <Card title="Trends">
        <div className={styles.columns}>
          <AnalyticalChart
            preset="bar"
            data={{
              categories: chartPeriods.map((period) => period.fiscalPeriod),
              series: [
                {
                  name: 'Revenue',
                  values: chartPeriods.map((period) => billions(period.income.revenue.amount)),
                },
                {
                  name: 'Net profit',
                  values: chartPeriods.map((period) => billions(period.income.netProfit.amount)),
                },
              ],
              unit: `bn ${reported.reportingCurrency}`,
            }}
            height={240}
          />
          <AnalyticalChart
            preset="bar"
            data={{
              categories: chartPeriods.map((period) => period.fiscalPeriod),
              series: [
                {
                  name: 'Free cash flow',
                  values: chartPeriods.map((period) =>
                    billions(period.cashFlow.freeCashFlow.amount),
                  ),
                },
              ],
              signed: true,
              unit: `bn ${reported.reportingCurrency}`,
            }}
            height={240}
          />
        </div>
        <span className={styles.meta}>
          Figures in billions of {reported.reportingCurrency}, on the {activeBasis} basis.
        </span>
      </Card>
    </div>
  );
}
