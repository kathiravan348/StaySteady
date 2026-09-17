import { Badge, Card, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { moneyFromDto } from '../../../data/api';
import type { ConcentrationDto, NetWorthViewDto } from '../../../data/schemas';
import { AssetClassSchema } from '../../../data/schemas';
import { formatMoney, formatPercentage } from '../../../shared/format';
import styles from '../NetWorth.module.scss';
import { ASSET_CLASS_LABELS, LIQUIDITY_LABELS } from '../model/netWorthLabels';

const KIND_TITLES: Readonly<Record<ConcentrationDto['kind'], string>> = {
  issuer: 'By issuer',
  sector: 'By sector',
  asset_class: 'By asset class',
};

const percent = (value: number): string => formatPercentage(value, { decimals: 1, signed: false });

function nameOf(item: ConcentrationDto): string {
  const parsed = AssetClassSchema.safeParse(item.name);
  return item.kind === 'asset_class' && parsed.success
    ? ASSET_CLASS_LABELS[parsed.data]
    : item.name;
}

// Share bars are widths, so they are set inline from the data rather than as a token.
const width = (share: number): { width: string } => ({
  width: `${String(Math.min(100, Math.max(0, share)))}%`,
});

export function LiquiditySection({ view }: { readonly view: NetWorthViewDto }): ReactElement {
  return (
    <Card title="Liquidity">
      <div className={styles.stack}>
        <ul className={styles.rows}>
          {view.liquidity.map((item) => (
            <li key={item.liquidity} className={styles.row}>
              <span className={styles.note}>{LIQUIDITY_LABELS[item.liquidity]}</span>
              <span className={cx(styles.value, styles.end)}>
                {formatMoney(moneyFromDto(item.value))} · {percent(item.sharePercent)}
              </span>
              <span className={styles.bar} aria-hidden="true">
                <span className={styles.fill} style={width(item.sharePercent)} />
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.meta}>
          Shares of total assets. Listed holdings count as within a month, since a sale settles in
          days; liabilities are not netted off.
        </p>
      </div>
    </Card>
  );
}

export function ConcentrationSection({ view }: { readonly view: NetWorthViewDto }): ReactElement {
  const kinds: readonly ConcentrationDto['kind'][] = ['asset_class', 'issuer', 'sector'];
  const breached = view.concentration.filter((item) => item.breached);
  return (
    <Card title="Concentration against total net worth">
      <div className={styles.stack}>
        {breached.length > 0 && (
          <p className={styles.warning} role="alert">
            Over the limit:{' '}
            {breached.map((item) => `${nameOf(item)} ${percent(item.sharePercent)}`).join(', ')}
          </p>
        )}
        {kinds.map((kind) => {
          const items = view.concentration.filter((item) => item.kind === kind).slice(0, 5);
          return (
            <div key={kind} className={styles.stack}>
              <span className={styles.label}>
                {KIND_TITLES[kind]} (limit {String(items[0]?.limitPercent ?? 0)}%)
              </span>
              <ul className={styles.rows}>
                {items.map((item) => (
                  <li key={item.name} className={styles.row}>
                    <span className={styles.inline}>
                      <span className={styles.note}>{nameOf(item)}</span>
                      {item.breached && <Badge variant="critical">Over limit</Badge>}
                    </span>
                    <span className={cx(styles.value, styles.end)}>
                      {formatMoney(moneyFromDto(item.value))} · {percent(item.sharePercent)}
                    </span>
                    <span className={styles.bar} aria-hidden="true">
                      <span
                        className={cx(styles.fill, item.breached ? styles.fillBreached : undefined)}
                        style={width(item.sharePercent)}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        <p className={styles.meta}>
          Shares of net worth, brokerage and manual assets together; the five largest of each are
          shown. Property counts at its full value, before the loan against it.
        </p>
      </div>
    </Card>
  );
}
