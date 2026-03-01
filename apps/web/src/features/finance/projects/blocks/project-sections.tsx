import { Skeleton } from '@/components/ui/skeleton';
import { getRequestContext } from '@/lib/auth';
import {
  getProjects,
  getProjectSummary,
} from '@/features/finance/projects/queries/projects.queries';
import { ProjectsTable } from '@/features/finance/projects/blocks/projects-table';
import { ProjectSummaryCards } from '@/features/finance/projects/blocks/project-summary-cards';

export function ProjectSummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key -- Static skeleton fallback
        <Skeleton key={`skeleton-${i}`} className="h-[100px]" />
      ))}
    </div>
  );
}

export function ProjectTableSkeleton() {
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

export async function ProjectSummarySection() {
  const ctx = await getRequestContext();
  const result = await getProjectSummary(ctx);
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <ProjectSummaryCards summary={result.data} />;
}

export async function ProjectsListSection({ status }: { status?: string }) {
  const ctx = await getRequestContext();
  const result = await getProjects(ctx, { status });
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <ProjectsTable projects={result.data} pagination={result.pagination} />;
}
