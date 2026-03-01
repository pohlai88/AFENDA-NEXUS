import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalWhtCertificateDetail,
} from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { MoneyCell } from '@/components/erp/money-cell';
import { DateCell } from '@/components/erp/date-cell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PortalWhtDetailPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

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
  const result = await getPortalWhtCertificateDetail(ctx, supplier.supplierId, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Error loading certificate</h2>
        <p className="mt-1 text-sm text-muted-foreground">{result.error.message}</p>
      </div>
    );
  }

  const cert = result.value;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'WHT Certificates', href: routes.portal.wht },
          { label: cert.certificateNumber },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>{cert.certificateNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Period Start</p>
              <DateCell date={cert.periodStart} format="long" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Period End</p>
              <DateCell date={cert.periodEnd} format="long" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">WHT Amount</p>
              <MoneyCell amount={cert.whtAmount} currency={cert.currencyCode} showCode />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Issued</p>
              <DateCell date={cert.issuedAt} format="long" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </Suspense>
  );
}
