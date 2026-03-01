import { Suspense } from 'react';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { getBankAccounts } from '@/features/finance/banking/queries/banking.queries';
import { StatementImportForm } from '@/features/finance/banking/blocks/statement-import-form';
import { getRequestContext } from '@/lib/auth';

export const metadata = {
  title: 'Import Statement | Banking | Afenda',
  description: 'Import a bank statement for reconciliation',
};

export default async function ImportStatementPage() {
  const ctx = await getRequestContext();
  const accountsResult = await getBankAccounts(ctx);

  if (!accountsResult.ok) {
    throw new Error(accountsResult.error);
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="flex flex-col gap-6 max-w-2xl">
        <PageHeader>
          <PageHeaderHeading>Import Bank Statement</PageHeaderHeading>
          <PageHeaderDescription>
            Upload a bank statement file to import transactions for reconciliation.
          </PageHeaderDescription>
        </PageHeader>

        <StatementImportForm bankAccounts={accountsResult.data} />
      </div>
    </Suspense>
  );
}
