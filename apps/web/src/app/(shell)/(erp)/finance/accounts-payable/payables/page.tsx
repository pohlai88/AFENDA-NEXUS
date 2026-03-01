import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { ApListSection } from '@/features/finance/payables/blocks/ap-list-section';
import { routes } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const metadata = { title: 'Payables' };

type Params = { status?: string; supplierId?: string; q?: string; from?: string; to?: string; page?: string; limit?: string };

export default async function PayablesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payables"
        description="Accounts payable invoices from suppliers."
        breadcrumbs={[{ label: 'Finance', href: routes.finance.payables }, { label: 'Payables' }]}
        actions={
          <Button asChild>
            <Link href={routes.finance.payableNew}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Create Invoice</Link>
          </Button>
        }
      />

      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <ApListSection params={params} />
      </Suspense>
    </div>
  );
}
