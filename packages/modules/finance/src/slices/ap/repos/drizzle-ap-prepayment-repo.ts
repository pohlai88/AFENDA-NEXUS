import { eq, and, count, desc } from 'drizzle-orm';
import { ok, err, NotFoundError, AppError } from '@afenda/core';
import type { Result, PaginationParams, PaginatedResult, Money } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { apPrepayments, apPrepaymentApplications } from '@afenda/db';
import type { ApPrepayment, PrepaymentApplication } from '../entities/prepayment.js';
import type {
  IApPrepaymentRepo,
  CreatePrepaymentInput,
  ApplyPrepaymentInput,
} from '../ports/prepayment-repo.js';

type PrepaymentRow = typeof apPrepayments.$inferSelect;
type ApplicationRow = typeof apPrepaymentApplications.$inferSelect;

function money(amount: bigint, currency: string): Money {
  return { amount, currency, scale: 0 };
}

function mapApplicationToDomain(row: ApplicationRow): PrepaymentApplication {
  return {
    id: row.id,
    prepaymentId: row.prepaymentId,
    targetInvoiceId: row.targetInvoiceId,
    amount: money(row.amount, ''),
    appliedAt: row.appliedAt,
    appliedBy: row.appliedBy,
  };
}

function mapToDomain(row: PrepaymentRow, applications: ApplicationRow[]): ApPrepayment {
  return {
    id: row.id,
    tenantId: row.tenantId,
    invoiceId: row.invoiceId,
    supplierId: row.supplierId,
    totalAmount: money(row.totalAmount, row.currencyCode),
    appliedAmount: money(row.appliedAmount, row.currencyCode),
    unappliedBalance: money(row.unappliedBalance, row.currencyCode),
    status: row.status as ApPrepayment['status'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    applications: applications.map(mapApplicationToDomain),
  };
}

export class DrizzleApPrepaymentRepo implements IApPrepaymentRepo {
  constructor(private readonly tx: TenantTx) {}

  private async loadApplications(prepaymentId: string): Promise<ApplicationRow[]> {
    return this.tx.query.apPrepaymentApplications.findMany({
      where: eq(apPrepaymentApplications.prepaymentId, prepaymentId),
      orderBy: [desc(apPrepaymentApplications.appliedAt)],
    });
  }

  async create(input: CreatePrepaymentInput): Promise<Result<ApPrepayment>> {
    const [row] = await this.tx
      .insert(apPrepayments)
      .values({
        tenantId: input.tenantId,
        invoiceId: input.invoiceId,
        supplierId: input.supplierId,
        totalAmount: input.amount,
        appliedAmount: 0n,
        unappliedBalance: input.amount,
        currencyCode: input.currencyCode,
        status: 'OPEN',
      })
      .returning();

    if (!row) return err(new NotFoundError('ApPrepayment', 'new'));
    return ok(mapToDomain(row, []));
  }

  async findById(id: string): Promise<Result<ApPrepayment>> {
    const row = await this.tx.query.apPrepayments.findFirst({
      where: eq(apPrepayments.id, id),
    });
    if (!row) return err(new NotFoundError('ApPrepayment', id));
    const apps = await this.loadApplications(id);
    return ok(mapToDomain(row, apps));
  }

  async findBySupplier(
    supplierId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<ApPrepayment>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const where = eq(apPrepayments.supplierId, supplierId);

    const [rows, countRows] = await Promise.all([
      this.tx.query.apPrepayments.findMany({
        where,
        orderBy: [desc(apPrepayments.createdAt), desc(apPrepayments.id)],
        limit,
        offset,
      }),
      this.tx.select({ total: count() }).from(apPrepayments).where(where),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(
      rows.map(async (row) => {
        const apps = await this.loadApplications(row.id);
        return mapToDomain(row, apps);
      })
    );

    return { data, total, page, limit };
  }

  async findOpenBySupplier(supplierId: string): Promise<ApPrepayment[]> {
    const rows = await this.tx.query.apPrepayments.findMany({
      where: and(eq(apPrepayments.supplierId, supplierId), eq(apPrepayments.status, 'OPEN')),
      orderBy: [desc(apPrepayments.createdAt)],
    });
    return Promise.all(
      rows.map(async (row) => {
        const apps = await this.loadApplications(row.id);
        return mapToDomain(row, apps);
      })
    );
  }

  async applyToInvoice(input: ApplyPrepaymentInput): Promise<Result<PrepaymentApplication>> {
    const prepayment = await this.tx.query.apPrepayments.findFirst({
      where: eq(apPrepayments.id, input.prepaymentId),
    });
    if (!prepayment) return err(new NotFoundError('ApPrepayment', input.prepaymentId));

    if (prepayment.unappliedBalance < input.amount) {
      return err(new AppError('VALIDATION', 'Application amount exceeds unapplied balance'));
    }

    const [appRow] = await this.tx
      .insert(apPrepaymentApplications)
      .values({
        tenantId: prepayment.tenantId,
        prepaymentId: input.prepaymentId,
        targetInvoiceId: input.targetInvoiceId,
        amount: input.amount,
        appliedBy: input.appliedBy,
      })
      .returning();

    if (!appRow) return err(new NotFoundError('PrepaymentApplication', 'new'));

    const newApplied = prepayment.appliedAmount + input.amount;
    const newUnapplied = prepayment.unappliedBalance - input.amount;
    const newStatus = newUnapplied === 0n ? 'FULLY_APPLIED' : 'PARTIALLY_APPLIED';

    await this.tx
      .update(apPrepayments)
      .set({
        appliedAmount: newApplied,
        unappliedBalance: newUnapplied,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(apPrepayments.id, input.prepaymentId));

    return ok(mapApplicationToDomain(appRow));
  }

  async cancel(id: string): Promise<Result<ApPrepayment>> {
    const existing = await this.tx.query.apPrepayments.findFirst({
      where: eq(apPrepayments.id, id),
    });
    if (!existing) return err(new NotFoundError('ApPrepayment', id));

    if (existing.status === 'FULLY_APPLIED') {
      return err(new AppError('VALIDATION', 'Cannot cancel a fully applied prepayment'));
    }

    await this.tx
      .update(apPrepayments)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(apPrepayments.id, id));

    return this.findById(id);
  }
}
