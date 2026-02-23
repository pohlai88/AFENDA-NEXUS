import { eq, and, gte, lte } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { whtCertificates } from "@afenda/db";
import type { WhtCertificate } from "../entities/wht-certificate.js";
import type { IWhtCertificateRepo, CreateWhtCertificateInput } from "../ports/wht-certificate-repo.js";

type Row = typeof whtCertificates.$inferSelect;

function mapToDomain(row: Row): WhtCertificate {
  return {
    id: row.id,
    tenantId: row.tenantId,
    payeeId: row.payeeId,
    payeeName: row.payeeName,
    payeeType: row.payeeType as WhtCertificate["payeeType"],
    countryCode: row.countryCode,
    incomeType: row.incomeType,
    grossAmount: row.grossAmount,
    whtAmount: row.whtAmount,
    netAmount: row.netAmount,
    currencyCode: row.currencyCode,
    rateApplied: row.rateApplied,
    treatyRate: row.treatyRate,
    certificateNumber: row.certificateNumber,
    issueDate: row.issueDate,
    taxPeriodStart: row.taxPeriodStart,
    taxPeriodEnd: row.taxPeriodEnd,
    relatedInvoiceId: row.relatedInvoiceId,
    relatedPaymentId: row.relatedPaymentId,
    status: row.status as WhtCertificate["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleWhtCertificateRepo implements IWhtCertificateRepo {
  constructor(private readonly db: TenantTx) { }

  async findById(id: string): Promise<WhtCertificate | null> {
    const rows = await this.db.select().from(whtCertificates).where(eq(whtCertificates.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByPayee(payeeId: string): Promise<readonly WhtCertificate[]> {
    const rows = await this.db.select().from(whtCertificates).where(eq(whtCertificates.payeeId, payeeId));
    return rows.map(mapToDomain);
  }

  async findByPeriod(periodStart: Date, periodEnd: Date): Promise<readonly WhtCertificate[]> {
    const rows = await this.db.select().from(whtCertificates).where(
      and(gte(whtCertificates.issueDate, periodStart), lte(whtCertificates.issueDate, periodEnd)),
    );
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly WhtCertificate[]> {
    const rows = await this.db.select().from(whtCertificates);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateWhtCertificateInput): Promise<WhtCertificate> {
    const [row] = await this.db.insert(whtCertificates).values({
      tenantId,
      payeeId: input.payeeId,
      payeeName: input.payeeName,
      payeeType: input.payeeType,
      countryCode: input.countryCode,
      incomeType: input.incomeType,
      grossAmount: input.grossAmount,
      whtAmount: input.whtAmount,
      netAmount: input.netAmount,
      currencyCode: input.currencyCode,
      rateApplied: input.rateApplied,
      treatyRate: input.treatyRate,
      certificateNumber: input.certificateNumber,
      issueDate: input.issueDate,
      taxPeriodStart: input.taxPeriodStart,
      taxPeriodEnd: input.taxPeriodEnd,
      relatedInvoiceId: input.relatedInvoiceId,
      relatedPaymentId: input.relatedPaymentId,
    }).returning();
    return mapToDomain(row!);
  }

  async updateStatus(id: string, status: WhtCertificate["status"]): Promise<WhtCertificate> {
    const [row] = await this.db.update(whtCertificates).set({ status }).where(eq(whtCertificates.id, id)).returning();
    return mapToDomain(row!);
  }
}
