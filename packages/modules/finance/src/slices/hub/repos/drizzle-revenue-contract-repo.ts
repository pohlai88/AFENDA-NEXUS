import { eq, count } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { revenueContracts, recognitionMilestones } from '@afenda/db';
import {
  ok,
  err,
  NotFoundError,
  AppError,
  type Result,
  type PaginationParams,
  type PaginatedResult,
} from '@afenda/core';
import type {
  RevenueContract,
  RecognitionMilestone,
} from '../../hub/entities/revenue-recognition.js';
import type {
  IRevenueContractRepo,
  CreateRevenueContractInput,
} from '../../../slices/hub/ports/revenue-contract-repo.js';

export class DrizzleRevenueContractRepo implements IRevenueContractRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(input: CreateRevenueContractInput): Promise<Result<RevenueContract>> {
    const [row] = await this.tx
      .insert(revenueContracts)
      .values({
        tenantId: input.tenantId,
        companyId: input.companyId,
        contractNumber: input.contractNumber,
        customerName: input.customerName,
        totalAmount: input.totalAmount,
        currencyId: input.currency,
        recognitionMethod: input.recognitionMethod,
        startDate: input.startDate,
        endDate: input.endDate,
        deferredAccountId: input.deferredAccountId,
        revenueAccountId: input.revenueAccountId,
        status: 'ACTIVE',
        recognizedToDate: 0n,
      })
      .returning();

    if (!row) return err(new AppError('INTERNAL', 'Failed to create revenue contract'));

    return ok(this.mapToDomain(row));
  }

  async findById(id: string): Promise<Result<RevenueContract>> {
    const [row] = await this.tx
      .select()
      .from(revenueContracts)
      .where(eq(revenueContracts.id, id))
      .limit(1);

    if (!row) return err(new NotFoundError('RevenueContract', id));

    return ok(this.mapToDomain(row));
  }

  async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<RevenueContract>>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [totalRow] = await this.tx.select({ total: count() }).from(revenueContracts);

    const rows = await this.tx.select().from(revenueContracts).limit(limit).offset(offset);

    return ok({
      data: rows.map((r) => this.mapToDomain(r)),
      total: totalRow?.total ?? 0,
      page,
      limit,
    });
  }

  async updateRecognized(id: string, recognizedAmount: bigint): Promise<Result<RevenueContract>> {
    const [row] = await this.tx
      .update(revenueContracts)
      .set({ recognizedToDate: recognizedAmount })
      .where(eq(revenueContracts.id, id))
      .returning();

    if (!row) return err(new NotFoundError('RevenueContract', id));

    return ok(this.mapToDomain(row));
  }

  async findMilestones(contractId: string): Promise<Result<RecognitionMilestone[]>> {
    const rows = await this.tx
      .select()
      .from(recognitionMilestones)
      .where(eq(recognitionMilestones.contractId, contractId));

    return ok(
      rows.map((r) => ({
        id: r.id!,
        contractId: r.contractId,
        description: r.description,
        amount: r.amount,
        targetDate: r.targetDate,
        completedDate: r.completedDate ?? undefined,
        isCompleted: r.isCompleted,
      }))
    );
  }

  private mapToDomain(row: typeof revenueContracts.$inferSelect): RevenueContract {
    return {
      id: row.id!,
      tenantId: row.tenantId as never,
      companyId: row.companyId as never,
      contractNumber: row.contractNumber,
      customerName: row.customerName,
      totalAmount: row.totalAmount,
      currency: row.currencyId,
      recognitionMethod: row.recognitionMethod as RevenueContract['recognitionMethod'],
      startDate: row.startDate,
      endDate: row.endDate,
      deferredAccountId: row.deferredAccountId,
      revenueAccountId: row.revenueAccountId,
      status: row.status as RevenueContract['status'],
      recognizedToDate: row.recognizedToDate,
      createdAt: row.createdAt,
    };
  }
}
