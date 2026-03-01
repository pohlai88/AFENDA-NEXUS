import { PageHeader } from '@/components/erp/page-header';
import { CreateInstrumentForm } from '@/features/finance/instruments/forms/create-instrument-form';
import { createInstrumentAction } from '@/features/finance/instruments/actions/instruments.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'New Instrument | Finance' };

export default function NewInstrumentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Financial Instrument"
        description="Register a new financial instrument under IFRS 9."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Instruments', href: routes.finance.instruments },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <CreateInstrumentForm onSubmit={createInstrumentAction} />
      </div>
    </div>
  );
}
