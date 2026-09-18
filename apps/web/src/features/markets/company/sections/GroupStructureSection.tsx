// Group structure as an indented list (UI spec 20.1): parent, this company, its material listed
// subsidiaries and the other group companies, each with the share held and a mark against any the
// owner already holds, because four companies of one group are one bet (decision 51).

import { Badge, Card, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import {
  useCorporateStructure,
  useInstrumentClassification,
  usePortfolioHoldings,
} from '../../../../data/api';
import type { CorporateStructureDto, RelatedCompanyDto } from '../../../../data/schemas';
import { companyResearchPath } from '../../../../routes/routes';
import styles from '../CompanyResearch.module.scss';
import type { CompanySectionProps } from './ProfileSection';

interface StructureRow {
  readonly key: string;
  readonly depth: 0 | 1 | 2;
  readonly name: string;
  readonly instrumentId: string | null;
  readonly relation: string;
  readonly sharePercent: number | null;
  readonly isListed: boolean;
  readonly isThisCompany: boolean;
}

function rowFor(company: RelatedCompanyDto, depth: StructureRow['depth']): StructureRow {
  return {
    key: `${company.relation}:${company.name}`,
    depth,
    name: company.name,
    instrumentId: company.instrumentId === null ? null : String(company.instrumentId),
    relation: company.relation.replaceAll('_', ' '),
    sharePercent: company.sharePercent,
    isListed: company.isListed,
    isThisCompany: false,
  };
}

// Parent at the top, this company under it with its own holdings beneath, then its siblings.
function structureRows(structure: CorporateStructureDto, instrumentId: string): StructureRow[] {
  const hasParent = structure.parent !== null;
  const ownDepth = hasParent ? 1 : 0;
  const below = structure.related.filter(
    (item) => item.relation === 'subsidiary' || item.relation === 'associate',
  );
  const siblings = structure.related.filter((item) => item.relation === 'group_company');
  return [
    // The parent's published share is of this company, so it is shown on this company's row.
    ...(structure.parent === null ? [] : [{ ...rowFor(structure.parent, 0), sharePercent: null }]),
    {
      key: 'this',
      depth: ownDepth,
      name: structure.companyName,
      instrumentId,
      relation: 'this company',
      sharePercent: structure.parent?.sharePercent ?? null,
      isListed: true,
      isThisCompany: true,
    },
    ...below.map((item) => rowFor(item, hasParent ? 2 : 1)),
    ...siblings.map((item) => rowFor(item, ownDepth)),
  ];
}

const DEPTH_CLASS = ['', styles.indent1, styles.indent2] as const;

export function GroupStructureSection({ instrumentId }: CompanySectionProps): ReactElement | null {
  const classification = useInstrumentClassification(instrumentId);
  const structure = useCorporateStructure(instrumentId);
  const holdings = usePortfolioHoldings();
  const title = 'Group structure';

  // A fund or a commodity has no corporate structure; the fund's holdings are shown instead.
  if (classification.data !== undefined && classification.data.kind !== 'company') return null;
  if (structure.isError || holdings.isError) {
    return (
      <Card title={title}>
        <ErrorState
          title="Group structure unavailable"
          message={structure.error?.message ?? holdings.error?.message ?? 'Unknown error'}
          onRetry={() => {
            void structure.refetch();
            void holdings.refetch();
          }}
        />
      </Card>
    );
  }
  if (structure.data === undefined || holdings.data === undefined) {
    return (
      <Card title={title}>
        <LoadingState layout="detail" />
      </Card>
    );
  }
  if (structure.data.parent === null && structure.data.related.length === 0) {
    return (
      <Card title={title}>
        <p className={styles.description}>
          {structure.data.groupName === null
            ? 'No parent and no business group: this company stands on its own.'
            : `Part of ${structure.data.groupName}, with no other listed group company tracked.`}
        </p>
      </Card>
    );
  }

  const held = new Set(holdings.data.map((holding) => String(holding.instrumentId)));
  const rows = structureRows(structure.data, instrumentId);
  const heldCount = rows.filter(
    (row) => row.instrumentId !== null && held.has(row.instrumentId),
  ).length;

  return (
    <Card title={title}>
      <div className={styles.stack}>
        {structure.data.groupName !== null && (
          <span className={styles.meta}>
            {structure.data.groupName}: you hold {String(heldCount)} of the {String(rows.length)}{' '}
            companies listed here.
          </span>
        )}
        <ul className={styles.list}>
          {rows.map((row) => (
            <li key={row.key} className={`${styles.inline} ${DEPTH_CLASS[row.depth]}`}>
              {row.isThisCompany ? (
                <strong>{row.name}</strong>
              ) : row.instrumentId === null ? (
                <span>{row.name}</span>
              ) : (
                <Link to={companyResearchPath(row.instrumentId)}>{row.name}</Link>
              )}
              <Badge variant="neutral">{row.relation}</Badge>
              {row.sharePercent !== null && (
                <span className={styles.meta}>
                  {row.sharePercent.toFixed(1)}% held in the group
                </span>
              )}
              {!row.isListed && <span className={styles.meta}>Not listed</span>}
              {row.instrumentId !== null && held.has(row.instrumentId) && (
                <Badge variant="info">You hold this</Badge>
              )}
            </li>
          ))}
        </ul>
        <span className={styles.evidence}>{structure.data.note}</span>
      </div>
    </Card>
  );
}
