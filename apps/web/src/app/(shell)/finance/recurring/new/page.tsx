import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { getLedgers } from '@/features/finance/ledgers/queries/ledger.queries';
import { RecurringTemplateForm } from '@/features/finance/recurring/forms/recurring-template-form';
import { routes } from '@/lib/constants';

export const metadata = { title: 'New Recurring Template' };

export default async function RecurringNewPage() {
  const ctx = await getRequestContext();
  const ledgersResult = await getLedgers(ctx, { limit: '100' });

  const ledgers = ledgersResult.ok
    ? ledgersResult.value.data.map((l) => ({
        id: l.id,
        name: l.name,
        companyId: l.companyId,
      }))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Recurring Template"
        description="Create a recurring journal template for scheduled postings."
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Recurring Templates', href: routes.finance.recurring },
          { label: 'New' },
        ]}
      />

      <RecurringTemplateForm ledgers={ledgers} />
    </div>
  );
}
