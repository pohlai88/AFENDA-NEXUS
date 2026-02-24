import { eq } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { leaseSchedules } from "@afenda/db";
import type { LeaseSchedule } from "../entities/lease-schedule.js";
import type { ILeaseScheduleRepo, CreateLeaseScheduleInput } from "../ports/lease-schedule-repo.js";

type Row = typeof leaseSchedules.$inferSelect;

function mapToDomain(row: Row): LeaseSchedule {
  return {
    id: row.id,
    tenantId: row.tenantId,
    leaseContractId: row.leaseContractId,
    periodNumber: row.periodNumber,
    paymentDate: row.paymentDate,
    paymentAmount: row.paymentAmount,
    principalPortion: row.principalPortion,
    interestPortion: row.interestPortion,
    openingLiability: row.openingLiability,
    closingLiability: row.closingLiability,
    rouDepreciation: row.rouDepreciation,
    currencyCode: row.currencyCode,
    createdAt: row.createdAt,
  };
}

export class DrizzleLeaseScheduleRepo implements ILeaseScheduleRepo {
  constructor(private readonly db: TenantTx) {}

  async findByLease(leaseContractId: string): Promise<readonly LeaseSchedule[]> {
    const rows = await this.db.select().from(leaseSchedules).where(eq(leaseSchedules.leaseContractId, leaseContractId));
    return rows.map(mapToDomain);
  }

  async createBatch(tenantId: string, lines: readonly CreateLeaseScheduleInput[]): Promise<readonly LeaseSchedule[]> {
    if (lines.length === 0) return [];
    const rows = await this.db.insert(leaseSchedules).values(
      lines.map((l) => ({ tenantId, ...l })),
    ).returning();
    return rows.map(mapToDomain);
  }

  async deleteByLease(leaseContractId: string): Promise<void> {
    await this.db.delete(leaseSchedules).where(eq(leaseSchedules.leaseContractId, leaseContractId));
  }
}
