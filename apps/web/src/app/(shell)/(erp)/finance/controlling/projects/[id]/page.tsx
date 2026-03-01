import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import {
  getProjectById,
  getProjectCosts,
  getProjectBillings,
  getProjectMilestones,
  getWIPCalculation,
} from '@/features/finance/projects/queries/projects.queries';
import { ProjectDetail } from '@/features/finance/projects/blocks/project-detail';
import { getRequestContext } from '@/lib/auth';

export const metadata = { title: 'Projects' };

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

  const [projectResult, costsResult, billingsResult, milestonesResult, wipResult] =
    await Promise.all([
      getProjectById(ctx, id),
      getProjectCosts(ctx, id),
      getProjectBillings(ctx, id),
      getProjectMilestones(ctx, id),
      getWIPCalculation(ctx, id),
    ]);

  if (!projectResult.ok) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProjectDetail
        project={projectResult.data}
        costs={costsResult.ok ? costsResult.data : []}
        billings={billingsResult.ok ? billingsResult.data : []}
        milestones={milestonesResult.ok ? milestonesResult.data : []}
        wip={wipResult.ok ? wipResult.data : undefined}
      />
    </Suspense>
  );
}
