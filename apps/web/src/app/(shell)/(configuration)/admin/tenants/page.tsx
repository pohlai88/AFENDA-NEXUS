import { Suspense } from 'react';
import type { RequestContext } from '@afenda/core';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import { TenantsTable } from './_components/tenants-table';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Tenants — Admin' };

async function AdminTenantsContent({ ctx }: { ctx: RequestContext }) {
  const api = createApiClient(ctx);
  const result = await api.get<{
    data: Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
      planTier: string;
      createdAt: string;
    }>;
    total: number;
  }>('/admin/tenants');

  const data = result.ok ? result.value.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Management"
        description="View, suspend, and manage platform tenants."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Tenants' }]}
      />

      <TenantsTable tenants={data} />
    </div>
  );
}

export default async function AdminTenantsPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AdminTenantsContent ctx={ctx} />
    </Suspense>
  );
}
