import { PageHeader } from '@/components/erp/page-header';
import { CreateReviewForm } from '@/features/finance/credit/forms/create-review-form';
import { createCreditReviewAction } from '@/features/finance/credit/actions/credit.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'New Credit Review | Finance' };

export default function NewCreditReviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Credit Review"
        description="Initiate a new credit review for a customer."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Credit Management', href: routes.finance.creditLimits },
          { label: 'Reviews', href: routes.finance.creditReviews },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <CreateReviewForm onSubmit={createCreditReviewAction} />
      </div>
    </div>
  );
}
