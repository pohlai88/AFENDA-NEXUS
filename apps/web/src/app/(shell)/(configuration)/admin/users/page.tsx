import { Suspense } from 'react';
import type { RequestContext } from '@afenda/core';
import { requireAuth, getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import { UsersTable } from './_components/users-table';

import type { Metadata } from 'next';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata: Metadata = {
  title: 'Users — Admin',
  description: 'Cross-tenant user management and administration.',
  robots: { index: false, follow: false },
};

async function AdminUsersContent({ ctx }: { ctx: RequestContext }) {
  const api = createApiClient(ctx);

  const result = await api.get<{
    data: Array<{
      id: string;
      tenantId: string;
      email: string;
      displayName: string;
      isActive: boolean;
      createdAt: string;
    }>;
    total: number;
  }>('/admin/users?limit=50');

  const users = result.ok ? result.value.data : [];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="text-sm text-muted-foreground">Cross-tenant user management.</p>
      <UsersTable users={users} />
    </div>
  );
}

export default async function AdminUsersPage() {
  const session = await requireAuth();
  const ctx = await getRequestContext(session);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AdminUsersContent ctx={ctx} />
    </Suspense>
  );
}
