import { PageHeader } from '@/components/erp/page-header';
import { DesignateHedgeForm } from '@/features/finance/hedging/forms/designate-hedge-form';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Hedging — New' };

export default function HedgeNewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Designate Hedge Relationship"
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Hedging', href: routes.finance.hedges },
          { label: 'New' },
        ]}
      />
      <div className="mx-auto max-w-2xl rounded-lg border p-6">
        <DesignateHedgeForm />
      </div>
    </div>
  );
}
