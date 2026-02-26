/**
 * PA-06: Project billing service.
 * Creates billing records for milestone, T&M, or fixed-fee projects.
 */

import { err, ValidationError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { IProjectRepo } from '../ports/project-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { ProjectBilling } from '../entities/project-billing.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface BillProjectInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly projectId: string;
  readonly billingDate: Date;
  readonly description: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly milestoneRef: string | null;
}

export async function billProject(
  input: BillProjectInput,
  deps: { projectRepo: IProjectRepo; outboxWriter: IOutboxWriter }
): Promise<Result<ProjectBilling>> {
  if (input.amount <= 0n) return err(new ValidationError('Billing amount must be positive'));

  const project = await deps.projectRepo.findById(input.projectId);
  if (!project) return err(new ValidationError('Project not found'));
  if (project.status !== 'ACTIVE')
    return err(new ValidationError('Project must be active for billing'));

  const billing = await deps.projectRepo.createBilling(input.tenantId, {
    projectId: input.projectId,
    billingDate: input.billingDate,
    description: input.description,
    amount: input.amount,
    currencyCode: input.currencyCode,
    milestoneRef: input.milestoneRef,
  });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.PROJECT_BILLED,
    payload: {
      projectId: input.projectId,
      billingId: billing.id,
      amount: input.amount.toString(),
      userId: input.userId,
    },
  });

  return { ok: true, value: billing };
}
