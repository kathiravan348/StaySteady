// Warning flags with the evidence that raised them (UI spec 20.1; decision 52).
// Observations, never advice: each one says what was reported and leaves the judgement to the owner.

import { Badge, Card, EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useFundamentalMeasures } from '../../../../data/api';
import styles from '../CompanyResearch.module.scss';
import type { CompanySectionProps } from './ProfileSection';

export function FlagsSection({ instrumentId }: CompanySectionProps): ReactElement {
  const measures = useFundamentalMeasures(instrumentId);

  if (measures.isError) {
    return (
      <Card title="What to look at">
        <ErrorState
          title="Flags unavailable"
          message={measures.error.message}
          onRetry={() => {
            void measures.refetch();
          }}
        />
      </Card>
    );
  }
  if (measures.data === undefined) {
    return (
      <Card title="What to look at">
        <LoadingState layout="cards" count={2} />
      </Card>
    );
  }

  const derived = measures.data.measures;
  if (derived === null) {
    return (
      <Card title="What to look at">
        <p className={styles.description}>{measures.data.unavailableReason}</p>
      </Card>
    );
  }
  if (derived.flags.length === 0) {
    return (
      <Card title="What to look at">
        <EmptyState
          title="Nothing flagged"
          description={`Nothing in the statements to ${derived.latestPeriod} raised a flag. That is not the same as a recommendation.`}
        />
      </Card>
    );
  }

  return (
    <Card title="What to look at">
      <ul className={styles.list} aria-label="Warning flags">
        {derived.flags.map((flag) => (
          <li key={flag.id} className={styles.flag}>
            <span className={styles.flagTitle}>
              <Badge variant={flag.severity === 'critical' ? 'critical' : 'negative'}>
                {flag.severity === 'critical' ? 'Critical' : 'Warning'}
              </Badge>
              {flag.title}
            </span>
            <span className={styles.evidence}>{flag.evidence}</span>
          </li>
        ))}
      </ul>
      <p className={styles.meta}>
        Each flag states what was reported and the period it came from. None of them is advice.
      </p>
    </Card>
  );
}
