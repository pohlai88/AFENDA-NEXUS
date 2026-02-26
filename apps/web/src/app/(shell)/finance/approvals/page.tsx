import { Suspense } from 'react';
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getApprovals, getApprovalStats } from '@/features/finance/approvals/queries/approvals.queries';
import { ApprovalStatsCards } from '@/features/finance/approvals/blocks/approval-stats-cards';
import { ApprovalsTable } from '@/features/finance/approvals/blocks/approvals-table';

interface ApprovalsPageProps {
  searchParams: Promise<{
    status?: string;
    documentType?: string;
    slaStatus?: string;
    page?: string;
    limit?: string;
  }>;
}

export const metadata = {
  title: 'Approval Inbox | Finance',
  description: 'Review and approve pending financial documents',
};

export default async function ApprovalsPage({ searchParams }: ApprovalsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const limit = parseInt(params.limit ?? '20', 10);
  const status = (params.status ?? 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
  const documentType = params.documentType;
  const slaStatus = params.slaStatus as 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | undefined;

  const [approvalsResult, statsResult] = await Promise.all([
    getApprovals({ status, documentType, slaStatus, page, limit }),
    getApprovalStats(),
  ]);

  if (!approvalsResult.ok || !statsResult.ok) {
    throw new Error('Failed to load approvals');
  }

  const { items, totalPages } = approvalsResult.data;
  const stats = statsResult.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeaderHeading>Approval Inbox</PageHeaderHeading>
        <PageHeaderDescription>
          Review and approve pending financial documents. Items are sorted by SLA urgency.
        </PageHeaderDescription>
      </PageHeader>

      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <ApprovalStatsCards stats={stats} />
      </Suspense>

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
            pagination={{
              page,
              totalPages,
              searchParams: {
                status,
                documentType,
                slaStatus,
              },
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
