import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalMessageThreads,
} from '@/features/portal/queries/portal.queries';
import {
  getMessageThreadsAction,
  startThreadAction,
} from '@/features/portal/actions/portal.actions';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import { PortalMessageThreadList } from '@/features/portal/blocks/portal-message-thread-list';
import { PortalNewThreadDialog } from '@/features/portal/forms/portal-new-thread-dialog';
import type { RequestContext } from '@afenda/core';

/**
 * Phase 1.2.1 CAP-MSG — Supplier Portal: Message Threads list page.
 * Route: /portal/messages
 */

async function MessagesPageContent({ ctx }: { ctx: RequestContext }) {
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
  const threadsResult = await getPortalMessageThreads(ctx, supplier.supplierId);

  const threads = threadsResult.ok ? threadsResult.value.items : [];
  const hasMore = threadsResult.ok ? threadsResult.value.hasMore : false;

  async function refreshThreads(supplierId: string) {
    'use server';
    return getMessageThreadsAction(supplierId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Communicate directly with your buyer contacts."
        breadcrumbs={[{ label: 'Portal', href: routes.portal.dashboard }, { label: 'Messages' }]}
        actions={
          <PortalNewThreadDialog supplierId={supplier.supplierId} startThread={startThreadAction} />
        }
      />

      <PortalMessageThreadList
        supplierId={supplier.supplierId}
        initialThreads={threads}
        initialHasMore={hasMore}
        refreshAction={refreshThreads}
      />
    </div>
  );
}

export default async function PortalMessagesPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <MessagesPageContent ctx={ctx} />
    </Suspense>
  );
}
