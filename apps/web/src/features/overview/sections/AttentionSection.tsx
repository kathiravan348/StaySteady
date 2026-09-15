import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useNewsItems } from '../../../data/api';
import { positionDetailPath } from '../../../routes/routes';
import { selectAttention } from '../model/overviewLists';
import type { AttentionReason, ValuedPosition } from '../model/overviewTypes';
import { formatSignedPercent, pluralize } from '../overviewFormat';
import styles from './sections.module.scss';

export interface AttentionSectionProps {
  readonly positions: readonly ValuedPosition[];
}

function describeReason(reason: AttentionReason): string {
  switch (reason.kind) {
    case 'unusual-move':
      return `Moved ${formatSignedPercent(reason.changePercent)} today`;
    case 'high-importance-news':
      return `${pluralize(reason.count, 'high-importance news story', 'high-importance news stories')}`;
  }
}

// UI spec 7.1 — positions requiring attention. Exit levels are not tracked in the data yet.
export function AttentionSection({ positions }: AttentionSectionProps): ReactElement {
  const news = useNewsItems();
  const items = selectAttention(positions, news.data);

  return (
    <Card title="Needs attention">
      {items.length === 0 ? (
        <p className={styles.note}>No positions need attention right now.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.instrument.id} className={styles.row}>
              <span className={styles.rowMain}>
                <Link
                  to={positionDetailPath(item.instrument.id)}
                  className={`${styles.rowTitle} ${styles.link}`}
                >
                  {item.instrument.symbol}
                </Link>
                <span className={styles.meta}>{item.instrument.name}</span>
              </span>
              <span className={styles.badges}>
                {item.reasons.map((reason) => (
                  <Badge
                    key={reason.kind}
                    variant={reason.kind === 'unusual-move' ? 'warning' : 'info'}
                  >
                    {describeReason(reason)}
                  </Badge>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
