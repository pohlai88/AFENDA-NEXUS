import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { getCreditHolds } from '@/features/finance/credit/queries/credit.queries';
import { CreditHoldsTable } from '@/features/finance/credit/blocks/credit-holds-table';
import { routes } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Credit Holds | Finance' };

async function HoldsSection() {
  const ctx = await getRequestContext();
  const result = await getCreditHolds(ctx);
  const holds = result.ok ? result.value.data : [];

  return <CreditHoldsTable holds={holds} />;
}

export default function CreditHoldsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Holds"
        description="Manage active credit holds across all customers."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Credit Management', href: routes.finance.creditLimits },
          { label: 'Holds' },
        ]}
      />

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <HoldsSection />
      </Suspense>
    </div>
  );
}
