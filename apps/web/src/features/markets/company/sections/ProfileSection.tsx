// Company profile: what the business is, and where its revenue comes from (UI spec 20.1).

import { Badge, Card, ErrorState, KeyValuePair, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useCompanyProfile } from '../../../../data/api';
import type { RevenueSplitEntryDto } from '../../../../data/schemas';
import { formatIsoDate, formatNumber } from '../../../../shared/format';
import styles from '../CompanyResearch.module.scss';

export interface CompanySectionProps {
  readonly instrumentId: string;
}

function RevenueSplit({
  title,
  entries,
}: {
  readonly title: string;
  readonly entries: readonly RevenueSplitEntryDto[];
}): ReactElement {
  const total = entries.reduce((sum, entry) => sum + entry.sharePercent, 0);
  return (
    <div className={styles.stack}>
      <span className={styles.meta}>{title}</span>
      <ul className={styles.list} aria-label={title}>
        {entries.map((entry) => (
          <li key={entry.name} className={styles.splitRow}>
            <span className={styles.splitLabel}>{entry.name}</span>
            <span className={styles.splitBar}>
              <span
                className={styles.splitFill}
                style={{ width: `${String(entry.sharePercent)}%` }}
              />
            </span>
            <span className={styles.splitValue}>{entry.sharePercent.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
      {total < 99.5 && (
        <span className={styles.meta}>
          Reported lines cover {total.toFixed(1)}% of revenue; the company does not break down the
          rest.
        </span>
      )}
    </div>
  );
}

export function ProfileSection({ instrumentId }: CompanySectionProps): ReactElement {
  const profile = useCompanyProfile(instrumentId);

  if (profile.isError) {
    return (
      <Card title="Company">
        <ErrorState
          title="Company record unavailable"
          message={profile.error.message}
          onRetry={() => {
            void profile.refetch();
          }}
        />
      </Card>
    );
  }
  if (profile.data === undefined) {
    return (
      <Card title="Company">
        <LoadingState layout="detail" />
      </Card>
    );
  }
  const record = profile.data.profile;
  if (record === null) {
    return (
      <Card title="Company">
        <p className={styles.description}>{profile.data.unavailableReason}</p>
      </Card>
    );
  }

  const recentChange = record.people.find((person) => person.appointedInLastYear);
  return (
    <Card title={record.legalName} extra={<Badge variant="neutral">{record.symbol}</Badge>}>
      <div className={styles.stack}>
        <p className={styles.description}>{record.description}</p>
        <div className={styles.columns}>
          <div className={styles.keyValues}>
            <KeyValuePair label="Incorporated in" value={record.incorporationCountry} />
            <KeyValuePair
              label="Listed on"
              value={[record.primaryListing, ...record.secondaryListings].join(', ')}
            />
            <KeyValuePair
              label="Listed since"
              value={
                record.listedSince === null ? 'Not recorded' : formatIsoDate(record.listedSince)
              }
            />
            <KeyValuePair label="Headquarters" value={record.headquarters} />
            <KeyValuePair
              label="Employees"
              value={
                record.employeeCount === null
                  ? 'Not reported'
                  : formatNumber(record.employeeCount, { decimals: 0 })
              }
              isMono
            />
            <KeyValuePair
              label="Reports in"
              value={`${record.reportingCurrency}, year ending ${record.fiscalYearEnd}`}
            />
            <KeyValuePair label="ISIN" value={record.identifiers.isin ?? 'Not recorded'} isMono />
          </div>
          <div className={styles.keyValues}>
            {record.people.map((person) => (
              <KeyValuePair
                key={person.role}
                label={person.role.replaceAll('_', ' ')}
                value={`${person.name}${person.inRoleSince === null ? '' : ` (since ${String(person.inRoleSince)})`}`}
              />
            ))}
            {record.auditor !== null && (
              <KeyValuePair
                label="Auditor"
                value={`${record.auditor.name}, opinion ${formatIsoDate(record.auditor.lastOpinionDate)}`}
              />
            )}
          </div>
        </div>
        {recentChange !== undefined && (
          <div className={styles.inline}>
            <Badge variant="info">Recent change</Badge>
            <span className={styles.evidence}>
              {recentChange.name} took over as {recentChange.role.replaceAll('_', ' ')} within the
              last year.
            </span>
          </div>
        )}
        {record.auditor?.isQualified === true && (
          <div className={styles.inline}>
            <Badge variant="critical">Qualified audit opinion</Badge>
            <span className={styles.evidence}>
              {record.auditor.note ?? 'See the annual report.'}
            </span>
          </div>
        )}
        <div className={styles.columns}>
          {record.revenueBySegment.length > 0 && (
            <RevenueSplit title="Revenue by segment" entries={record.revenueBySegment} />
          )}
          {record.revenueByGeography.length > 0 && (
            <RevenueSplit title="Revenue by geography" entries={record.revenueByGeography} />
          )}
        </div>
        {record.dependencies.length > 0 && (
          <div className={styles.stack}>
            <span className={styles.meta}>What this business depends on</span>
            <ul className={styles.list}>
              {record.dependencies.map((dependency) => (
                <li key={dependency} className={styles.evidence}>
                  {dependency}
                </li>
              ))}
            </ul>
          </div>
        )}
        <span className={styles.meta}>
          {record.source} · as at {formatIsoDate(record.asOf)}
        </span>
      </div>
    </Card>
  );
}
