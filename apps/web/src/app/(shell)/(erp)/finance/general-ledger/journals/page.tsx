import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { JournalListSection } from '@/features/finance/journals/blocks/journal-list-section';
import { routes } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const metadata = { title: 'Journals' };

type Params = { status?: string; periodId?: string; q?: string; from?: string; to?: string; page?: string; limit?: string };

export default async function JournalsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journals"
        description="General ledger journal entries."
        breadcrumbs={[{ label: 'Finance', href: routes.finance.journals }, { label: 'Journals' }]}
        actions={
          <Button asChild>
            <Link href={routes.finance.journalNew}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Create Journal</Link>
          </Button>
        }
      />

      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <JournalListSection params={params} />
      </Suspense>
    </div>
  );
}
