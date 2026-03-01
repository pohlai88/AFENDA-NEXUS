import { PageHeader } from '@/components/erp/page-header';
import { CostCenterForm } from '@/features/finance/cost-accounting/forms/cost-center-form';
import { createCostCenterAction } from '@/features/finance/cost-accounting/actions/cost-accounting.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'New Cost Center | Finance' };

export default function NewCostCenterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Cost Center"
        description="Define a new cost center for cost accounting."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Cost Accounting', href: routes.finance.costCenters },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <CostCenterForm onSubmit={createCostCenterAction} />
      </div>
    </div>
  );
}
