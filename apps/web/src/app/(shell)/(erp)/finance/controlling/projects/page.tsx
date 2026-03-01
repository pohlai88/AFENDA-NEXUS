import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/erp/page-header';
import { routes } from '@/lib/constants';
import {
  ProjectSummarySkeleton,
  ProjectTableSkeleton,
  ProjectSummarySection,
  ProjectsListSection,
} from '@/features/finance/projects/blocks/project-sections';

export const metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Accounting"
        description="Manage projects, track costs, billings, and WIP"
        breadcrumbs={[{ label: 'Finance', href: routes.finance.journals }, { label: 'Projects' }]}
        actions={[
          { label: 'WIP Report', href: routes.finance.projectWip, variant: 'outline' },
          { label: 'New Project', href: routes.finance.projectNew },
        ]}
      />

      <Suspense fallback={<ProjectSummarySkeleton />}>
        <ProjectSummarySection />
      </Suspense>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="on_hold">On Hold</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Suspense fallback={<ProjectTableSkeleton />}><ProjectsListSection /></Suspense>
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          <Suspense fallback={<ProjectTableSkeleton />}><ProjectsListSection status="active" /></Suspense>
        </TabsContent>
        <TabsContent value="planning" className="mt-6">
          <Suspense fallback={<ProjectTableSkeleton />}><ProjectsListSection status="planning" /></Suspense>
        </TabsContent>
        <TabsContent value="on_hold" className="mt-6">
          <Suspense fallback={<ProjectTableSkeleton />}><ProjectsListSection status="on_hold" /></Suspense>
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <Suspense fallback={<ProjectTableSkeleton />}><ProjectsListSection status="completed" /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
