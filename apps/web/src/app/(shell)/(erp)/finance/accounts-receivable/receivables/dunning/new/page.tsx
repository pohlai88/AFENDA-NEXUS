import { PageHeader } from '@/components/erp/page-header';
import { RunDunningForm } from '@/features/finance/receivables/forms/run-dunning-form';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Run Dunning | Finance' };

export default function NewDunningRunPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Run Dunning Process"
        description="Generate dunning letters for overdue receivables."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Receivables', href: routes.finance.receivables },
          { label: 'Dunning', href: routes.finance.dunning },
          { label: 'New Run' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <RunDunningForm />
      </div>
    </div>
  );
}
