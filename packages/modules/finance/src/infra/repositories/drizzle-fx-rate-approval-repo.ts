import { eq } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { fxRates } from "@afenda/db";
import { ok, err, NotFoundError, type Result } from "@afenda/core";
import type { FxRateApproval, RateSource, ApprovalStatus } from "../../domain/entities/fx-rate-approval.js";
import type { IFxRateApprovalRepo } from "../../app/ports/fx-rate-approval-repo.js";

export class DrizzleFxRateApprovalRepo implements IFxRateApprovalRepo {
  constructor(private readonly tx: TenantTx) { }

  async submit(rateId: string, submittedBy: string): Promise<Result<FxRateApproval>> {
    const [row] = await this.tx
      .select()
      .from(fxRates)
      .where(eq(fxRates.id, rateId))
      .limit(1);

    if (!row) return err(new NotFoundError("FxRate", rateId));

    return ok({
      rateId: row.id!,
      source: (row.source ?? "MANUAL") as RateSource,
      status: "PENDING" as ApprovalStatus,
      submittedBy,
      submittedAt: new Date(),
    });
  }

  async approve(rateId: string, reviewedBy: string): Promise<Result<FxRateApproval>> {
    const [row] = await this.tx
      .select()
      .from(fxRates)
      .where(eq(fxRates.id, rateId))
      .limit(1);

    if (!row) return err(new NotFoundError("FxRate", rateId));

    return ok({
      rateId: row.id!,
      source: (row.source ?? "MANUAL") as RateSource,
      status: "APPROVED" as ApprovalStatus,
      submittedBy: "system",
      submittedAt: row.createdAt,
      reviewedBy,
      reviewedAt: new Date(),
    });
  }

  async reject(rateId: string, reviewedBy: string, reason: string): Promise<Result<FxRateApproval>> {
    const [row] = await this.tx
      .select()
      .from(fxRates)
      .where(eq(fxRates.id, rateId))
      .limit(1);

    if (!row) return err(new NotFoundError("FxRate", rateId));

    return ok({
      rateId: row.id!,
      source: (row.source ?? "MANUAL") as RateSource,
      status: "REJECTED" as ApprovalStatus,
      submittedBy: "system",
      submittedAt: row.createdAt,
      reviewedBy,
      reviewedAt: new Date(),
      rejectionReason: reason,
    });
  }

  async findByRateId(rateId: string): Promise<Result<FxRateApproval>> {
    const [row] = await this.tx
      .select()
      .from(fxRates)
      .where(eq(fxRates.id, rateId))
      .limit(1);

    if (!row) return err(new NotFoundError("FxRate", rateId));

    return ok({
      rateId: row.id!,
      source: (row.source ?? "FEED") as RateSource,
      status: "APPROVED" as ApprovalStatus,
      submittedBy: "system",
      submittedAt: row.createdAt,
    });
  }
}
