import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { StatementsSection } from '@/features/finance/banking/blocks/banking-sections';
import { routes } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Bank Statements | Finance' };

export default function BankStatementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Statements"
        description="View imported bank statements for reconciliation."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Banking', href: routes.finance.banking },
          { label: 'Statements' },
        ]}
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <StatementsSection />
      </Suspense>
    </div>
  );
}
