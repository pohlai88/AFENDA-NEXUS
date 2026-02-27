import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { AuditPanel } from '@/components/erp/audit-panel';
import { JournalDetailHeader } from '@/features/finance/journals/blocks/journal-detail-header';
import { JournalLinesTable } from '@/features/finance/journals/blocks/journal-lines-table';
import { JournalActions } from '@/features/finance/journals/blocks/journal-actions';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getJournal } from '@/features/finance/journals/queries/journal.queries';
import { getJournalAuditAction } from '@/features/finance/journals/actions/journal.actions';
import { routes } from '@/lib/constants';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getJournal(ctx, id);
  if (!result.ok) return { title: 'Journal | Finance' };
  const journal = result.value;
  return {
    title: `${journal.documentNumber} | Journals | Finance`,
    description: `Journal ${journal.documentNumber} — ${journal.status} — ${journal.lines.length} lines`,
  };
}

export default async function JournalDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getJournal(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load journal');
  }

  const journal = result.value;

  // Fetch audit trail in parallel
  const auditResult = await getJournalAuditAction(id);
  const auditEntries = auditResult.ok ? auditResult.value : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={journal.documentNumber}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Journals', href: routes.finance.journals },
          { label: journal.documentNumber },
        ]}
      />

      <BusinessDocument
        header={<JournalDetailHeader journal={journal} />}
        tabs={[
          {
            value: 'lines',
            label: 'Lines',
            content: (
              <JournalLinesTable
                lines={journal.lines}
                currency={journal.currency}
                totalDebit={journal.totalDebit}
                totalCredit={journal.totalCredit}
              />
            ),
          },
          {
            value: 'audit',
            label: 'Audit Trail',
            content: <AuditPanel entries={auditEntries} />,
          },
        ]}
        defaultTab="lines"
        rightRail={<JournalActions journalId={journal.id} status={journal.status} />}
      />
    </div>
  );
}
