import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { AuditPanel } from '@/components/erp/audit-panel';
import { CreditDetailHeader } from '@/features/finance/credit/blocks/credit-detail-header';
import { CreditActions } from '@/features/finance/credit/blocks/credit-actions';
import { CreditOverviewTab, CreditHoldTab } from '@/features/finance/credit/blocks/credit-tabs';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getCustomerCreditById, getCreditAudit } from '@/features/finance/credit/queries/credit.queries';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getCustomerCreditById(ctx, id);
  if (!result.ok) return { title: 'Credit Limit | Finance' };
  const c = result.value;
  return { title: `${c.customerCode} — ${c.customerName} | Credit Management | Finance`, description: `Credit limit for ${c.customerCode} — ${c.customerName}` };
}

export default async function CreditDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getCustomerCreditById(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load credit limit');
  }

  const credit = result.value;

  const auditResult = await getCreditAudit(ctx, credit.customerId);
  const auditEntries = auditResult.ok ? auditResult.value.data : [];

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="space-y-6">
        <PageHeader
          title={`${credit.customerCode} — ${credit.customerName}`}
          breadcrumbs={[
            { label: 'Finance' },
            { label: 'Credit Management', href: routes.finance.creditLimits },
            { label: credit.customerCode },
          ]}
        />

        <BusinessDocument
          header={<CreditDetailHeader credit={credit} />}
          tabs={[
            {
              value: 'overview',
              label: 'Overview',
              content: <CreditOverviewTab credit={credit as any} />,
            },
            {
              value: 'hold',
              label: 'Hold Info',
              content: <CreditHoldTab credit={credit as any} />,
            },
            {
              value: 'audit',
              label: 'Audit Trail',
              content: <AuditPanel entries={auditEntries} />,
            },
          ]}
          rightRail={<CreditActions credit={credit as any} />}
        />
      </div>
    </Suspense>
  );
}
