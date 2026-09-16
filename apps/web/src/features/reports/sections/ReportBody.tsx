import { AnalyticalChart, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { ReportDto, ReportTableDto } from '../../../data/schemas';
import { formatChange, formatReportValue } from '../model/reportModel';
import styles from '../Reports.module.scss';

function ReportTable({ table }: { readonly table: ReportTableDto }): ReactElement {
  const cell = (record: ReportTableDto['total'], key: string): string => {
    const value = record?.[key];
    return value === undefined ? '' : formatReportValue(value);
  };
  return (
    <Card title={table.title} extra={<span className={styles.meta}>{table.rows.length} rows</span>}>
      {table.rows.length === 0 ? (
        <p className={styles.note}>Nothing to show for this period.</p>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                {table.columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={col.align === 'end' ? styles.end : undefined}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row.id}>
                  {table.columns.map((col) => (
                    <td key={col.key} className={col.align === 'end' ? styles.end : undefined}>
                      {cell(row.cells, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {table.total !== null && (
              <tfoot>
                <tr>
                  {table.columns.map((col) => (
                    <td key={col.key} className={col.align === 'end' ? styles.end : undefined}>
                      {cell(table.total, col.key)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </Card>
  );
}

// UI spec 7.16 — the report itself: headline metrics with their comparisons, the chart, the tables
// and the assumptions, which are always shown.
export function ReportBody({ report }: { readonly report: ReportDto }): ReactElement {
  const { chart } = report;
  return (
    <div className={styles.page}>
      <ul className={styles.metrics} aria-label={`${report.title} summary`}>
        {report.metrics.map((item) => {
          const previous = item.previous === null ? null : formatChange(item.value, item.previous);
          const benchmark =
            item.benchmark === null ? null : formatChange(item.value, item.benchmark);
          return (
            <li key={item.id} className={styles.metric}>
              <span className={styles.fieldLabel}>{item.label}</span>
              <span className={styles.metricValue}>{formatReportValue(item.value)}</span>
              {item.previous !== null && report.previousPeriod !== null && (
                <span className={styles.meta}>
                  Previous period {formatReportValue(item.previous)}
                  {previous === null ? '' : ` (${previous})`}
                </span>
              )}
              {item.benchmark !== null && (
                <span className={styles.meta}>
                  {report.benchmarkName ?? 'Benchmark'} {formatReportValue(item.benchmark)}
                  {benchmark === null ? '' : ` (${benchmark} against it)`}
                </span>
              )}
              {item.note !== null && <span className={styles.meta}>{item.note}</span>}
            </li>
          );
        })}
      </ul>

      {chart !== null && (
        <Card title={chart.title}>
          {chart.kind === 'comparison' ? (
            <AnalyticalChart
              preset="comparison-curves"
              data={{ dates: chart.dates, series: chart.series, baseline: chart.baseline }}
              height={300}
            />
          ) : (
            <AnalyticalChart preset="allocation-donut" data={{ items: chart.items }} height={260} />
          )}
        </Card>
      )}

      {report.tables.map((table) => (
        <ReportTable key={table.id} table={table} />
      ))}

      <Card title="How these numbers were made">
        <ul className={styles.list}>
          {report.notes.map((note) => (
            <li key={note} className={styles.note}>
              {note}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
