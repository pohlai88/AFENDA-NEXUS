import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import type { RequestContext } from '@afenda/core';
import { handleApiError } from '@/lib/api-error.server';
import { getRecurringTemplate } from '@/features/finance/recurring/queries/recurring.queries';
import { RecurringTemplateActions } from '@/features/finance/recurring/blocks/recurring-template-actions';
import {
  RecurringSummaryBar,
  RecurringLinesTable,
} from '@/features/finance/recurring/blocks/recurring-detail-blocks';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Recurring Template Detail' };

interface RecurringDetailPageProps {
  params: Promise<{ id: string }>;
}

async function RecurringDetailContent({ ctx, id }: { ctx: RequestContext; id: string }) {
  const result = await getRecurringTemplate(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load recurring template');
  }

  const template = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.description}
        description={`Recurring ${template.frequency.toLowerCase()} journal template.`}
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Recurring Templates', href: routes.finance.recurring },
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

      <RecurringSummaryBar
        isActive={template.isActive}
        frequency={template.frequency}
        nextRunDate={template.nextRunDate}
        ledgerName={template.ledgerName ?? null}
        ledgerId={template.ledgerId}
        createdAt={template.createdAt}
      />

      <RecurringLinesTable lines={template.lines} />
    </div>
  );
}

export default async function RecurringDetailPage({ params }: RecurringDetailPageProps) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RecurringDetailContent ctx={ctx} id={id} />
    </Suspense>
  );
}
