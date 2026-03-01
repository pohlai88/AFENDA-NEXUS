import { PageHeader } from '@/components/erp/page-header';
import { CreateRevenueContractForm } from '@/features/finance/revenue-recognition/forms/create-revenue-contract-form';
import { routes } from '@/lib/constants';

export const metadata = { title: 'New Revenue Contract | Finance' };

export default function NewRevenueContractPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Revenue Contract"
        description="Set up a new IFRS 15 revenue contract."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Revenue Recognition', href: routes.finance.revenueRecognition },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <CreateRevenueContractForm />
      </div>
    </div>
  );
}
