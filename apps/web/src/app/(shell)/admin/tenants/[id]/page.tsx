import { requireAuth, getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import { TenantDetailView } from './_components/tenant-detail-view';

export default async function AdminTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const ctx = await getRequestContext(session);
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
