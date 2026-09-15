import { Badge, Card, ErrorState, KeyValuePair, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { moneyFromDto } from '../../../../data/api/mappers';
import {
  useInstrumentFundamentals,
  usePortfolioHoldings,
  useWatchlists,
} from '../../../../data/api';
import { positionDetailPath, ROUTES } from '../../../../routes/routes';
import {
  formatIsoDate,
  formatMoney,
  formatNumber,
  formatSignedMoney,
  formatSignedPercent,
} from '../../../../shared/format';
import styles from '../WorkspacePage.module.scss';

interface InstrumentSectionProps {
  readonly instrumentId: string;
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 });

// UI spec 7.4 — key fundamentals where relevant to the instrument type.
export function FundamentalsSection({ instrumentId }: InstrumentSectionProps): ReactElement {
  const fundamentals = useInstrumentFundamentals(instrumentId);
  let body: ReactElement;
  if (fundamentals.isError) {
    body = (
      <ErrorState
        title="Fundamentals unavailable"
        message={fundamentals.error.message}
        onRetry={() => {
          void fundamentals.refetch();
        }}
      />
    );
  } else if (fundamentals.data === undefined) {
    body = <LoadingState layout="table" count={3} />;
  } else {
    const data = fundamentals.data;
    const percent = (value: number): string => `${value.toFixed(2)}%`;
    body = (
      <div className={styles.keyValues}>
        {data.sector !== null && <KeyValuePair label="Sector" value={data.sector} />}
        {data.marketCap !== null && (
          <KeyValuePair
            label="Market value"
            value={`${compact.format(Number(data.marketCap.amount))} ${data.marketCap.currency}`}
            isMono
          />
        )}
        {data.priceToEarnings !== null && (
          <KeyValuePair label="Price to earnings" value={data.priceToEarnings.toFixed(1)} isMono />
        )}
        {data.dividendYieldPercent !== null && (
          <KeyValuePair label="Dividend yield" value={percent(data.dividendYieldPercent)} isMono />
        )}
        {data.beta !== null && <KeyValuePair label="Beta" value={data.beta.toFixed(2)} isMono />}
        {data.expenseRatioPercent !== null && (
          <KeyValuePair label="Expense ratio" value={percent(data.expenseRatioPercent)} isMono />
        )}
        {data.couponPercent !== null && (
          <KeyValuePair label="Coupon" value={percent(data.couponPercent)} isMono />
        )}
        {data.maturityDate !== null && (
          <KeyValuePair label="Maturity" value={formatIsoDate(data.maturityDate)} isMono />
        )}
        <p className={styles.meta}>{data.note}</p>
      </div>
    );
  }
  return <Card title="Fundamentals">{body}</Card>;
}

// UI spec 7.4 — position held, if any.
export function PositionSection({ instrumentId }: InstrumentSectionProps): ReactElement {
  const holdings = usePortfolioHoldings();
  const holding = holdings.data?.find((item) => item.instrumentId === instrumentId);
  let body: ReactElement;
  if (holdings.isError) {
    body = <p className={styles.note}>Holdings are unavailable right now.</p>;
  } else if (holdings.data === undefined) {
    body = <LoadingState layout="table" count={2} />;
  } else if (holding === undefined) {
    body = <p className={styles.note}>You do not hold this instrument.</p>;
  } else {
    const gain = moneyFromDto(holding.unrealisedGainLoss);
    body = (
      <div className={styles.keyValues}>
        <KeyValuePair
          label="Quantity"
          value={formatNumber(holding.quantity, {
            decimals: Number.isInteger(holding.quantity) ? 0 : 4,
          })}
          isMono
        />
        <KeyValuePair
          label="Value"
          value={formatMoney(moneyFromDto(holding.currentValue), { showCurrency: 'code' })}
          isMono
        />
        <KeyValuePair
          label="Unrealised"
          value={`${formatSignedMoney(gain)} (${formatSignedPercent(holding.unrealisedGainLossPercent)})`}
          isMono
        />
        <Link to={positionDetailPath(instrumentId)} className={styles.link}>
          Open position detail
        </Link>
      </div>
    );
  }
  return <Card title="Your position">{body}</Card>;
}

// UI spec 7.4 — watchlist membership.
export function WatchlistSection({ instrumentId }: InstrumentSectionProps): ReactElement {
  const watchlists = useWatchlists();
  const lists = watchlists.data?.filter((list) =>
    list.instrumentIds.some((id) => id === instrumentId),
  );
  let body: ReactElement;
  if (watchlists.isError) {
    body = <p className={styles.note}>Watchlists are unavailable right now.</p>;
  } else if (lists === undefined) {
    body = <LoadingState layout="table" count={1} />;
  } else {
    body = (
      <div className={styles.stack}>
        {lists.length === 0 ? (
          <p className={styles.note}>Not in any watchlist.</p>
        ) : (
          <div className={styles.badges}>
            {lists.map((list) => (
              <Badge key={list.id} variant="info">
                {list.name}
              </Badge>
            ))}
          </div>
        )}
        <Link to={ROUTES.MARKETS_WATCHLISTS} className={styles.link}>
          Manage watchlists
        </Link>
      </div>
    );
  }
  return <Card title="Watchlists">{body}</Card>;
}
