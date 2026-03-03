/**
 * Phase 1.2.3 CAP-ANNOUNCE — Announcements Page
 *
 * Supplier view: shows all currently active announcements (pinned + unpinned).
 * Pinned announcements are also displayed as persistent banners in the portal shell.
 *
 * SP-7010: /portal/announcements
 */
import { Suspense } from 'react';
import { Megaphone, Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalAnnouncements,
} from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { AnnouncementCard } from '@/features/portal/components/portal-announcements-banner';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/lib/constants';
import type { RequestContext } from '@afenda/core';

export const dynamic = 'force-dynamic';

/**
 * Async child component - enables Suspense streaming
 */
async function AnnouncementsContent({ ctx }: { ctx: RequestContext }) {
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
  const result = await getPortalAnnouncements(ctx, supplier.supplierId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Official notices, service updates, and important information from our team."
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Announcements' },
        ]}
      />

      {result.ok ? (
        result.value.length > 0 ? (
          <div className="space-y-4">
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              {result.value.some((a) => a.severity === 'CRITICAL') && (
                <Badge variant="destructive" className="gap-1">
                  <AlertOctagon className="h-3 w-3" aria-hidden="true" />
                  {result.value.filter((a) => a.severity === 'CRITICAL').length} Critical
                </Badge>
              )}
              {result.value.some((a) => a.severity === 'WARNING') && (
                <Badge
                  variant="outline"
                  className="gap-1 border-amber-400 text-amber-700 dark:text-amber-400"
                >
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  {result.value.filter((a) => a.severity === 'WARNING').length} Warning
                </Badge>
              )}
              {result.value.some((a) => a.severity === 'INFO') && (
                <Badge variant="secondary" className="gap-1">
                  <Info className="h-3 w-3" aria-hidden="true" />
                  {result.value.filter((a) => a.severity === 'INFO').length} Informational
                </Badge>
              )}
            </div>

            {/* Pinned first, then the rest */}
            {result.value
              .slice()
              .sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
            <h3 className="mt-4 font-semibold">No announcements</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              There are no active announcements at this time.
            </p>
          </div>
        )
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Failed to load announcements: {result.error.message}
          </p>
        </div>
      )}
    </div>
  );
}

export default async function PortalAnnouncementsPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton variant="cards" />}>
      <AnnouncementsContent ctx={ctx} />
    </Suspense>
  );
}
