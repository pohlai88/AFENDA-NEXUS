import { eq, count, sql } from 'drizzle-orm';
import { ok, err, NotFoundError, money } from '@afenda/core';
import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { apPaymentRuns, apPaymentRunItems, currencies } from '@afenda/db';
import type { PaymentRun, PaymentRunItem } from '../entities/payment-run.js';
import type {
  IApPaymentRunRepo,
  CreatePaymentRunInput,
  AddPaymentRunItemInput,
} from '../ports/payment-run-repo.js';

type RunRow = typeof apPaymentRuns.$inferSelect;
type ItemRow = typeof apPaymentRunItems.$inferSelect;

function mapItemToDomain(row: ItemRow, currencyCode: string): PaymentRunItem {
  return {
    id: row.id,
    paymentRunId: row.paymentRunId,
    invoiceId: row.invoiceId,
    supplierId: row.supplierId,
    amount: money(row.amount, currencyCode),
    discountAmount: money(row.discountAmount, currencyCode),
    netAmount: money(row.netAmount, currencyCode),
    journalId: row.journalId,
  };
}

function mapToDomain(row: RunRow, items: ItemRow[], currencyCode: string): PaymentRun {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    runNumber: row.runNumber,
    runDate: row.runDate,
    cutoffDate: row.cutoffDate,
    currencyCode,
    totalAmount: money(row.totalAmount, currencyCode),
    status: row.status as PaymentRun['status'],
    items: items.map((i) => mapItemToDomain(i, currencyCode)),
    executedAt: row.executedAt,
    executedBy: row.executedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleApPaymentRunRepo implements IApPaymentRunRepo {
  constructor(private readonly tx: TenantTx) {}

  private async resolveCurrency(currencyId: string): Promise<string> {
    const curr = await this.tx.query.currencies.findFirst({
      where: eq(currencies.id, currencyId),
    });
    return curr?.code ?? 'USD';
  }

  async create(input: CreatePaymentRunInput): Promise<Result<PaymentRun>> {
    const curr = await this.tx.query.currencies.findFirst({
      where: eq(currencies.code, input.currencyCode),
    });
    if (!curr) return err(new NotFoundError('Currency', input.currencyCode));

    const runNumber = `PR-${Date.now()}`;

    const [row] = await this.tx
      .insert(apPaymentRuns)
      .values({
        tenantId: input.tenantId,
        companyId: input.companyId,
        runNumber,
        runDate: input.runDate,
        cutoffDate: input.cutoffDate,
        currencyId: curr.id,
      })
      .returning();

    if (!row) return err(new NotFoundError('PaymentRun', 'new'));
    return ok(mapToDomain(row, [], input.currencyCode));
  }

  async findById(id: string): Promise<Result<PaymentRun>> {
    const row = await this.tx.query.apPaymentRuns.findFirst({
      where: eq(apPaymentRuns.id, id),
    });
    if (!row) return err(new NotFoundError('PaymentRun', id));

    const items = await this.tx.query.apPaymentRunItems.findMany({
      where: eq(apPaymentRunItems.paymentRunId, id),
    });

    const currencyCode = await this.resolveCurrency(row.currencyId);
    return ok(mapToDomain(row, items, currencyCode));
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<PaymentRun>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.apPaymentRuns.findMany({ limit, offset }),
      this.tx.select({ total: count() }).from(apPaymentRuns),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(
      rows.map(async (r) => {
        const items = await this.tx.query.apPaymentRunItems.findMany({
          where: eq(apPaymentRunItems.paymentRunId, r.id),
        });
        const currencyCode = await this.resolveCurrency(r.currencyId);
        return mapToDomain(r, items, currencyCode);
      })
    );

    return { data, total, page, limit };
  }

  async addItem(runId: string, item: AddPaymentRunItemInput): Promise<Result<PaymentRunItem>> {
    const run = await this.tx.query.apPaymentRuns.findFirst({ where: eq(apPaymentRuns.id, runId) });
    if (!run) return err(new NotFoundError('PaymentRun', runId));

    const [row] = await this.tx
      .insert(apPaymentRunItems)
      .values({
        tenantId: run.tenantId,
        paymentRunId: runId,
        invoiceId: item.invoiceId,
        supplierId: item.supplierId,
        amount: item.amount,
        discountAmount: item.discountAmount,
        netAmount: item.netAmount,
      })
      .returning();

    if (!row) return err(new NotFoundError('PaymentRunItem', 'new'));

    // Update run total
    await this.tx
      .update(apPaymentRuns)
      .set({
        totalAmount: sql`${apPaymentRuns.totalAmount} + ${item.netAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(apPaymentRuns.id, runId));

    const currencyCode = await this.resolveCurrency(run.currencyId);
    return ok(mapItemToDomain(row, currencyCode));
  }

  async updateStatus(id: string, status: string): Promise<Result<PaymentRun>> {
    await this.tx
      .update(apPaymentRuns)
      .set({
        status: status as typeof apPaymentRuns.$inferSelect.status,
        updatedAt: new Date(),
      })
      .where(eq(apPaymentRuns.id, id));
    return this.findById(id);
  }

  async execute(id: string, userId: string): Promise<Result<PaymentRun>> {
    await this.tx
      .update(apPaymentRuns)
      .set({
        status: 'EXECUTED',
        executedAt: new Date(),
        executedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(apPaymentRuns.id, id));
    return this.findById(id);
  }
}
