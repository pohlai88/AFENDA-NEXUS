import { notFound } from 'next/navigation';
import {
  getProjectById,
  getProjectCosts,
  getProjectBillings,
  getProjectMilestones,
  getWIPCalculation,
} from '@/features/finance/projects/queries/projects.queries';
import { ProjectDetail } from '@/features/finance/projects/blocks/project-detail';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  const [projectResult, costsResult, billingsResult, milestonesResult, wipResult] =
    await Promise.all([
      getProjectById(id),
      getProjectCosts(id),
      getProjectBillings(id),
      getProjectMilestones(id),
      getWIPCalculation(id),
    ]);

  if (!projectResult.ok) {
    notFound();
  }

  return (
    <ProjectDetail
      project={projectResult.data}
      costs={costsResult.ok ? costsResult.data : []}
      billings={billingsResult.ok ? billingsResult.data : []}
      milestones={milestonesResult.ok ? milestonesResult.data : []}
      wip={wipResult.ok ? wipResult.data : undefined}
    />
  );
}
