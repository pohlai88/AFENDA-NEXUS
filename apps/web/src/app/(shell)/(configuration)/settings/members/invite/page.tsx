import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { routes } from '@/lib/constants';
import { InviteForm } from './_components/invite-form';

export const metadata = { title: 'Invite Member' };

export default async function InviteMemberPage() {
  await getRequestContext();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invite Member"
        description="Send an invitation to join your organization."
        breadcrumbs={[
          { label: 'Settings', href: routes.settings },
          { label: 'Members', href: routes.settingsMembers },
          { label: 'Invite' },
        ]}
      />

      <div className="rounded-lg border p-6">
        <InviteForm />
      </div>
    </div>
  );
}
