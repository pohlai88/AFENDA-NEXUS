import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import { AuditLogTable } from './_components/audit-log-table';

export const metadata = { title: 'Audit Log' };

export default async function AuditLogPage() {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  const result = await api.get<{
    data: Array<{
      id: string;
      userId: string | null;
      action: string;
      tableName: string;
      recordId: string | null;
      oldData: unknown;
      newData: unknown;
      ipAddress: string | null;
      occurredAt: string;
    }>;
    total: number;
  }>('/audit-log?limit=50');

  const data = result.ok ? result.value.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="View all audited actions within your organization."
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Audit Log' },
        ]}
      />

      <AuditLogTable entries={data} />
    </div>
  );
}
