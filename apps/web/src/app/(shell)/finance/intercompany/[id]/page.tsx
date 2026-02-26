import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/erp/page-header';
import { StatusBadge } from '@/components/erp/status-badge';
import { MoneyCell } from '@/components/erp/money-cell';
import { DateCell } from '@/components/erp/date-cell';
import { AuditPanel } from '@/components/erp/audit-panel';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import {
  getIcTransaction,
  type IcJournalLineView,
} from '@/features/finance/intercompany/queries/ic.queries';
import { getIcTransactionAuditAction } from '@/features/finance/intercompany/actions/ic.actions';
import { IcSettleButton } from '@/features/finance/intercompany/blocks/ic-settle-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const metadata = { title: 'IC Transaction Detail' };

interface IcDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function IcTransactionDetailPage({ params }: IcDetailPageProps) {
  const { id } = await params;
  const ctx = await getRequestContext();

  const result = await getIcTransaction(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load IC transaction');
  }

  const tx = result.value;
  const auditResult = await getIcTransactionAuditAction(id);
  const auditEntries = auditResult.ok ? auditResult.value : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tx.description}
        description={`IC transaction between ${tx.sourceCompanyName} and ${tx.mirrorCompanyName}.`}
        breadcrumbs={[
          { label: 'Finance', href: '/finance/journals' },
          { label: 'Intercompany', href: '/finance/intercompany' },
          { label: tx.description },
        ]}
        actions={
          tx.settlementStatus !== 'RECONCILED' ? (
            <IcSettleButton
              transactionId={tx.id}
              sourceCompanyId={tx.sourceCompanyId}
              mirrorCompanyId={tx.mirrorCompanyId}
              amount={tx.amount}
              currency={tx.currency}
            />
          ) : undefined
        }
      />

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-6 rounded-md border p-4">
        <div>
          <span className="text-xs text-muted-foreground">Status</span>
          <div className="mt-1">
            <StatusBadge status={tx.settlementStatus} />
          </div>
        </div>
        <Separator orientation="vertical" className="hidden h-10 sm:block" />
        <div>
          <span className="text-xs text-muted-foreground">Amount</span>
          <div className="mt-1 font-mono text-sm">
            <MoneyCell amount={tx.amount} currency={tx.currency} />
          </div>
        </div>
        <Separator orientation="vertical" className="hidden h-10 sm:block" />
        <div>
          <span className="text-xs text-muted-foreground">Date</span>
          <div className="mt-1 text-sm">
            <DateCell date={tx.transactionDate} format="medium" />
          </div>
        </div>
        <Separator orientation="vertical" className="hidden h-10 sm:block" />
        <div>
          <span className="text-xs text-muted-foreground">Source</span>
          <div className="mt-1 text-sm font-medium">{tx.sourceCompanyName}</div>
        </div>
        <Separator orientation="vertical" className="hidden h-10 sm:block" />
        <div>
          <span className="text-xs text-muted-foreground">Mirror</span>
          <div className="mt-1 text-sm font-medium">{tx.mirrorCompanyName}</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="source" className="space-y-4">
        <TabsList>
          <TabsTrigger value="source">Source Lines</TabsTrigger>
          <TabsTrigger value="mirror">Mirror Lines</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="source">
          <IcLinesTable lines={tx.sourceLines} title={`Source — ${tx.sourceCompanyName}`} />
        </TabsContent>

        <TabsContent value="mirror">
          <IcLinesTable lines={tx.mirrorLines} title={`Mirror — ${tx.mirrorCompanyName}`} />
        </TabsContent>

        <TabsContent value="audit">
          <AuditPanel entries={auditEntries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Paired journal lines table ─────────────────────────────────────────────

function IcLinesTable({ lines, title }: { lines: IcJournalLineView[]; title: string }) {
  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Code</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="w-[140px] text-right">Debit</TableHead>
              <TableHead className="w-[140px] text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{line.accountCode}</TableCell>
                <TableCell>{line.accountName ?? '—'}</TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {Number(line.debit) > 0 ? line.debit : ''}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {Number(line.credit) > 0 ? line.credit : ''}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-semibold">
                Total
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
                {totalDebit.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
                {totalCredit.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
