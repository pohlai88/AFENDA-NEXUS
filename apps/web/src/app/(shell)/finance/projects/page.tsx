import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Calculator, Briefcase } from 'lucide-react';
import {
  getProjects,
  getProjectSummary,
} from '@/features/finance/projects/queries/projects.queries';
import { ProjectsTable } from '@/features/finance/projects/blocks/projects-table';
import { ProjectSummaryCards } from '@/features/finance/projects/blocks/project-summary-cards';
import { routes } from '@/lib/constants';

async function SummarySection() {
  const result = await getProjectSummary();
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <ProjectSummaryCards summary={result.data} />;
}

function SummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[100px]" />
      ))}
    </div>
  );
}

async function ProjectsSection({ status }: { status?: string }) {
  const result = await getProjects({ status });
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <ProjectsTable projects={result.data} pagination={result.pagination} />;
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            Project Accounting
          </h1>
          <p className="text-muted-foreground">Manage projects, track costs, billings, and WIP</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={routes.finance.projectWip}>
              <Calculator className="mr-2 h-4 w-4" />
              WIP Report
            </Link>
          </Button>
          <Button asChild>
            <Link href={routes.finance.projectNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<SummarySkeleton />}>
        <SummarySection />
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
          <Suspense fallback={<ProjectsSkeleton />}>
            <ProjectsSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <Suspense fallback={<ProjectsSkeleton />}>
            <ProjectsSection status="active" />
          </Suspense>
        </TabsContent>

        <TabsContent value="planning" className="mt-6">
          <Suspense fallback={<ProjectsSkeleton />}>
            <ProjectsSection status="planning" />
          </Suspense>
        </TabsContent>

        <TabsContent value="on_hold" className="mt-6">
          <Suspense fallback={<ProjectsSkeleton />}>
            <ProjectsSection status="on_hold" />
          </Suspense>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Suspense fallback={<ProjectsSkeleton />}>
            <ProjectsSection status="completed" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
