import { PageHeader } from '@/components/erp/page-header';
import { AllocationRunForm } from '@/features/finance/cost-accounting/forms/allocation-run-form';
import { executeAllocationRunAction } from '@/features/finance/cost-accounting/actions/cost-accounting.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Run Allocation | Finance' };

export default function NewAllocationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Run Cost Allocation"
        description="Execute a cost allocation run using the configured rules and drivers."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Cost Accounting', href: routes.finance.costCenters },
          { label: 'Allocations', href: routes.finance.allocations },
          { label: 'New Run' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <AllocationRunForm onSubmit={executeAllocationRunAction} />
      </div>
    </div>
  );
}
