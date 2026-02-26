import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalDisputeDetail,
} from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { StatusBadge } from '@/components/erp/status-badge';
import { DateCell } from '@/components/erp/date-cell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { routes } from '@/lib/constants';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PortalDisputeDetailPage({ params }: Props) {
  const { id } = await params;
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
  const result = await getPortalDisputeDetail(ctx, supplier.supplierId, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Error loading dispute</h2>
        <p className="mt-1 text-sm text-muted-foreground">{result.error.message}</p>
      </div>
    );
  }

  const dispute = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Disputes', href: routes.portal.disputes },
          { label: dispute.subject },
        ]}
        actions={<StatusBadge status={dispute.status} />}
      />

      <Card>
        <CardHeader>
          <CardTitle>{dispute.subject}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Category</p>
              <Badge variant="outline" className="mt-1 text-xs">
                {dispute.category}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <div className="mt-1">
                <StatusBadge status={dispute.status} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Created</p>
              <DateCell date={dispute.createdAt} format="long" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
              <DateCell date={dispute.updatedAt} format="long" />
            </div>
          </div>

          {(dispute.invoiceId || dispute.paymentRunId) && (
            <div className="grid grid-cols-2 gap-4">
              {dispute.invoiceId && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Related Invoice</p>
                  <p className="text-sm font-mono">{dispute.invoiceId}</p>
                </div>
              )}
              {dispute.paymentRunId && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Related Payment Run</p>
                  <p className="text-sm font-mono">{dispute.paymentRunId}</p>
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{dispute.description}</p>
          </div>

          {dispute.resolution && (
            <div className="rounded-md border bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">Resolution</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{dispute.resolution}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
