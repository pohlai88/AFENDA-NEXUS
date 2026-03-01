import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { routes } from '@/lib/constants';
import { MembersTable } from './_components/members-table';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

export const metadata = { title: 'Members' };

export default async function MembersPage() {
  const ctx = await getRequestContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Members"
          description="Manage organization members and their roles."
          breadcrumbs={[
            { label: 'Settings', href: routes.settings },
            { label: 'Members' },
          ]}
        />
        <Button asChild>
          <Link href={routes.settingsMembersInvite}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Link>
        </Button>
      </div>

      <MembersTable currentUserId={ctx.userId} />
    </div>
  );
}
