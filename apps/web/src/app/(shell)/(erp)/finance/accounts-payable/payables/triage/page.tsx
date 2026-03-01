import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { ApListSection } from '@/features/finance/payables/blocks/ap-list-section';
import { routes } from '@/lib/constants';

export const metadata = {
  title: 'Triage Queue',
  description: 'Incomplete AP invoices requiring review and resolution.',
};

/**
 * Triage queue — invoices with status INCOMPLETE.
 * Uses the same list component with status=INCOMPLETE preset.
 */
export default async function TriagePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const triageParams = {
    ...params,
    status: 'INCOMPLETE' as const,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Triage Queue"
        description="Incomplete invoices requiring review. Resolve or assign for completion."
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.root },
          { label: 'Payables', href: routes.finance.payables },
          { label: 'Triage' },
        ]}
        actions={
          <Link
            href={routes.finance.payables}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all invoices
          </Link>
        }
      />

      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <ApListSection
          params={triageParams}
          baseUrl={routes.finance.triage}
          statusLocked="INCOMPLETE"
        />
      </Suspense>
    </div>
  );
}
