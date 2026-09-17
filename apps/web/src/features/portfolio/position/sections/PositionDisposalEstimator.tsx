// Tax category, holding-period boundary and the cost of disposing today (E-02; requirements 26; UI
// spec 19.2). Rates and holding periods come from the residence tax rule set, fees from the market
// configuration, and carried-forward losses from the tax records (decision 45).

import { Badge, Card, ErrorState, LoadingState } from '@staysteady/ui';
import { Decimal } from 'decimal.js';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import {
  useFxHistories,
  useFxRates,
  useLossCarryForwards,
  useMarketConfigs,
  useTaxRuleSets,
} from '../../../../data/api';
import { fxTableFromDtos } from '../../../../data/api/mappers';
import { formatMoney, formatNumber, pluralize } from '../../../../shared/format';
import { createMoney } from '../../../../shared/money';
import { TAX_ASSET_CLASS_LABEL, residenceRules } from '../../../../shared/tax/taxRules';
import { indexFxHistories } from '../../holdings/model/fxOnDate';
import type { HoldingRow } from '../../holdings/model/holdingTypes';
import type { DisposalEstimate, LotTaxView } from '../model/disposalEstimate';
import { APPROACHING_DAYS, estimateDisposal, lotTaxViews } from '../model/disposalEstimate';
import positionStyles from '../PositionPage.module.scss';
import styles from './DisposalEstimator.module.scss';

function TermBadge({ lot }: { readonly lot: LotTaxView }): ReactElement {
  if (lot.term === 'single') return <Badge variant="neutral">No long-term treatment</Badge>;
  if (lot.term === 'long') return <Badge variant="positive">Long term</Badge>;
  return <Badge variant="neutral">Short term</Badge>;
}

function Boundary({ lot }: { readonly lot: LotTaxView }): ReactElement {
  if (lot.daysToLongTerm === null) {
    return (
      <span className={styles.meta}>{lot.term === 'long' ? 'Long-term rate applies' : '—'}</span>
    );
  }
  return lot.daysToLongTerm <= APPROACHING_DAYS ? (
    <Badge variant="warning">{pluralize(lot.daysToLongTerm, 'day')} to long term</Badge>
  ) : (
    <span className={styles.meta}>{pluralize(lot.daysToLongTerm, 'day')} to long term</span>
  );
}

function Figure({
  label,
  value,
  isLoss = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly isLoss?: boolean;
}): ReactElement {
  return (
    <div className={styles.figure}>
      <span className={styles.figureLabel}>{label}</span>
      <span className={isLoss ? `${styles.figureValue} ${styles.loss}` : styles.figureValue}>
        {value}
      </span>
    </div>
  );
}

function EstimateFigures({
  estimate,
  row,
}: {
  readonly estimate: DisposalEstimate;
  readonly row: HoldingRow;
}): ReactElement {
  const local = (value: Decimal): string => formatMoney(createMoney(value, row.lastPrice.currency));
  const inTax = (value: Decimal): string => formatMoney(createMoney(value, estimate.taxCurrency));
  return (
    <>
      <div className={positionStyles.metrics}>
        <Figure label="Sale value" value={local(estimate.gross)} />
        <Figure label="Fees and transaction tax" value={`- ${local(estimate.fees)}`} isLoss />
        <Figure
          label="Estimated tax"
          value={`- ${inTax(estimate.tax)}`}
          isLoss={estimate.tax.gt(0)}
        />
        <Figure
          label="Cash after costs"
          value={estimate.net === null ? 'Unknown: no exchange rate' : local(estimate.net)}
        />
      </div>
      <p className={styles.meta}>
        Short-term gain {inTax(estimate.shortGain)}, long-term gain {inTax(estimate.longGain)};
        carried-forward losses used {inTax(estimate.lossesUsed)}; long-term exemption used{' '}
        {inTax(estimate.exemptionUsed)} (assumes no other long-term gains this tax year).{' '}
        {estimate.usesAverageCost ? 'Average cost basis.' : 'Oldest lots first.'} An estimate to
        plan with, not tax advice.
      </p>
    </>
  );
}

export function PositionDisposalEstimator({ row }: { readonly row: HoldingRow }): ReactElement {
  const [quantityText, setQuantityText] = useState(String(row.quantity));
  const taxRules = useTaxRuleSets();
  const markets = useMarketConfigs();
  const fxRates = useFxRates();
  const fxHistories = useFxHistories();
  const losses = useLossCarryForwards();
  const queries = [taxRules, markets, fxRates, fxHistories, losses];
  const fxHistory = useMemo(() => indexFxHistories(fxHistories.data ?? []), [fxHistories.data]);

  const failed = queries.find((query) => query.isError);
  if (failed !== undefined) {
    return (
      <ErrorState
        title="Tax estimate unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          queries.forEach((query) => void query.refetch());
        }}
      />
    );
  }
  if (
    taxRules.data === undefined ||
    markets.data === undefined ||
    fxRates.data === undefined ||
    fxHistories.data === undefined ||
    losses.data === undefined
  ) {
    return <LoadingState layout="detail" count={2} />;
  }

  const rules = residenceRules(taxRules.data.map((entry) => entry.config));
  const fees =
    markets.data.find((entry) => entry.config.marketId === String(row.instrument.marketId))?.config
      .fees ?? null;
  const parsed = Number(quantityText);
  const quantity = Number.isFinite(parsed) ? new Decimal(parsed) : new Decimal(0);
  const estimate = estimateDisposal({
    row,
    quantity,
    rules,
    fees,
    fxNow: fxTableFromDtos(fxRates.data),
    fxHistory,
    losses: losses.data,
  });
  const lots = lotTaxViews(row, rules);

  return (
    <div className={positionStyles.panelStack}>
      <Card
        title="Tax treatment by lot"
        extra={
          <span className={styles.meta}>
            {rules === null
              ? 'No residence tax rules configured'
              : `${TAX_ASSET_CLASS_LABEL[estimate.rule === null ? 'other' : estimate.rule.assetClass]} · ${rules.country} rules`}
          </span>
        }
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Bought</th>
              <th scope="col" className={styles.numeric}>
                Quantity
              </th>
              <th scope="col" className={styles.numeric}>
                Cost per unit
              </th>
              <th scope="col">Held</th>
              <th scope="col">Treatment</th>
              <th scope="col">Boundary</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot, index) => (
              <tr key={lot.id}>
                <td>{lot.purchaseDate}</td>
                <td className={styles.numeric}>{formatNumber(lot.quantity)}</td>
                <td className={styles.numeric}>
                  {formatMoney(row.lots[index]?.costPerUnit ?? row.averageCost)}
                </td>
                <td>{pluralize(lot.daysHeld, 'day')}</td>
                <td>
                  <TermBadge lot={lot} />
                </td>
                <td>
                  <Boundary lot={lot} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Cost of disposing today">
        <div className={positionStyles.panelStack}>
          <label className={styles.quantityRow}>
            <span>Units to sell</span>
            <input
              type="number"
              min={0}
              max={row.quantity}
              className={styles.input}
              value={quantityText}
              onChange={(event) => {
                setQuantityText(event.target.value);
              }}
            />
            <span className={styles.meta}>of {formatNumber(row.quantity)} held</span>
          </label>
          <EstimateFigures estimate={estimate} row={row} />
        </div>
      </Card>
    </div>
  );
}
