import { PageHeader } from '@/components/erp/page-header';
import { CreateMatchToleranceForm } from '@/features/finance/settings/forms/create-match-tolerance-form';
import { routes } from '@/lib/constants';

export const metadata = { title: 'New Match Tolerance | Finance Settings' };

export default function NewMatchTolerancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Match Tolerance"
        description="Configure a new AP matching threshold."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Settings', href: routes.finance.financeSettings },
          { label: 'Match Tolerance', href: routes.finance.matchTolerance },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <CreateMatchToleranceForm />
      </div>
    </div>
  );
}
