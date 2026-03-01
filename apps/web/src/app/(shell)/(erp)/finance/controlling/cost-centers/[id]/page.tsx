import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { AuditPanel } from '@/components/erp/audit-panel';
import { CostCenterDetailHeader } from '@/features/finance/cost-accounting/blocks/cost-center-detail-header';
import { CostCenterActions } from '@/features/finance/cost-accounting/blocks/cost-center-actions';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getCostCenterById } from '@/features/finance/cost-accounting/queries/cost-accounting.queries';
import { getCostCenterAuditAction } from '@/features/finance/cost-accounting/actions/cost-accounting.actions';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getCostCenterById(ctx, id);
  return !result.ok ? { title: 'Cost Center | Finance' } : { title: `${result.value.code} — ${result.value.name} | Cost Accounting | Finance`, description: `Cost center ${result.value.code} — ${result.value.name} — ${result.value.status}` };
}

export default async function CostCenterDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getCostCenterById(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load cost center');
  }

  const costCenter = result.value;

  const auditResult = await getCostCenterAuditAction(id);
  const auditEntries = auditResult.ok ? auditResult.value : [];

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="space-y-6">
        <PageHeader
          title={`${costCenter.code} — ${costCenter.name}`}
          breadcrumbs={[
            { label: 'Finance' },
            { label: 'Cost Accounting', href: routes.finance.costCenters },
            { label: costCenter.code },
          ]}
        />

        <BusinessDocument
          header={<CostCenterDetailHeader costCenter={costCenter} />}
          tabs={[
            {
              value: 'overview',
              label: 'Overview',
              content: (
                <div className="space-y-4">
                  {costCenter.description && (<div><h3 className="text-sm font-medium text-muted-foreground">Description</h3><p className="mt-1 text-sm">{costCenter.description}</p></div>)}
                  {costCenter.path && costCenter.path.length > 0 && (<div><h3 className="text-sm font-medium text-muted-foreground">Hierarchy Path</h3><p className="mt-1 text-sm font-mono">{costCenter.path.join(' → ')}</p></div>)}
                </div>
              ),
            },
            {
              value: 'audit',
              label: 'Audit Trail',
              content: <AuditPanel entries={auditEntries} />,
            },
          ]}
          defaultTab="overview"
          rightRail={<CostCenterActions costCenterId={costCenter.id} status={costCenter.status} />}
        />
      </div>
    </Suspense>
  );
}
