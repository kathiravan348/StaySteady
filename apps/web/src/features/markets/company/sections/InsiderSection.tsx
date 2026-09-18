// Insider and promoter dealings where the market publishes them (UI spec 20.1). A market that does
// not report them is said so plainly; an empty list in one that does means nobody dealt.

import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { moneyFromDto } from '../../../../data/api/mappers';
import type { InsiderTransactionDto, InstrumentOwnershipDto } from '../../../../data/schemas';
import { formatIsoDate, formatMoney, formatNumber } from '../../../../shared/format';
import styles from '../CompanyResearch.module.scss';

const ROLE_LABEL: Readonly<Record<InsiderTransactionDto['role'], string>> = {
  promoter: 'Promoter',
  promoter_group: 'Promoter group',
  director: 'Director',
  officer: 'Officer',
};

const ACTION_LABEL: Readonly<Record<InsiderTransactionDto['action'], string>> = {
  buy: 'Bought',
  sell: 'Sold',
  pledge: 'Pledged',
  pledge_release: 'Released pledge',
};

const ACTION_VARIANT: Readonly<
  Record<InsiderTransactionDto['action'], 'positive' | 'negative' | 'neutral'>
> = {
  buy: 'positive',
  sell: 'negative',
  pledge: 'negative',
  pledge_release: 'neutral',
};

export function InsiderSection({
  ownership,
}: {
  readonly ownership: InstrumentOwnershipDto;
}): ReactElement {
  const title = 'Insider and promoter dealings';
  if (!ownership.reportsInsiderTransactions) {
    return (
      <Card title={title}>
        <p className={styles.description}>
          Insider dealings are not collected for this market, so their absence here says nothing
          about whether any took place.
        </p>
      </Card>
    );
  }
  if (ownership.insiderTransactions.length === 0) {
    return (
      <Card title={title}>
        <p className={styles.description}>
          No insider or promoter dealing was disclosed in the last year.
        </p>
      </Card>
    );
  }
  return (
    <Card title={title}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Dealt</th>
              <th scope="col">Disclosed</th>
              <th scope="col">Who</th>
              <th scope="col">Action</th>
              <th scope="col" className={styles.numberCell}>
                Shares
              </th>
              <th scope="col" className={styles.numberCell}>
                Value at that day&apos;s close
              </th>
            </tr>
          </thead>
          <tbody>
            {ownership.insiderTransactions.map((item) => (
              <tr key={item.id}>
                <td>{formatIsoDate(item.dealtOn)}</td>
                <td>{formatIsoDate(item.disclosedOn)}</td>
                <th scope="row">
                  <span className={styles.stack}>
                    <span>{item.personName}</span>
                    <span className={styles.meta}>{ROLE_LABEL[item.role]}</span>
                  </span>
                </th>
                <td>
                  <Badge variant={ACTION_VARIANT[item.action]}>{ACTION_LABEL[item.action]}</Badge>
                </td>
                <td className={styles.numberCell}>{formatNumber(item.shares, { decimals: 0 })}</td>
                <td className={styles.numberCell}>
                  {formatMoney(moneyFromDto(item.value), { compact: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
