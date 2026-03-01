import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { getCreditReviews } from '@/features/finance/credit/queries/credit.queries';
import { CreditReviewsTable } from '@/features/finance/credit/blocks/credit-reviews-table';
import { routes } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Credit Reviews | Finance' };

async function ReviewsSection() {
  const ctx = await getRequestContext();
  const result = await getCreditReviews(ctx);
  const reviews = result.ok ? result.value.data : [];

  return <CreditReviewsTable reviews={reviews} />;
}

export default function CreditReviewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Reviews"
        description="Review and assess customer credit limit change requests."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Credit Management', href: routes.finance.creditLimits },
          { label: 'Reviews' },
        ]}
        actions={[
          {
            label: 'New Review',
            href: `${routes.finance.creditReviews}/new`,
          },
        ]}
      />

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ReviewsSection />
      </Suspense>
    </div>
  );
}
