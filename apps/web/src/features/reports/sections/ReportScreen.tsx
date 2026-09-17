import { Button, EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useBaseCurrencyConfig, usePortfolioHoldings, useReport } from '../../../data/api';
import type { ReportTypeDto } from '../../../data/schemas';
import { ReportTypeSchema } from '../../../data/schemas';
import { PRICE_HISTORY_START } from '../model/reportLimits';
import { REPORT_TYPES, presetPeriod, reportToCsv } from '../model/reportModel';
import styles from '../Reports.module.scss';
import { ReportBody } from './ReportBody';
import type { ReportSettings } from './ReportControls';
import { ReportControls } from './ReportControls';
import { ScheduledReports } from './ScheduledReports';

function download(fileName: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// UI spec 7.16 — one screen for every report type. The route picks the starting type; ?type= in the
// URL picks any other, and ?from=&to= open a chosen period, so a report can be linked to.
export function ReportScreen({
  defaultType,
}: {
  readonly defaultType: ReportTypeDto;
}): ReactElement {
  const [params, setParams] = useSearchParams();
  const base = useBaseCurrencyConfig();
  const holdings = usePortfolioHoldings();
  const parsedType = ReportTypeSchema.safeParse(params.get('type'));
  const type = parsedType.success ? parsedType.data : defaultType;

  const initial = presetPeriod('ytd', new Date());
  const linkedFrom = params.get('from');
  const linkedTo = params.get('to');
  const linked =
    linkedFrom !== null && linkedTo !== null && DATE.test(linkedFrom) && DATE.test(linkedTo)
      ? { from: linkedFrom, to: linkedTo }
      : null;
  const [settings, setSettings] = useState<Omit<ReportSettings, 'type'>>({
    preset: linked === null ? 'ytd' : 'custom',
    from: linked?.from ?? initial.from,
    to: linked?.to ?? initial.to,
    currency: 'USD',
    comparison: 'previous',
  });
  // The configured base currency is the default until the owner picks another.
  const [currencyChosen, setCurrencyChosen] = useState(false);
  const currency = currencyChosen
    ? settings.currency
    : (base.data?.config.currency ?? settings.currency);
  const full: ReportSettings = { ...settings, type, currency };

  const problem =
    full.from === '' || full.to === ''
      ? 'Choose a start and end date.'
      : full.from > full.to
        ? 'The start date must be on or before the end date.'
        : full.to > initial.to
          ? 'A report can run up to yesterday; today has no closing prices yet.'
          : full.from < PRICE_HISTORY_START
            ? `Price history starts on ${PRICE_HISTORY_START}.`
            : null;
  const request = useMemo(
    () =>
      problem === null
        ? { type, from: full.from, to: full.to, currency, comparison: full.comparison }
        : null,
    [problem, type, full.from, full.to, currency, full.comparison],
  );
  const report = useReport(request);
  const description = REPORT_TYPES.find((item) => item.value === type)?.description ?? '';

  const change = (next: ReportSettings): void => {
    if (next.type !== type) setParams({ type: next.type }, { replace: true });
    if (next.currency !== currency) setCurrencyChosen(true);
    const period =
      next.preset === 'custom' || next.preset === settings.preset
        ? { from: next.from, to: next.to }
        : presetPeriod(next.preset, new Date());
    setSettings({
      preset: next.preset,
      ...period,
      currency: next.currency,
      comparison: next.comparison,
    });
  };

  let body: ReactElement;
  if (holdings.data !== undefined && holdings.data.length === 0) {
    body = (
      <EmptyState
        title="Nothing to report yet"
        description="Reports appear once the portfolio holds something."
      />
    );
  } else if (problem !== null) {
    body = <p className={styles.warning}>{problem}</p>;
  } else if (report.isError) {
    body = (
      <ErrorState
        title="Report unavailable"
        message={report.error.message}
        onRetry={() => {
          void report.refetch();
        }}
      />
    );
  } else if (report.data === undefined) {
    body = <LoadingState layout="detail" count={4} />;
  } else {
    const data = report.data;
    body = (
      <div className={styles.page}>
        <div className={styles.inline}>
          <span className={styles.meta}>
            {data.period.from} to {data.period.to} in {data.currency}
            {data.previousPeriod === null
              ? ''
              : `, compared with ${data.previousPeriod.from} to ${data.previousPeriod.to}`}{' '}
            · generated {new Date(data.generatedAt).toLocaleTimeString('en-GB')}
          </span>
          <Button
            variant="secondary"
            onPress={() => {
              download(
                `staysteady-${data.type}-${data.period.from}-${data.period.to}-${data.currency}.csv`,
                reportToCsv(data),
              );
            }}
          >
            Export CSV
          </Button>
        </div>
        {/* A changed request keeps the last report visible, clearly marked, until the new one arrives. */}
        {report.isPlaceholderData && (
          <p className={styles.warning}>Showing the previous report while this one is prepared.</p>
        )}
        <ReportBody report={data} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <p className={styles.note}>{description}</p>
      <ReportControls settings={full} maxDate={initial.to} onChange={change} />
      {body}
      <ScheduledReports />
    </div>
  );
}
