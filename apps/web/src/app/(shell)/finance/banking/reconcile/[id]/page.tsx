import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ArrowLeft, FileText } from 'lucide-react';
import {
  getBankStatementById,
  getBankTransactions,
  getGLTransactions,
  getMatchSuggestions,
  getReconciliationSession,
} from '@/features/finance/banking/queries/banking.queries';
import { ReconciliationWorkspace } from '@/features/finance/banking/blocks/reconciliation-workspace';

export const metadata = {
  title: 'Reconciliation | Banking | Afenda',
  description: 'Reconcile bank statement transactions',
};

interface ReconcilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ReconcilePage({ params }: ReconcilePageProps) {
  const { id } = await params;

  const [statementResult, sessionResult, transactionsResult, glResult, suggestionsResult] =
    await Promise.all([
      getBankStatementById(id),
      getReconciliationSession(id),
      getBankTransactions({ statementId: id }),
      getGLTransactions({ bankAccountId: 'ba-1', unreconciledOnly: true }),
      getMatchSuggestions({ statementId: id }),
    ]);

  if (!statementResult.ok) {
    notFound();
  }

  if (!sessionResult.ok || !transactionsResult.ok || !glResult.ok || !suggestionsResult.ok) {
    throw new Error('Failed to load reconciliation data');
  }

  const statement = statementResult.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={routes.finance.banking}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent p-2">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <PageHeaderHeading>
                Reconcile: {statement.bankAccountName}
              </PageHeaderHeading>
              <PageHeaderDescription>
                Statement period: {formatDate(statement.startDate)} - {formatDate(statement.endDate)}
                {' • '}
                Closing balance: {formatCurrency(statement.closingBalance, statement.currency)}
              </PageHeaderDescription>
            </div>
          </div>
        </div>
      </PageHeader>

      <ReconciliationWorkspace
        session={sessionResult.data}
        bankTransactions={transactionsResult.data}
        glTransactions={glResult.data}
        suggestions={suggestionsResult.data}
        statementId={id}
      />
    </div>
  );
}
