import { Suspense } from 'react';
import type { RequestContext } from '@afenda/core';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import { ConfigEditor } from './_components/config-editor';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'System Config — Admin' };

async function AdminConfigContent({ ctx }: { ctx: RequestContext }) {
  const api = createApiClient(ctx);
  const result =
    await api.get<Array<{ key: string; value: Record<string, unknown>; updatedAt: string }>>(
      '/admin/config'
    );

  const entries = result.ok ? result.value : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Configuration"
        description="Platform-wide settings controlled by super-admins."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Config' }]}
      />

      <ConfigEditor entries={entries} />
    </div>
  );
}

export default async function AdminConfigPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AdminConfigContent ctx={ctx} />
    </Suspense>
  );
}
