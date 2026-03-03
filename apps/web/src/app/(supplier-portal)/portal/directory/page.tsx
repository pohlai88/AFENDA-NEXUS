import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalDirectory } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalDirectorySections } from '@/features/portal/blocks/portal-directory-sections';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import type { Department } from '@/features/portal/queries/portal.queries';
import type { RequestContext } from '@afenda/core';

interface PortalDirectoryPageProps {
  searchParams: Promise<{ department?: Department; escalationOnly?: string }>;
}

/**
 * Async child component - enables Suspense streaming
 */
async function DirectoryContent({
  ctx,
  params,
}: {
  ctx: RequestContext;
  params: { department?: Department; escalationOnly?: string };
}) {
  const supplierResult = await getPortalSupplier(ctx);
  if (!supplierResult.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Unable to load supplier profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">{supplierResult.error.message}</p>
      </div>
    );
  }

  const supplier = supplierResult.value;
  const result = await getPortalDirectory(ctx, supplier.supplierId, {
    department: params.department,
    escalationOnly: params.escalationOnly === 'true',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Management Directory"
        description="Contact information for our senior management team. Email addresses may be masked for privacy."
        breadcrumbs={[{ label: 'Portal', href: routes.portal.dashboard }, { label: 'Directory' }]}
      />

      {result.ok ? (
        result.value.length > 0 ? (
          <PortalDirectorySections entries={result.value} />
        ) : (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No directory entries are currently available.
            </p>
          </div>
        )
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{result.error.message}</p>
        </div>
      )}
    </div>
  );
}

export default async function PortalDirectoryPage({ searchParams }: PortalDirectoryPageProps) {
  const [ctx, params] = await Promise.all([getRequestContext(), searchParams]);

  return (
    <Suspense fallback={<LoadingSkeleton variant="cards" />}>
      <DirectoryContent ctx={ctx} params={params} />
    </Suspense>
  );
}
