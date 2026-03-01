import { Suspense } from 'react';
import { requireAuth, getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import { GlobalAuditTable } from './_components/global-audit-table';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Admin — Audit' };

export default async function AdminAuditPage() {
  const session = await requireAuth();
  const ctx = await getRequestContext(session);
  const api = createApiClient(ctx);

  const result = await api.get<{
    data: Array<{
      id: string;
      tenantId: string;
      userId: string | null;
      action: string;
      tableName: string;
      recordId: string | null;
      occurredAt: string;
    }>;
    total: number;
  }>('/admin/audit?limit=50');

  const entries = result.ok ? result.value.data : [];

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Global Audit Log</h1>
      <p className="text-sm text-muted-foreground">Cross-tenant audit viewer.</p>
      <GlobalAuditTable entries={entries} />
    </div>
  </Suspense>
  );
}
