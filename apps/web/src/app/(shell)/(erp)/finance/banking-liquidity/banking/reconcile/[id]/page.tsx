import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ArrowLeft, FileText } from 'lucide-react';
import { getBankStatementById, getBankTransactions, getGLTransactions, getMatchSuggestions, getReconciliationSession } from '@/features/finance/banking/queries/banking.queries';
import { ReconciliationWorkspace } from '@/features/finance/banking/blocks/reconciliation-workspace';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { getRequestContext } from '@/lib/auth';

export const metadata = { title: 'Reconciliation | Banking | Afenda', description: 'Reconcile bank statement transactions' };

export default async function ReconcilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getRequestContext();

  const [statementResult, sessionResult, transactionsResult, glResult, suggestionsResult] = await Promise.all([
    getBankStatementById(ctx, id), getReconciliationSession(ctx, id),
    getBankTransactions(ctx, { statementId: id }), getGLTransactions(ctx, { bankAccountId: 'ba-1', unreconciledOnly: true }),
    getMatchSuggestions(ctx, { statementId: id }),
  ]);

  if (!statementResult.ok) notFound();
  if (!sessionResult.ok || !transactionsResult.ok || !glResult.ok || !suggestionsResult.ok) throw new Error('Failed to load reconciliation data');
  const stmt = statementResult.data;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="flex flex-col gap-6">
        <PageHeader>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild><Link href={routes.finance.banking}><ArrowLeft className="h-4 w-4" /></Link></Button>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent p-2"><FileText className="h-5 w-5" /></div>
              <div>
                <PageHeaderHeading>Reconcile: {stmt.bankAccountName}</PageHeaderHeading>
                <PageHeaderDescription>Statement period: {formatDate(stmt.startDate)} - {formatDate(stmt.endDate)}{' \u2022 '}Closing balance: {formatCurrency(stmt.closingBalance, stmt.currency)}</PageHeaderDescription>
              </div>
            </div>
          </div>
        </PageHeader>

        <ReconciliationWorkspace session={sessionResult.data} bankTransactions={transactionsResult.data} glTransactions={glResult.data} suggestions={suggestionsResult.data} statementId={id} />
      </div>
    </Suspense>
  );
}
