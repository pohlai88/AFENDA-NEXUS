import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import { ok, err, NotFoundError } from '@afenda/core';
import type { Result, PaginationParams, PaginatedResult, Money } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { whtCertificates } from '@afenda/db';
import type { WhtCertificate, WhtExemption } from '../entities/wht-certificate.js';
import type {
  IWhtCertificateRepo,
  CreateWhtCertificateInput,
  CreateWhtExemptionInput,
} from '../ports/wht-certificate-repo.js';

type CertRow = typeof whtCertificates.$inferSelect;

function money(amount: bigint, currency: string): Money {
  return { amount, currency, scale: 0 };
}

function mapToDomain(row: CertRow): WhtCertificate {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.payeeId,
    certificateNumber: row.certificateNumber,
    certificateType: row.status === 'EXEMPT' ? 'EXEMPTION' : 'STANDARD',
    taxYear: row.taxPeriodStart.getFullYear(),
    taxPeriod: `${row.taxPeriodStart.toISOString().slice(0, 10)}/${row.taxPeriodEnd.toISOString().slice(0, 10)}`,
    incomeType: row.incomeType,
    grossAmount: money(row.grossAmount, row.currencyCode),
    whtAmount: money(row.whtAmount, row.currencyCode),
    netAmount: money(row.netAmount, row.currencyCode),
    effectiveRate: row.rateApplied,
    paymentRunId: row.relatedPaymentId ?? null,
    issuedAt: row.issueDate,
    issuedBy: row.payeeName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * F4: AP WHT certificate repo adapter.
 *
 * Bridges the AP slice's IWhtCertificateRepo interface to the
 * existing wht_certificate DB table (shared with tax slice).
 * Maps supplierId ↔ payeeId.
 *
 * Note: WhtExemption management uses the same table with status='EXEMPT'.
 */
export class DrizzleApWhtCertificateRepo implements IWhtCertificateRepo {
  constructor(private readonly tx: TenantTx) {}

  async createCertificate(input: CreateWhtCertificateInput): Promise<Result<WhtCertificate>> {
    const [row] = await this.tx
      .insert(whtCertificates)
      .values({
        tenantId: input.tenantId,
        payeeId: input.supplierId,
        payeeName: '',
        payeeType: 'SUPPLIER',
        countryCode: 'ZA',
        incomeType: input.incomeType,
        grossAmount: input.grossAmount,
        whtAmount: input.whtAmount,
        netAmount: input.netAmount,
        currencyCode: 'USD',
        rateApplied: input.effectiveRate,
        certificateNumber: input.certificateNumber,
        issueDate: new Date(),
        taxPeriodStart: new Date(`${input.taxYear}-01-01`),
        taxPeriodEnd: new Date(`${input.taxYear}-12-31`),
        relatedPaymentId: input.paymentRunId,
        status: input.certificateType === 'EXEMPTION' ? 'EXEMPT' : 'ISSUED',
      })
      .returning();

    if (!row) return err(new NotFoundError('WhtCertificate', 'new'));
    return ok(mapToDomain(row));
  }

  async findCertificateById(id: string): Promise<Result<WhtCertificate>> {
    const row = await this.tx.query.whtCertificates.findFirst({
      where: eq(whtCertificates.id, id),
    });
    if (!row) return err(new NotFoundError('WhtCertificate', id));
    return ok(mapToDomain(row));
  }

  async findCertificatesBySupplier(
    supplierId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<WhtCertificate>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;
    const where = eq(whtCertificates.payeeId, supplierId);

    const [rows, countRows] = await Promise.all([
      this.tx.query.whtCertificates.findMany({
        where,
        orderBy: [desc(whtCertificates.issueDate)],
        limit,
        offset,
      }),
      this.tx.select({ total: count() }).from(whtCertificates).where(where),
    ]);

    return {
      data: rows.map(mapToDomain),
      total: countRows[0]?.total ?? 0,
      page,
      limit,
    };
  }

  async findCertificatesByTaxYear(
    taxYear: number,
    params?: PaginationParams
  ): Promise<PaginatedResult<WhtCertificate>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;
    const yearStart = new Date(`${taxYear}-01-01`);
    const yearEnd = new Date(`${taxYear}-12-31`);
    const where = and(
      gte(whtCertificates.taxPeriodStart, yearStart),
      lte(whtCertificates.taxPeriodEnd, yearEnd)
    );

    const [rows, countRows] = await Promise.all([
      this.tx.query.whtCertificates.findMany({
        where,
        orderBy: [desc(whtCertificates.issueDate)],
        limit,
        offset,
      }),
      this.tx.select({ total: count() }).from(whtCertificates).where(where),
    ]);

    return {
      data: rows.map(mapToDomain),
      total: countRows[0]?.total ?? 0,
      page,
      limit,
    };
  }

  async createExemption(input: CreateWhtExemptionInput): Promise<Result<WhtExemption>> {
    const [row] = await this.tx
      .insert(whtCertificates)
      .values({
        tenantId: input.tenantId,
        payeeId: input.supplierId,
        payeeName: '',
        payeeType: 'SUPPLIER',
        countryCode: 'ZA',
        incomeType: input.incomeType,
        grossAmount: 0n,
        whtAmount: 0n,
        netAmount: 0n,
        currencyCode: 'USD',
        rateApplied: 0,
        certificateNumber: `EXM-${Date.now()}`,
        issueDate: new Date(),
        taxPeriodStart: input.effectiveFrom,
        taxPeriodEnd: input.effectiveTo,
        status: 'EXEMPT',
      })
      .returning();

    if (!row) return err(new NotFoundError('WhtExemption', 'new'));
    return ok({
      id: row.id,
      tenantId: row.tenantId,
      supplierId: row.payeeId,
      incomeType: row.incomeType,
      exemptionReason: input.exemptionReason,
      effectiveFrom: row.taxPeriodStart,
      effectiveTo: row.taxPeriodEnd,
      isActive: true,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findActiveExemption(
    supplierId: string,
    incomeType: string,
    asOf: Date
  ): Promise<WhtExemption | null> {
    const row = await this.tx.query.whtCertificates.findFirst({
      where: and(
        eq(whtCertificates.payeeId, supplierId),
        eq(whtCertificates.incomeType, incomeType),
        eq(whtCertificates.status, 'EXEMPT'),
        lte(whtCertificates.taxPeriodStart, asOf),
        gte(whtCertificates.taxPeriodEnd, asOf)
      ),
    });

    if (!row) return null;
    return {
      id: row.id,
      tenantId: row.tenantId,
      supplierId: row.payeeId,
      incomeType: row.incomeType,
      exemptionReason: '',
      effectiveFrom: row.taxPeriodStart,
      effectiveTo: row.taxPeriodEnd,
      isActive: true,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async deactivateExemption(id: string): Promise<Result<WhtExemption>> {
    const existing = await this.tx.query.whtCertificates.findFirst({
      where: eq(whtCertificates.id, id),
    });
    if (!existing) return err(new NotFoundError('WhtExemption', id));

    await this.tx
      .update(whtCertificates)
      .set({ status: 'REVOKED', updatedAt: new Date() })
      .where(eq(whtCertificates.id, id));

    return ok({
      id: existing.id,
      tenantId: existing.tenantId,
      supplierId: existing.payeeId,
      incomeType: existing.incomeType,
      exemptionReason: '',
      effectiveFrom: existing.taxPeriodStart,
      effectiveTo: existing.taxPeriodEnd,
      isActive: false,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
  }
}
