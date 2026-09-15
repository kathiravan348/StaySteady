// Display Preferences screen (UI spec 16.8).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';
import { useDisplaySettings } from '../../shared/display/useDisplaySettings';
import { DisplaySettingsPanel } from '../../shared/display/DisplaySettingsPanel';

export function SettingsDisplayPage(): ReactElement {
  const display = useDisplaySettings();

  return (
    <PageShell
      title="Display & Accessibility Preferences"
      description="Interface theme, density spacing, and gain/loss color conventions"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Settings' },
        { label: 'Display' },
      ]}
    >
      <div
        style={{
          maxWidth: '600px',
          padding: 'var(--space-5)',
          backgroundColor: 'var(--surface-raised)',
          borderRadius: 'var(--radius-md)',
          border: 'var(--border-width-thin) solid var(--border-subtle)',
        }}
      >
        <DisplaySettingsPanel display={display} />
      </div>
    </PageShell>
  );
}
