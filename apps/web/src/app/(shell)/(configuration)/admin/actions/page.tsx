import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import { ActionLogTable } from './_components/action-log-table';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Admin Actions — Admin' };

export default async function AdminActionsPage() {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const result = await api.get<{
    data: Array<{
      id: string;
      adminUserId: string;
      action: string;
      targetTenantId: string | null;
      targetUserId: string | null;
      details: unknown;
      occurredAt: string;
    }>;
    total: number;
  }>('/admin/actions');

  const data = result.ok ? result.value.data : [];

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader
        title="Admin Action Log"
        description="All platform admin actions are double-logged here (I-KRN-07)."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Actions' }]}
      />

      <ActionLogTable entries={data} />
    </div>
  </Suspense>
  );
}
