import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { AccountListSection } from '@/features/finance/accounts/blocks/account-list-section';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Chart of Accounts' };

type Params = { type?: string; active?: string; q?: string; page?: string; limit?: string };

export default async function AccountsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        description="Manage your general ledger account structure."
        breadcrumbs={[{ label: 'Finance', href: routes.finance.journals }, { label: 'Accounts' }]}
      />

      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <AccountListSection params={params} />
      </Suspense>
    </div>
  );
}
