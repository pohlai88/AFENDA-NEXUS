import { PageHeader } from '@/components/erp/page-header';
import { JournalDraftForm } from '@/features/finance/journals/forms/journal-draft-form';
import { createJournalAction } from '@/features/finance/journals/actions/journal.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'New Journal' };

export default function NewJournalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Journal"
        description="Draft a new general ledger journal entry."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Journals', href: routes.finance.journals },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-3xl">
        <JournalDraftForm onSubmit={createJournalAction} />
      </div>
    </div>
  );
}
