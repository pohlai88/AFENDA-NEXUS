import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getIcAgreements } from '@/features/finance/intercompany/queries/ic.queries';
import { IcTransactionCreateForm } from '@/features/finance/intercompany/forms/ic-transaction-form';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Create IC Transaction' };

export default async function IcTransactionNewPage() {
  const ctx = await getRequestContext();

  const agreementsResult = await getIcAgreements(ctx, { limit: '100' });

  if (!agreementsResult.ok) {
    handleApiError(agreementsResult, 'Failed to load IC agreements');
  }

  const agreements = agreementsResult.value.data.map((a) => ({
    id: a.id,
    sellerCompanyName: a.sellerCompanyName,
    buyerCompanyName: a.buyerCompanyName,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create IC Transaction"
        description="Create a new intercompany transaction with paired journal entries."
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Intercompany', href: routes.finance.icTransactions },
          { label: 'New' },
        ]}
      />

      <IcTransactionCreateForm agreements={agreements} />
    </div>
  );
}
