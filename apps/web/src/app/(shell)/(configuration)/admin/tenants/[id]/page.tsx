import { Suspense } from 'react';
import type { RequestContext } from '@afenda/core';
import { requireAuth, getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import { TenantDetailView } from './_components/tenant-detail-view';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Admin — Tenants' };

async function AdminTenantDetailContent({ ctx, id }: { ctx: RequestContext; id: string }) {
  const api = createApiClient(ctx);

  const result = await api.get<{
    id: string;
    name: string;
    slug: string;
    status: string;
    planTier: string;
    displayName: string | null;
    logoUrl: string | null;
    settingsVersion: number;
    createdAt: string;
    updatedAt: string;
  }>(`/admin/tenants/${id}`);

  if (!result.ok) {
    return <p className="p-6 text-destructive">Tenant not found.</p>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Tenant Detail</h1>
      <TenantDetailView tenant={result.value} />
    </div>
  );
}

export default async function AdminTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, requireAuth()]);
  const ctx = await getRequestContext(session);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AdminTenantDetailContent ctx={ctx} id={id} />
    </Suspense>
  );
}
