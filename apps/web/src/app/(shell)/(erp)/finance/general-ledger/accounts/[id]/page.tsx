import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/erp/page-header';
import { StatusBadge } from '@/components/erp/status-badge';
import { getRequestContext } from '@/lib/auth';
import type { RequestContext } from '@afenda/core';
import { handleApiError } from '@/lib/api-error.server';
import { getAccount } from '@/features/finance/accounts/queries/account.queries';
import { AccountToggleButton } from '@/features/finance/accounts/blocks/account-toggle-button';
import { routes } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Account Detail' };

async function AccountDetailContent({ ctx, id }: { ctx: RequestContext; id: string }) {
  const result = await getAccount(ctx, id);
  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load account');
  }
  const a = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${a.code} — ${a.name}`}
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Accounts', href: routes.finance.accounts },
          { label: a.name },
        ]}
        actions={
          <AccountToggleButton accountId={a.id} accountName={a.name} isActive={a.isActive} />
        }
      />

      <div className="flex flex-wrap items-center gap-6 rounded-md border p-4">
        <div>
          <span className="text-xs text-muted-foreground">Status</span>
          <div className="mt-1">
            <StatusBadge status={a.isActive ? 'OPEN' : 'CLOSED'} />
          </div>
        </div>
        <Separator orientation="vertical" className="hidden h-10 sm:block" />
        <div>
          <span className="text-xs text-muted-foreground">Account Code</span>
          <div className="mt-1 font-mono text-sm font-medium">{a.code}</div>
        </div>
        <Separator orientation="vertical" className="hidden h-10 sm:block" />
        <div>
          <span className="text-xs text-muted-foreground">Type</span>
          <div className="mt-1">
            <Badge variant="outline">{a.type}</Badge>
          </div>
        </div>
        <Separator orientation="vertical" className="hidden h-10 sm:block" />
        <div>
          <span className="text-xs text-muted-foreground">Normal Balance</span>
          <div className="mt-1">
            <Badge variant="secondary">{a.normalBalance}</Badge>
          </div>
        </div>
        {a.parentId && (
          <>
            <Separator orientation="vertical" className="hidden h-10 sm:block" />
            <div>
              <span className="text-xs text-muted-foreground">Parent Account</span>
              <div className="mt-1 text-sm font-medium">{a.parentId}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AccountDetailContent ctx={ctx} id={id} />
    </Suspense>
  );
}
