import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { getWHTCertificates } from '@/features/finance/tax/queries/tax.queries';
import { WHTCertificatesTable } from '@/features/finance/tax/blocks/wht-certificates-table';
import { routes } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'WHT Certificates | Finance' };

async function WHTSection({ status }: { status?: string }) {
  const ctx = await getRequestContext();
  const result = await getWHTCertificates(ctx, { status });
  if (!result.ok) throw new Error(result.error);
  return <WHTCertificatesTable certificates={result.data} />;
}

export default async function WHTCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="WHT Certificates"
        description="Issue and manage withholding tax certificates."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Tax', href: routes.finance.tax },
          { label: 'WHT Certificates' },
        ]}
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <WHTSection status={status} />
      </Suspense>
    </div>
  );
}
