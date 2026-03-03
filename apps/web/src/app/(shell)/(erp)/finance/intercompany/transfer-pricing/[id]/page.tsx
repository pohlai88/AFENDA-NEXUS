import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { RequestContext } from '@afenda/core';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getRequestContext } from '@/lib/auth';
import { getTransferPricingPolicyById } from '@/features/finance/transfer-pricing/queries/transfer-pricing.queries';
import { routes } from '@/lib/constants';
import {
  KPI,
  BenchmarksList,
} from '@/features/finance/transfer-pricing/blocks/policy-detail-blocks';

export const metadata = { title: 'Transfer Pricing' };

async function TransferPricingDetailContent({ ctx, id }: { ctx: RequestContext; id: string }) {
  const result = await getTransferPricingPolicyById(ctx, id);

  if (!result.ok) return notFound();

  const policy = result.value;

  return (
    <>
      <PageHeader
        title={policy.name}
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.root },
          { label: 'Transfer Pricing', href: routes.finance.transferPricing },
          { label: policy.name },
        ]}
      />
      <BusinessDocument>
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline">{policy.status}</Badge>
          <Badge variant="secondary">{policy.transactionType}</Badge>
          <Badge variant="secondary">{policy.pricingMethod}</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <KPI label="Target Margin" value={`${policy.targetMargin}%`} />
          <KPI label="Range Min" value={`${policy.armLengthRange?.min ?? 0}%`} />
          <KPI label="Range Max" value={`${policy.armLengthRange?.max ?? 0}%`} />
          <KPI
            label="Effective From"
            value={policy.effectiveFrom ? new Date(policy.effectiveFrom).toLocaleDateString() : '—'}
          />
        </div>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <dl className="grid gap-2 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Entities</dt>
                <dd>{policy.entities?.length ? policy.entities.join(', ') : '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last Reviewed</dt>
                <dd>
                  {policy.lastReviewDate
                    ? new Date(policy.lastReviewDate).toLocaleDateString()
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd>{new Date(policy.createdAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Updated</dt>
                <dd>{new Date(policy.updatedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </TabsContent>
          <TabsContent value="benchmarks">
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
              <BenchmarksList policyId={id} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </BusinessDocument>
    </>
  );
}

export default async function TransferPricingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

  return (
    <Suspense>
      <TransferPricingDetailContent ctx={ctx} id={id} />
    </Suspense>
  );
}
