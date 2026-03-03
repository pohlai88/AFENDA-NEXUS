import { Suspense } from 'react';
import type { RequestContext } from '@afenda/core';
import { PageHeader } from '@/components/erp/page-header';
import { LedgerForm } from '@/features/finance/ledgers/forms/ledger-form';
import { createLedgerAction } from '@/features/finance/ledgers/actions/ledger.actions';
import { getRequestContext } from '@/lib/auth';
import { buildInitialTenantContext } from '@/lib/tenant-context.server';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'New Ledger' };

async function NewLedgerContent({ ctx }: { ctx: RequestContext }) {
  const tenantContext = await buildInitialTenantContext(ctx);
  const companies = tenantContext?.companies ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Ledger"
        description="Add a new general ledger for a company entity."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Ledgers', href: routes.finance.ledgers },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-3xl">
        <LedgerForm onSubmit={createLedgerAction} companies={companies} />
      </div>
    </div>
  );
}

export default async function NewLedgerPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <NewLedgerContent ctx={ctx} />
    </Suspense>
  );
}
