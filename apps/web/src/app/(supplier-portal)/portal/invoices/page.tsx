import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalInvoices } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalInvoiceTable } from '@/features/portal/blocks/portal-invoice-table';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function PortalInvoicesPage({ searchParams }: Props) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);

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
    page: params.page,
    limit: '20',
    status: params.status,
  });

  return (
    <Suspense fallback={<LoadingSkeleton />}>
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

      {result.ok ? (
        <PortalInvoiceTable data={result.value.data} total={result.value.total} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{result.error.message}</p>
        </div>
      )}
    </div>
    </Suspense>
  );
}
