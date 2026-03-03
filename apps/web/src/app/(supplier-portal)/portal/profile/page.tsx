import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalProfileForm } from '@/features/portal/forms/portal-profile-form';
import { StatusBadge } from '@/components/erp/status-badge';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import type { RequestContext } from '@afenda/core';

/**
 * Async child component - enables Suspense streaming
 */
async function ProfileContent({ ctx }: { ctx: RequestContext }) {
  const supplierResult = await getPortalSupplier(ctx);
  if (!supplierResult.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Unable to load supplier profile</h2>
        <p className="mt-1 text-muted-foreground">{supplierResult.error.message}</p>
      </div>
    );
  }

  const supplier = supplierResult.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="View and update your supplier profile information."
        breadcrumbs={[{ label: 'Portal', href: routes.portal.dashboard }, { label: 'Profile' }]}
        actions={<StatusBadge status={supplier.status} />}
      />

      <PortalProfileForm supplier={supplier} />
    </div>
  );
}

export default async function PortalProfilePage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProfileContent ctx={ctx} />
    </Suspense>
  );
}
