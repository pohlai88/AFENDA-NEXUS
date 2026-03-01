import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { routes } from '@/lib/constants';
import { createApiClient } from '@/lib/api-client';
import { TenantSettingsSchema } from '@afenda/contracts';
import { OrgSettingsForm } from './_components/org-settings-form';
import { saveOrgSettingsAction } from './actions';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Organization Config' };

export default async function OrgConfigPage() {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const result = await api.get<Record<string, unknown>>('/settings/org');

  const settings = TenantSettingsSchema.parse(result.ok ? result.value : {});

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader
        title="Organization Configuration"
        description="Business behavior settings for your organization."
        breadcrumbs={[
          { label: 'Settings', href: routes.settings },
          { label: 'Organization', href: routes.settingsOrganization },
          { label: 'Configuration' },
        ]}
      />

      <div className="max-w-2xl rounded-lg border p-6">
        <OrgSettingsForm settings={settings} onSave={saveOrgSettingsAction} />
      </div>
    </div>
  </Suspense>
  );
}
