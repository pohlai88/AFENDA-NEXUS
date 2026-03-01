import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { RecurringListSection } from '@/features/finance/recurring/blocks/recurring-list-section';
import { routes } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const metadata = { title: 'Recurring Templates' };

type Params = { active?: string; q?: string; page?: string; limit?: string };

export default async function RecurringPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Templates"
        description="Manage recurring journal templates for scheduled postings."
        breadcrumbs={[{ label: 'Finance', href: routes.finance.journals }, { label: 'Recurring Templates' }]}
        actions={
          <Button asChild>
            <Link href={routes.finance.recurringNew}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Create Template</Link>
          </Button>
        }
      />

      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <RecurringListSection params={params} />
      </Suspense>
    </div>
  );
}
