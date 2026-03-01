import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/erp/page-header';
import { routes } from '@/lib/constants';
import {
  LeaseSummarySkeleton,
  LeaseTableSkeleton,
  LeaseSummarySection,
  LeasesListSection,
} from '@/features/finance/leases/blocks/lease-sections';

export const metadata = { title: 'Leases' };

export default function LeasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lease Accounting (IFRS 16)"
        description="Manage lease contracts, ROU assets, and liability schedules"
        breadcrumbs={[{ label: 'Finance', href: routes.finance.journals }, { label: 'Leases' }]}
        actions={[
          { label: 'Run Period', href: routes.finance.leaseRunPeriod, variant: 'outline' },
          { label: 'New Lease', href: routes.finance.leaseNew },
        ]}
      />

      <Suspense fallback={<LeaseSummarySkeleton />}>
        <LeaseSummarySection />
      </Suspense>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Leases</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Suspense fallback={<LeaseTableSkeleton />}><LeasesListSection /></Suspense>
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          <Suspense fallback={<LeaseTableSkeleton />}><LeasesListSection status="active" /></Suspense>
        </TabsContent>
        <TabsContent value="draft" className="mt-6">
          <Suspense fallback={<LeaseTableSkeleton />}><LeasesListSection status="draft" /></Suspense>
        </TabsContent>
        <TabsContent value="expired" className="mt-6">
          <Suspense fallback={<LeaseTableSkeleton />}><LeasesListSection status="expired" /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
