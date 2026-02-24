/**
 * PA-05: WIP-to-revenue transfer journal service.
 * Transfers work-in-progress costs to recognized revenue via GL journal posting.
 */

import { err, ValidationError } from "@afenda/core";
import type { Result } from "@afenda/core";
import type { IProjectRepo } from "../ports/project-repo.js";
import type { IOutboxWriter } from "../../../shared/ports/outbox-writer.js";
import { FinanceEventType } from "../../../shared/events.js";

export interface TransferWipToRevenueInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly projectId: string;
  readonly periodId: string;
  readonly wipAmount: bigint;
  readonly revenueAmount: bigint;
  readonly currencyCode: string;
}

export interface TransferWipToRevenueResult {
  readonly projectId: string;
  readonly wipAmount: bigint;
  readonly revenueAmount: bigint;
  readonly grossProfit: bigint;
  readonly currencyCode: string;
}

export async function transferWipToRevenue(
  input: TransferWipToRevenueInput,
  deps: { projectRepo: IProjectRepo; outboxWriter: IOutboxWriter },
): Promise<Result<TransferWipToRevenueResult>> {
  if (input.wipAmount <= 0n) return err(new ValidationError("WIP amount must be positive"));
  if (input.revenueAmount <= 0n) return err(new ValidationError("Revenue amount must be positive"));

  const project = await deps.projectRepo.findById(input.projectId);
  if (!project) return err(new ValidationError("Project not found"));
  if (project.status !== "ACTIVE") return err(new ValidationError("Project must be active for WIP transfer"));

  const grossProfit = input.revenueAmount - input.wipAmount;

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.PROJECT_WIP_TRANSFERRED,
    payload: {
      projectId: input.projectId,
      periodId: input.periodId,
      wipAmount: input.wipAmount.toString(),
      revenueAmount: input.revenueAmount.toString(),
      userId: input.userId,
    },
  });

  return {
    ok: true,
    value: {
      projectId: input.projectId,
      wipAmount: input.wipAmount,
      revenueAmount: input.revenueAmount,
      grossProfit,
      currencyCode: input.currencyCode,
    },
  };
}
