import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { OrgProfileForm } from './_components/org-profile-form';
import { OrgDangerZone } from './_components/org-danger-zone';

export const metadata = { title: 'Organization Settings' };

export default async function OrganizationSettingsPage() {
  const ctx = await getRequestContext();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Organization"
        description="Manage your organization profile and settings."
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Organization' },
        ]}
      />

      <div className="max-w-2xl space-y-8">
        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <OrgProfileForm />
        </section>

        <OrgDangerZone orgName={`org-${ctx.tenantId.slice(0, 8)}`} />
      </div>
    </div>
  );
}
