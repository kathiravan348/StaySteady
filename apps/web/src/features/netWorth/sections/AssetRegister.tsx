import { Badge, Card, DataTable } from '@staysteady/ui';
import type { ColumnDef } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { moneyFromDto } from '../../../data/api';
import type { NetWorthAssetRowDto, NetWorthViewDto } from '../../../data/schemas';
import { formatMoney } from '../../../shared/format';
import styles from '../NetWorth.module.scss';
import {
  ASSET_CLASS_LABELS,
  CATEGORY_LABELS,
  LIQUIDITY_LABELS,
  METHOD_LABELS,
  describeAge,
} from '../model/netWorthLabels';
import { RecordValuationForm } from './RecordValuationForm';

const getRowId = (row: NetWorthAssetRowDto): string => row.asset.id;

function Detail({
  row,
  view,
}: {
  readonly row: NetWorthAssetRowDto;
  readonly view: NetWorthViewDto;
}): ReactElement {
  const { asset } = row;
  const securedAgainst = view.assets.find((item) => item.asset.id === asset.securedAgainstId);
  const items: [string, string][] = [
    ['Valuation', METHOD_LABELS[asset.method]],
    [
      'Recorded value',
      `${formatMoney(moneyFromDto({ amount: asset.value, currency: asset.currency }))} on ${asset.valuedOn}`,
    ],
    ['Due for an update after', `${String(asset.staleAfterDays)} days`],
    ['Asset class', ASSET_CLASS_LABELS[asset.assetClass]],
  ];
  if (asset.annualRatePercent !== null)
    items.push(['Rate', `${String(asset.annualRatePercent)}% a year, accrued to today`]);
  if (asset.maturityOn !== null) items.push(['Matures', asset.maturityOn]);
  if (asset.issuer !== null) items.push(['Issuer', asset.issuer]);
  if (asset.purchaseCost !== null) {
    items.push([
      'Purchase cost',
      formatMoney(moneyFromDto({ amount: asset.purchaseCost, currency: asset.currency })),
    ]);
  }
  if (securedAgainst !== undefined) items.push(['Secured against', securedAgainst.asset.name]);
  if (asset.vesting !== null) {
    items.push([
      'Unvested',
      formatMoney(moneyFromDto({ amount: asset.vesting.unvestedValue, currency: asset.currency })),
    ]);
    if (asset.vesting.nextVestOn !== null) items.push(['Next vest', asset.vesting.nextVestOn]);
    if (asset.vesting.lockInUntil !== null)
      items.push(['Locked in until', asset.vesting.lockInUntil]);
  }
  return (
    <div className={styles.detail}>
      <div className={styles.detailGrid}>
        {items.map(([label, value]) => (
          <span key={label} className={styles.stack}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value}</span>
          </span>
        ))}
      </div>
      <RecordValuationForm row={row} currency={view.currency} />
    </div>
  );
}

// The manual asset register (UI spec 19.1): stale is the normal state of a hand-kept record, so it is
// shown as due for an update rather than as an error, and unverified is marked separately (19.3).
export function AssetRegister({ view }: { readonly view: NetWorthViewDto }): ReactElement {
  const columns = useMemo<ColumnDef<NetWorthAssetRowDto, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Asset',
        accessorFn: (row) => row.asset.name,
        cell: ({ row }) => (
          <span className={styles.stack}>
            <strong className={styles.note}>{row.original.asset.name}</strong>
            <span className={styles.meta}>{row.original.asset.institution}</span>
          </span>
        ),
      },
      { id: 'category', header: 'Type', accessorFn: (row) => CATEGORY_LABELS[row.asset.category] },
      {
        id: 'value',
        header: 'Value',
        accessorFn: (row) => Number(row.currentValue.amount),
        meta: { align: 'end', label: 'Value in its own currency' },
        cell: ({ row }) => formatMoney(moneyFromDto(row.original.currentValue)),
      },
      {
        id: 'converted',
        header: `In ${view.currency}`,
        accessorFn: (row) => Number(row.valueInCurrency.amount),
        meta: { align: 'end', label: `Value in ${view.currency}` },
        cell: ({ row }) => (
          <span
            className={row.original.asset.category === 'liability' ? styles.negative : undefined}
          >
            {formatMoney(moneyFromDto(row.original.valueInCurrency))}
          </span>
        ),
      },
      {
        id: 'updated',
        header: 'Last updated',
        accessorFn: (row) => row.ageDays,
        cell: ({ row }) => (
          <span className={styles.inline}>
            <span className={styles.note}>{describeAge(row.original.ageDays)}</span>
            {row.original.isStale && <Badge variant="warning">Due for an update</Badge>}
            {!row.original.asset.verified && <Badge variant="info">Unverified</Badge>}
          </span>
        ),
      },
      {
        id: 'liquidity',
        header: 'Liquidity',
        accessorFn: (row) => LIQUIDITY_LABELS[row.asset.liquidity],
      },
    ],
    [view.currency],
  );

  return (
    <Card title="Assets and liabilities held outside the brokers">
      <DataTable
        data={view.assets}
        columns={columns}
        getRowId={getRowId}
        ariaLabel="Manual asset register"
        pageSize={20}
        renderRowDetails={(row) => <Detail row={row} view={view} />}
      />
    </Card>
  );
}
