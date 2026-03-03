/**
 * SP-7015: Portal API Settings Page (CAP-API P18)
 *
 * Renders the webhook subscription management UI for the authenticated supplier.
 * All state transitions (create / pause / resume / delete / rotate) are handled
 * client-side by PortalWebhookList via fetch calls to the API.
 */
import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalWebhooks } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalWebhookList } from '@/features/portal/blocks/portal-webhook-list';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import type { RequestContext } from '@afenda/core';

export const metadata = {
  title: 'API & Webhooks — Supplier Portal',
};

async function ApiSettingsPageContent({ ctx }: { ctx: RequestContext }) {
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
  const webhooksResult = await getPortalWebhooks(ctx, supplier.supplierId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="API & Webhooks"
        description="Receive real-time event notifications via HTTPS webhooks. Payloads are signed with HMAC-SHA256."
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Settings' },
          { label: 'API & Webhooks' },
        ]}
      />

      <PortalWebhookList
        supplierId={supplier.supplierId}
        initialSubscriptions={webhooksResult.ok ? webhooksResult.value : []}
      />
    </div>
  );
}

export default async function PortalApiSettingsPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ApiSettingsPageContent ctx={ctx} />
    </Suspense>
  );
}
