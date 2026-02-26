import { notFound } from 'next/navigation';
import {
  getProjectById,
  getProjectMilestones,
  getWIPCalculation,
} from '@/features/finance/projects/queries/projects.queries';
import { BillingWizard } from '@/features/finance/projects/blocks/billing-wizard';

interface BillingPageProps {
  params: Promise<{ id: string }>;
}

export default async function BillingPage({ params }: BillingPageProps) {
  const { id } = await params;

  const [projectResult, milestonesResult, wipResult] = await Promise.all([
    getProjectById(id),
    getProjectMilestones(id),
    getWIPCalculation(id),
  ]);

  if (!projectResult.ok || !wipResult.ok) {
    notFound();
  }

  return (
    <BillingWizard
      project={projectResult.data}
      milestones={milestonesResult.ok ? milestonesResult.data : []}
      wip={wipResult.data}
    />
  );
}
