import { Card, EmptyState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { moneyFromDto } from '../../../data/api';
import type { RiskLimitDto, RiskPanelDto } from '../../../data/schemas';
import { ROUTES } from '../../../routes/routes';
import { formatDateTime, formatMoney } from '../../../shared/format';
import {
  GROUP_DESCRIPTIONS,
  GROUP_TITLES,
  byScope,
  closenessOf,
  groupLimits,
} from '../model/limitDisplay';
import { ComplianceLimitsPanel } from './ComplianceLimitsPanel';
import { CounterpartyExposureSection } from './CounterpartyExposureSection';
import { EmergencyControls } from './EmergencyControls';
import { LimitCard } from './LimitCard';
import { LimitChangeDialog } from './LimitChangeDialog';
import styles from '../Risk.module.scss';

export function RiskPanelView({ panel }: { readonly panel: RiskPanelDto }): ReactElement {
  const [editing, setEditing] = useState<string | null>(null);
  const editingLimit = panel.limits.find((limit) => limit.id === editing);
  const exceeded = panel.limits.filter((limit) => closenessOf(limit) === 'breached').length;
  const near = panel.limits.filter((limit) => closenessOf(limit) === 'near').length;

  const renderCards = (limits: readonly RiskLimitDto[]): ReactElement => (
    <ul className={`${styles.limitGrid} ${styles.list}`}>
      {limits.map((limit) => (
        <LimitCard
          key={limit.id}
          limit={limit}
          cooldowns={panel.cooldowns}
          onChange={() => {
            setEditing(limit.id);
          }}
        />
      ))}
    </ul>
  );

  return (
    <div className={styles.page}>
      <div className={styles.summary}>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Limits exceeded</span>
          <span className={`${styles.summaryValue} ${exceeded > 0 ? styles.negative : ''}`}>
            {exceeded}
          </span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Near a limit</span>
          <span className={styles.summaryValue}>{near}</span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Capital measured against</span>
          <span className={styles.summaryValue}>
            {formatMoney(moneyFromDto(panel.totalCapital))}
          </span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Breach history</span>
          <Link to={ROUTES.RISK_BREACHES} className={styles.link}>
            See every breach and how it ended
          </Link>
        </span>
      </div>

      <EmergencyControls />

      <ComplianceLimitsPanel />

      <CounterpartyExposureSection />

      {groupLimits(panel.limits).map(({ group, limits }) => (
        <Card
          key={group}
          title={GROUP_TITLES[group]}
          extra={
            <span className={styles.meta}>
              {limits.length} limits · {GROUP_DESCRIPTIONS[group]}
            </span>
          }
          isCollapsible
          defaultExpanded={true}
        >
          {group === 'strategy'
            ? byScope(limits).map(({ scope, limits: scoped }) => (
                <div key={scope} className={styles.stack}>
                  <h3 className={styles.scopeTitle}>{scope}</h3>
                  {renderCards(scoped)}
                </div>
              ))
            : renderCards(limits)}
        </Card>
      ))}

      <Card
        title="Change log"
        extra={<span className={styles.meta}>{panel.changes.length} recorded</span>}
        isCollapsible
        defaultExpanded={false}
      >
        {panel.changes.length === 0 ? (
          <EmptyState
            title="No changes recorded"
            description="Every limit change and emergency action is recorded here with its reason."
          />
        ) : (
          <ul className={styles.list}>
            {panel.changes.map((change) => (
              <li key={change.id} className={styles.row}>
                <span className={styles.title}>{change.title}</span>
                <p className={styles.note}>{change.detail}</p>
                <p className={styles.note}>Reason: {change.reason}</p>
                <p className={styles.meta}>{formatDateTime(change.at)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editingLimit !== undefined && (
        <LimitChangeDialog
          limit={editingLimit}
          onClose={() => {
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
