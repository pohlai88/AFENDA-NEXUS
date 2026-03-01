import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { ArListSection } from '@/features/finance/receivables/blocks/ar-list-section';
import { routes } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const metadata = { title: 'Receivables' };

type Params = { status?: string; customerId?: string; q?: string; from?: string; to?: string; page?: string; limit?: string };

export default async function ReceivablesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receivables"
        description="Accounts receivable invoices to customers."
        breadcrumbs={[{ label: 'Finance', href: routes.finance.receivables }, { label: 'Receivables' }]}
        actions={
          <Button asChild>
            <Link href={routes.finance.receivableNew}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Create Invoice</Link>
          </Button>
        }
      />

      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <ArListSection params={params} />
      </Suspense>
    </div>
  );
}
