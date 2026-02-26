import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/erp/page-header';
import { StatusBadge } from '@/components/erp/status-badge';
import { DateCell } from '@/components/erp/date-cell';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getRecurringTemplate } from '@/features/finance/recurring/queries/recurring.queries';
import { RecurringTemplateActions } from '@/features/finance/recurring/blocks/recurring-template-actions';
import { Badge } from '@/components/ui/badge';
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

export const metadata = { title: 'Recurring Template Detail' };

interface RecurringDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecurringDetailPage({ params }: RecurringDetailPageProps) {
  const { id } = await params;
  const ctx = await getRequestContext();

  const result = await getRecurringTemplate(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load recurring template');
  }

  const template = result.value;
  const totalDebit = template.lines.reduce((sum, l) => sum + Number(l.debit), 0);
  const totalCredit = template.lines.reduce((sum, l) => sum + Number(l.credit), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.description}
        description={`Recurring ${template.frequency.toLowerCase()} journal template.`}
        breadcrumbs={[
          { label: 'Finance', href: '/finance/journals' },
          { label: 'Recurring Templates', href: '/finance/recurring' },
          { label: template.description },
        ]}
        actions={
          <RecurringTemplateActions
            templateId={template.id}
            templateName={template.description}
            isActive={template.isActive}
          />
        }
      />

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-6 rounded-md border p-4">
        <div>
          <span className="text-xs text-muted-foreground">Status</span>
          <div className="mt-1">
            <StatusBadge status={template.isActive ? 'OPEN' : 'CLOSED'} />
          </div>
        </div>
        <Separator orientation="vertical" className="hidden h-10 sm:block" />
        <div>
          <span className="text-xs text-muted-foreground">Frequency</span>
          <div className="mt-1">
            <Badge variant="outline">{template.frequency}</Badge>
          </div>
        </div>
        <Separator orientation="vertical" className="hidden h-10 sm:block" />
        <div>
          <span className="text-xs text-muted-foreground">Next Run</span>
          <div className="mt-1 text-sm">
            <DateCell date={template.nextRunDate} format="medium" />
          </div>
        </div>
        <Separator orientation="vertical" className="hidden h-10 sm:block" />
        <div>
          <span className="text-xs text-muted-foreground">Ledger</span>
          <div className="mt-1 text-sm font-medium">{template.ledgerName ?? template.ledgerId}</div>
        </div>
        <Separator orientation="vertical" className="hidden h-10 sm:block" />
        <div>
          <span className="text-xs text-muted-foreground">Created</span>
          <div className="mt-1 text-sm">
            <DateCell date={template.createdAt} format="medium" />
          </div>
        </div>
      </div>

      {/* Template lines */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Template Lines</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Account Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[140px] text-right">Debit</TableHead>
                <TableHead className="w-[140px] text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {template.lines.map((line, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{line.accountCode}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {line.description ?? '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {Number(line.debit) > 0 ? Number(line.debit).toLocaleString() : ''}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {Number(line.credit) > 0 ? Number(line.credit).toLocaleString() : ''}
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
    </div>
  );
}
