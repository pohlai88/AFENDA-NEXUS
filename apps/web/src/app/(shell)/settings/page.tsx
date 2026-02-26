import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { SettingsTabs } from './_components/settings-tabs';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  await getRequestContext();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account security, API keys, and preferences."
        breadcrumbs={[{ label: 'Settings' }]}
      />

      <SettingsTabs />
    </div>
  );
}
