// Credential references (UI spec 7.18: stored references only, never displayed, with expiry tracking
// and warnings). Each change is saved as a version.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useBrokerConfigs, useCredentialConfigs, useProviderConfigs } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { unregisteredReferences } from './credentials/model/credentialDraft';
import { CredentialsView } from './credentials/sections/CredentialsView';

function CredentialsBody(): ReactElement {
  const credentials = useCredentialConfigs();
  const providers = useProviderConfigs();
  const brokers = useBrokerConfigs();

  const failed = [credentials, providers, brokers].find((query) => query.isError);
  if (failed !== undefined) {
    return (
      <ErrorState
        title="Credential references unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          void credentials.refetch();
          void providers.refetch();
          void brokers.refetch();
        }}
      />
    );
  }
  if (
    credentials.data === undefined ||
    providers.data === undefined ||
    brokers.data === undefined
  ) {
    return <LoadingState layout="detail" count={4} />;
  }
  const unregistered = unregisteredReferences(credentials.data, providers.data, brokers.data);
  if (credentials.data.length === 0 && unregistered.length === 0) {
    return (
      <EmptyState
        title="No credential references"
        description="Nothing connects with a credential yet. Add a reference when a data provider or broker needs one."
      />
    );
  }
  return <CredentialsView entries={credentials.data} unregistered={unregistered} />;
}

export function SettingsCredentialsPage(): ReactElement {
  return (
    <PageShell
      title="Credentials"
      description="Where each credential is kept, what it may do, what uses it and when it expires. The secrets themselves are never entered or shown here."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Settings' },
        { label: 'Credentials' },
      ]}
    >
      <CredentialsBody />
    </PageShell>
  );
}
