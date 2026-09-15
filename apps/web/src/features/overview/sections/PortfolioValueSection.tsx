import {
  AnalyticalChart,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  useChartTheme,
} from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { useFxHistories, usePriceHistories } from '../../../data/api';
import type { HoldingDto, InstrumentDto } from '../../../data/schemas';
import { useSystemState } from '../../../providers/SystemStateProvider';
import { buildValueChartOptions } from '../model/valueChartOptions';
import type { ValuePeriod } from '../model/valueHistory';
import { buildValueSeries, VALUE_PERIODS } from '../model/valueHistory';
import { ToggleGroup } from './ToggleGroup';

export interface PortfolioValueSectionProps {
  readonly holdings: readonly HoldingDto[];
  readonly instruments: readonly InstrumentDto[];
}

// UI spec 7.1 — the period selector affects this chart only, not the headline cards.
export function PortfolioValueSection({
  holdings,
  instruments,
}: PortfolioValueSectionProps): ReactElement {
  const { baseCurrency } = useSystemState();
  const [period, setPeriod] = useState<ValuePeriod>('1Y');
  const theme = useChartTheme();
  const instrumentIds = useMemo(() => holdings.map((holding) => holding.instrumentId), [holdings]);
  const prices = usePriceHistories(instrumentIds);
  const fx = useFxHistories();

  const series = useMemo(
    () =>
      fx.data === undefined || prices.isPending
        ? null
        : buildValueSeries(
            {
              holdings,
              instruments,
              priceHistories: prices.histories,
              fxHistories: fx.data,
              baseCurrency,
            },
            period,
          ),
    [fx.data, prices.isPending, prices.histories, holdings, instruments, baseCurrency, period],
  );
  const options = useMemo(
    () => (series === null ? null : buildValueChartOptions(series, theme)),
    [series, theme],
  );

  const error = prices.error ?? fx.error;
  const retry = (): void => {
    prices.refetch();
    void fx.refetch();
  };

  const body =
    error !== null ? (
      <ErrorState title="Value history unavailable" message={error.message} onRetry={retry} />
    ) : series === null || options === null ? (
      <LoadingState layout="chart" />
    ) : series.values.length === 0 ? (
      <EmptyState
        title="No value history yet"
        description="History appears once a holding has prices."
      />
    ) : (
      <AnalyticalChart preset="custom" options={options} height={280} />
    );

  return (
    <Card
      title="Portfolio value"
      extra={
        <ToggleGroup
          label="Chart period"
          options={VALUE_PERIODS}
          value={period}
          onChange={setPeriod}
        />
      }
    >
      {body}
    </Card>
  );
}
