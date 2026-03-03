/**
 * SP-7012 (CAP-SEARCH): Portal Invoices Page — with filter bar and pagination.
 */
import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalInvoices } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalInvoiceTable } from '@/features/portal/blocks/portal-invoice-table';
import { PortalInvoiceFilterBar } from '@/features/portal/blocks/portal-invoice-filter-bar';
import { Pagination } from '@/components/erp/pagination';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/lib/constants';
import { buildListHref } from '@/lib/build-list-href';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import type { Metadata } from 'next';
import type { RequestContext } from '@afenda/core';

export const metadata: Metadata = {
  title: 'Invoices | Supplier Portal',
};

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string; status?: string; q?: string; from?: string; to?: string }>;
}

async function InvoicesPageContent({
  ctx,
  page,
  status,
  q,
  from,
  to,
}: {
  ctx: RequestContext;
  page: number;
  status?: string;
  q?: string;
  from?: string;
  to?: string;
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
  const result = await getPortalInvoices(ctx, supplier.supplierId, {
    page: String(page),
    limit: String(PAGE_SIZE),
    status,
    q,
    from,
    to,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="View and manage your submitted invoices."
        breadcrumbs={[{ label: 'Portal', href: routes.portal.dashboard }, { label: 'Invoices' }]}
        actions={
          <Button asChild>
            <Link href={routes.portal.invoiceSubmit}>Submit Invoice</Link>
          </Button>
        }
      />

      <PortalInvoiceFilterBar
        currentStatus={params.status}
        currentSearch={params.q}
        currentFromDate={params.from}
        currentToDate={params.to}
      />

      {result.ok ? (
        <>
          <PortalInvoiceTable data={result.value.data} total={result.value.total} />
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={result.value.total}
            buildHref={(p) =>
              buildListHref(
                routes.portal.invoices,
                {
                  status: params.status,
                  q: params.q,
                  from: params.from,
                  to: params.to,
                },
                p
              )
            }
          />
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{result.error.message}</p>
        </div>
      )}
    </div>
  );
}

export default async function PortalInvoicesPage({ searchParams }: Props) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);
  const page = Number(params.page ?? '1');

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <InvoicesPageContent
        ctx={ctx}
        page={page}
        status={params.status}
        q={params.q}
        from={params.from}
        to={params.to}
      />
    </Suspense>
  );
}
