import { Suspense } from 'react';
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
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const r = await getJournal(ctx, id);
  if (!r.ok) return { title: 'Journal | Finance' };
  return { title: `${r.value.documentNumber} | Journals | Finance` };
}

export default async function JournalDetailPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getJournal(ctx, id);
  if (!result.ok) { if (result.error.statusCode === 404) notFound(); handleApiError(result, 'Failed to load journal'); }
  const j = result.value;

  const auditResult = await getJournalAuditAction(id);
  const auditEntries = auditResult.ok ? auditResult.value : [];

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader title={j.documentNumber} breadcrumbs={[{ label: 'Finance' }, { label: 'Journals', href: routes.finance.journals }, { label: j.documentNumber }]} />

      <BusinessDocument
        header={<JournalDetailHeader journal={j} />}
        tabs={[
          { value: 'lines', label: 'Lines', content: <JournalLinesTable lines={j.lines} currency={j.currency} totalDebit={j.totalDebit} totalCredit={j.totalCredit} /> },
          { value: 'audit', label: 'Audit Trail', content: <AuditPanel entries={auditEntries} /> },
        ]}
        defaultTab="lines"
        rightRail={<JournalActions journalId={j.id} status={j.status} lines={j.lines} currency={j.currency} />}
      />
    </div>
  </Suspense>
  );
}
