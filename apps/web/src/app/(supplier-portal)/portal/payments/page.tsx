import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalPaymentRuns } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalPaymentTable } from '@/features/portal/blocks/portal-payment-table';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function PortalPaymentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const ctx = await getRequestContext();

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
  const result = await getPortalPaymentRuns(ctx, supplier.supplierId, {
    page: params.page,
    limit: '20',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="View payment runs and download remittance advice."
        breadcrumbs={[{ label: 'Portal', href: routes.portal.dashboard }, { label: 'Payments' }]}
      />

      {result.ok ? (
        <PortalPaymentTable data={result.value.data} total={result.value.total} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{result.error.message}</p>
        </div>
      )}
    </div>
  );
}
