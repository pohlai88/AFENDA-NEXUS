import { Suspense } from 'react';
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRequestContext } from '@/lib/auth';
import type { RequestContext } from '@afenda/core';
import {
  getApprovals,
  getApprovalStats,
} from '@/features/finance/approvals/queries/approvals.queries';
import { ApprovalStatsCards } from '@/features/finance/approvals/blocks/approval-stats-cards';
import { ApprovalsTable } from '@/features/finance/approvals/blocks/approvals-table';

export const metadata = {
  title: 'Approval Inbox | Finance',
  description: 'Review and approve pending financial documents',
};

type ApprovalsParams = {
  status?: string;
  documentType?: string;
  slaStatus?: string;
  page?: string;
  limit?: string;
};

async function ApprovalsContent({ ctx, params }: { ctx: RequestContext; params: ApprovalsParams }) {
  const page = parseInt(params.page ?? '1', 10);
  const limit = parseInt(params.limit ?? '20', 10);
  const status = (params.status ?? 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
  const { documentType } = params;
  const slaStatus = params.slaStatus as 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | undefined;

  const [approvalsResult, statsResult] = await Promise.all([
    getApprovals(ctx, { status, documentType, slaStatus, page, limit }),
    getApprovalStats(ctx),
  ]);
  if (!approvalsResult.ok || !statsResult.ok) throw new Error('Failed to load approvals');
  const { items, totalPages } = approvalsResult.data;

  return (
    <>
      <ApprovalStatsCards stats={statsResult.data} />
      <Tabs defaultValue={status} className="space-y-4">
        <TabsList>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>
        <TabsContent value={status}>
          <ApprovalsTable
            items={items}
            pagination={{ page, totalPages, searchParams: { status, documentType, slaStatus } }}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<ApprovalsParams>;
}) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeaderHeading>Approval Inbox</PageHeaderHeading>
        <PageHeaderDescription>
          Review and approve pending financial documents. Items are sorted by SLA urgency.
        </PageHeaderDescription>
      </PageHeader>

      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <ApprovalsContent ctx={ctx} params={params} />
      </Suspense>
    </div>
  );
}
