'use client';

import { Badge } from '@/components/ui/badge';

interface TenantDetail {
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
}

export function TenantDetailView({ tenant }: { tenant: TenantDetail }) {
  const statusVariant =
    tenant.status === 'ACTIVE'
      ? 'default'
      : tenant.status === 'SUSPENDED'
        ? 'destructive'
        : 'secondary';

  return (
    <div className="rounded-md border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{tenant.displayName ?? tenant.name}</h2>
          <p className="text-sm text-muted-foreground">{tenant.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant}>{tenant.status}</Badge>
          <Badge variant="outline">{tenant.planTier}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium text-muted-foreground">Tenant ID</p>
          <p className="font-mono text-xs">{tenant.id}</p>
        </div>
        <div>
          <p className="font-medium text-muted-foreground">Settings Version</p>
          <p>{tenant.settingsVersion}</p>
        </div>
        <div>
          <p className="font-medium text-muted-foreground">Created</p>
          <p>{new Date(tenant.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="font-medium text-muted-foreground">Updated</p>
          <p>{new Date(tenant.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
