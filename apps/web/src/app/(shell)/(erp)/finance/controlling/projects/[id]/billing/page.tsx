import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { RequestContext } from '@afenda/core';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import {
  getProjectById,
  getProjectMilestones,
  getWIPCalculation,
} from '@/features/finance/projects/queries/projects.queries';
import { BillingWizard } from '@/features/finance/projects/blocks/billing-wizard';
import { getRequestContext } from '@/lib/auth';

export const metadata = { title: 'Projects — Billing' };

interface BillingPageProps {
  params: Promise<{ id: string }>;
}

async function BillingContent({ ctx, id }: { ctx: RequestContext; id: string }) {
  const [projectResult, milestonesResult, wipResult] = await Promise.all([
    getProjectById(ctx, id),
    getProjectMilestones(ctx, id),
    getWIPCalculation(ctx, id),
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

export default async function BillingPage({ params }: BillingPageProps) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <BillingContent ctx={ctx} id={id} />
    </Suspense>
  );
}
