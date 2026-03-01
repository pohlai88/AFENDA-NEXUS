import { PageHeader } from '@/components/erp/page-header';
import { CostDriverForm } from '@/features/finance/cost-accounting/forms/cost-driver-form';
import { createCostDriverAction } from '@/features/finance/cost-accounting/actions/cost-accounting.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'New Cost Driver | Finance' };

export default function NewCostDriverPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Cost Driver"
        description="Define a new cost driver for activity-based costing."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Cost Accounting', href: routes.finance.costCenters },
          { label: 'Drivers', href: routes.finance.costDrivers },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <CostDriverForm onSubmit={createCostDriverAction} />
      </div>
    </div>
  );
}
