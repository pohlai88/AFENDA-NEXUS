import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/erp/page-header';
import { Ban } from 'lucide-react';
import { routes } from '@/lib/constants';
import {
  CreditSummarySkeleton,
  CreditTableSkeleton,
  CreditSummarySection,
  CreditsSection,
  CreditHoldsSection,
} from '@/features/finance/credit/blocks/credit-sections';

export const metadata = { title: 'Credit Management | Finance' };

export default function CreditPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Management"
        description="Customer credit limits, reviews, and hold management."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Credit Management' }]}
        actions={[
          { label: 'Reviews', href: routes.finance.creditReviews, variant: 'outline' },
          { label: 'Add Customer Credit', href: routes.finance.creditNew },
        ]}
      />

      <Suspense fallback={<CreditSummarySkeleton />}>
        <CreditSummarySection />
      </Suspense>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Customers</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="on_hold">
            <Ban className="mr-2 h-4 w-4" />
            On Hold
          </TabsTrigger>
          <TabsTrigger value="holds">Active Holds</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Suspense fallback={<CreditTableSkeleton />}><CreditsSection /></Suspense>
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          <Suspense fallback={<CreditTableSkeleton />}><CreditsSection status="active" /></Suspense>
        </TabsContent>
        <TabsContent value="on_hold" className="mt-6">
          <Suspense fallback={<CreditTableSkeleton />}><CreditsSection status="on_hold" /></Suspense>
        </TabsContent>
        <TabsContent value="holds" className="mt-6">
          <Suspense fallback={<CreditTableSkeleton />}><CreditHoldsSection /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
