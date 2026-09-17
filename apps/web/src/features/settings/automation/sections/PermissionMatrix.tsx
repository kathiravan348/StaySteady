import { Badge, Card, cx } from '@staysteady/ui';
import type { BadgeVariant } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { instrumentTypeLabel } from '../../../../shared/format';
import { ROUTES } from '../../../../routes/routes';
import styles from '../Automation.module.scss';
import type {
  CellPermission,
  LayerStatus,
  Outcome,
} from '../../../../shared/automation/permissionLayers';

const OUTCOME: Readonly<Record<Outcome, { variant: BadgeVariant; label: string }>> = {
  live: { variant: 'positive', label: 'Live' },
  simulation: { variant: 'info', label: 'Simulation' },
  blocked: { variant: 'neutral', label: 'Blocked' },
};

const LAYER: Readonly<Record<LayerStatus, { variant: BadgeVariant; label: string }>> = {
  allows: { variant: 'positive', label: 'Allows' },
  simulation: { variant: 'info', label: 'Simulation only' },
  blocks: { variant: 'critical', label: 'Blocks' },
};

// Where each layer is changed.
const LAYER_LINK: Readonly<Record<string, string>> = {
  Market: ROUTES.SETTINGS_MARKETS,
  'Instrument type': ROUTES.SETTINGS_INSTRUMENTS,
};

export interface PermissionMatrixProps {
  readonly markets: readonly { readonly id: string; readonly name: string }[];
  readonly cells: readonly CellPermission[];
}

// Market by instrument type: what automation may actually trade, and the first layer that stops it.
export function PermissionMatrix({ markets, cells }: PermissionMatrixProps): ReactElement {
  const types = [...new Set(cells.map((cell) => cell.type))];
  const firstLive = cells.find((cell) => cell.outcome === 'live') ?? cells[0];
  const [selected, setSelected] = useState(
    firstLive === undefined ? null : `${firstLive.marketId}:${firstLive.type}`,
  );
  const chosen = cells.find((cell) => `${cell.marketId}:${cell.type}` === selected);

  return (
    <div className={styles.page}>
      <Card title="Market by instrument type">
        <div className={styles.stack}>
          <p className={styles.meta}>
            An automated order proceeds only if the market, the instrument type and a broker all
            permit it. Blocked cells name the first layer that stops it; select a cell for every
            layer.
          </p>
          <div className={styles.scroller}>
            <table className={styles.grid} aria-label="Automation permission by market and type">
              <thead>
                <tr>
                  <th scope="col">Market</th>
                  {types.map((type) => (
                    <th key={type} scope="col">
                      {instrumentTypeLabel(type)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {markets.map((market) => (
                  <tr key={market.id}>
                    <th scope="row">{market.name}</th>
                    {types.map((type) => {
                      const cell = cells.find(
                        (item) => item.marketId === market.id && item.type === type,
                      );
                      if (cell === undefined) return <td key={type} />;
                      const key = `${cell.marketId}:${cell.type}`;
                      const outcome = OUTCOME[cell.outcome];
                      return (
                        <td key={type}>
                          <button
                            type="button"
                            className={cx(
                              styles.cell,
                              key === selected ? styles.cellSelected : undefined,
                            )}
                            aria-pressed={key === selected}
                            aria-label={`${market.name}, ${instrumentTypeLabel(type)}: ${outcome.label}${cell.blockedBy === null ? '' : ` by ${cell.blockedBy}`}`}
                            onClick={() => {
                              setSelected(key);
                            }}
                          >
                            <Badge variant={outcome.variant}>{outcome.label}</Badge>
                            {cell.blockedBy !== null && (
                              <span className={styles.meta}>{cell.blockedBy}</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {chosen !== undefined && (
        <Card
          title={`${markets.find((market) => market.id === chosen.marketId)?.name ?? chosen.marketId} · ${instrumentTypeLabel(chosen.type)}`}
          extra={
            <Badge variant={OUTCOME[chosen.outcome].variant}>{OUTCOME[chosen.outcome].label}</Badge>
          }
        >
          <ul className={styles.layers} aria-label="Layers">
            {chosen.layers.map((layer) => {
              const link =
                LAYER_LINK[layer.name] ??
                (layer.name.startsWith('Broker') ? ROUTES.SETTINGS_BROKERS : undefined);
              return (
                <li key={layer.name} className={styles.layer}>
                  <Badge variant={LAYER[layer.status].variant}>{LAYER[layer.status].label}</Badge>
                  <span className={styles.inline}>
                    <span className={styles.layerName}>{layer.name}</span>
                    {link !== undefined && (
                      <Link className={styles.link} to={link}>
                        Change
                      </Link>
                    )}
                  </span>
                  <p className={styles.layerDetail}>{layer.detail}</p>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
