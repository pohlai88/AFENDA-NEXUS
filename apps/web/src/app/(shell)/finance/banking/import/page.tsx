import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { getBankAccounts } from '@/features/finance/banking/queries/banking.queries';
import { StatementImportForm } from '@/features/finance/banking/blocks/statement-import-form';

export const metadata = {
  title: 'Import Statement | Banking | Afenda',
  description: 'Import a bank statement for reconciliation',
};

export default async function ImportStatementPage() {
  const accountsResult = await getBankAccounts();

  if (!accountsResult.ok) {
    throw new Error(accountsResult.error);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader>
        <PageHeaderHeading>Import Bank Statement</PageHeaderHeading>
        <PageHeaderDescription>
          Upload a bank statement file to import transactions for reconciliation.
        </PageHeaderDescription>
      </PageHeader>

      <StatementImportForm bankAccounts={accountsResult.data} />
    </div>
  );
}
