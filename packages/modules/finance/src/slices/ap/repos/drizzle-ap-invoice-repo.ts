import { eq, count, inArray, sql } from "drizzle-orm";
import { ok, err, NotFoundError, money } from "@afenda/core";
import type { Result, PaginationParams, PaginatedResult } from "@afenda/core";
import type { TenantTx } from "@afenda/db";
import { apInvoices, apInvoiceLines, currencies } from "@afenda/db";
import type { ApInvoice, ApInvoiceLine } from "../entities/ap-invoice.js";
import type { IApInvoiceRepo, CreateApInvoiceInput } from "../ports/ap-invoice-repo.js";

type InvoiceRow = typeof apInvoices.$inferSelect;
type LineRow = typeof apInvoiceLines.$inferSelect;

function mapLineToDomain(row: LineRow): ApInvoiceLine {
  return {
    id: row.id,
    invoiceId: row.invoiceId,
    lineNumber: row.lineNumber,
    accountId: row.accountId,
    description: row.description,
    quantity: row.quantity,
    unitPrice: money(row.unitPrice, "USD"),
    amount: money(row.amount, "USD"),
    taxAmount: money(row.taxAmount, "USD"),
  };
}

function mapToDomain(row: InvoiceRow, lines: LineRow[], currencyCode: string): ApInvoice {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId as ApInvoice["companyId"],
    supplierId: row.supplierId,
    ledgerId: row.ledgerId as ApInvoice["ledgerId"],
    invoiceNumber: row.invoiceNumber,
    supplierRef: row.supplierRef,
    invoiceDate: row.invoiceDate,
    dueDate: row.dueDate,
    totalAmount: money(row.totalAmount, currencyCode),
    paidAmount: money(row.paidAmount, currencyCode),
    status: row.status as ApInvoice["status"],
    description: row.description,
    poRef: row.poRef,
    receiptRef: row.receiptRef,
    paymentTermsId: row.paymentTermsId,
    journalId: row.journalId,
    lines: lines.map(mapLineToDomain),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleApInvoiceRepo implements IApInvoiceRepo {
  constructor(private readonly tx: TenantTx) { }

  async create(input: CreateApInvoiceInput): Promise<Result<ApInvoice>> {
    // Resolve currency code to ID
    const curr = await this.tx.query.currencies.findFirst({
      where: eq(currencies.code, input.currencyCode),
    });
    if (!curr) return err(new NotFoundError("Currency", input.currencyCode));

    // Compute total from lines
    let total = 0n;
    for (const line of input.lines) {
      total += line.amount + line.taxAmount;
    }

    const [row] = await this.tx.insert(apInvoices).values({
      tenantId: input.tenantId,
      companyId: input.companyId,
      supplierId: input.supplierId,
      ledgerId: input.ledgerId,
      invoiceNumber: input.invoiceNumber,
      supplierRef: input.supplierRef,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      currencyId: curr.id,
      totalAmount: total,
      description: input.description,
      poRef: input.poRef,
      receiptRef: input.receiptRef,
      paymentTermsId: input.paymentTermsId,
    }).returning();

    if (!row) return err(new NotFoundError("ApInvoice", "new"));

    // Insert lines
    const lineRows: LineRow[] = [];
    for (let i = 0; i < input.lines.length; i++) {
      const l = input.lines[i]!;
      const [lineRow] = await this.tx.insert(apInvoiceLines).values({
        tenantId: input.tenantId,
        invoiceId: row.id,
        lineNumber: i + 1,
        accountId: l.accountId,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        amount: l.amount,
        taxAmount: l.taxAmount,
      }).returning();
      if (lineRow) lineRows.push(lineRow);
    }

    return ok(mapToDomain(row, lineRows, input.currencyCode));
  }

  async findById(id: string): Promise<Result<ApInvoice>> {
    const row = await this.tx.query.apInvoices.findFirst({
      where: eq(apInvoices.id, id),
    });
    if (!row) return err(new NotFoundError("ApInvoice", id));

    const lines = await this.tx.query.apInvoiceLines.findMany({
      where: eq(apInvoiceLines.invoiceId, id),
    });

    // Resolve currency
    const curr = await this.tx.query.currencies.findFirst({
      where: eq(currencies.id, row.currencyId),
    });

    return ok(mapToDomain(row, lines, curr?.code ?? "USD"));
  }

  async findBySupplier(supplierId: string, params?: PaginationParams): Promise<PaginatedResult<ApInvoice>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.apInvoices.findMany({
        where: eq(apInvoices.supplierId, supplierId),
        limit,
        offset,
      }),
      this.tx.select({ total: count() }).from(apInvoices).where(eq(apInvoices.supplierId, supplierId)),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(rows.map(async (r) => {
      const lines = await this.tx.query.apInvoiceLines.findMany({ where: eq(apInvoiceLines.invoiceId, r.id) });
      const curr = await this.tx.query.currencies.findFirst({ where: eq(currencies.id, r.currencyId) });
      return mapToDomain(r, lines, curr?.code ?? "USD");
    }));

    return { data, total, page, limit };
  }

  async findByStatus(status: string, params?: PaginationParams): Promise<PaginatedResult<ApInvoice>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.apInvoices.findMany({
        where: eq(apInvoices.status, status as typeof apInvoices.$inferSelect.status),
        limit,
        offset,
      }),
      this.tx.select({ total: count() }).from(apInvoices).where(eq(apInvoices.status, status as typeof apInvoices.$inferSelect.status)),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(rows.map(async (r) => {
      const lines = await this.tx.query.apInvoiceLines.findMany({ where: eq(apInvoiceLines.invoiceId, r.id) });
      const curr = await this.tx.query.currencies.findFirst({ where: eq(currencies.id, r.currencyId) });
      return mapToDomain(r, lines, curr?.code ?? "USD");
    }));

    return { data, total, page, limit };
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<ApInvoice>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.apInvoices.findMany({ limit, offset }),
      this.tx.select({ total: count() }).from(apInvoices),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(rows.map(async (r) => {
      const lines = await this.tx.query.apInvoiceLines.findMany({ where: eq(apInvoiceLines.invoiceId, r.id) });
      const curr = await this.tx.query.currencies.findFirst({ where: eq(currencies.id, r.currencyId) });
      return mapToDomain(r, lines, curr?.code ?? "USD");
    }));

    return { data, total, page, limit };
  }

  async findUnpaid(): Promise<ApInvoice[]> {
    const rows = await this.tx.query.apInvoices.findMany({
      where: inArray(apInvoices.status, ["POSTED", "PARTIALLY_PAID", "APPROVED"]),
    });

    return Promise.all(rows.map(async (r) => {
      const lines = await this.tx.query.apInvoiceLines.findMany({ where: eq(apInvoiceLines.invoiceId, r.id) });
      const curr = await this.tx.query.currencies.findFirst({ where: eq(currencies.id, r.currencyId) });
      return mapToDomain(r, lines, curr?.code ?? "USD");
    }));
  }

  async updateStatus(id: string, status: string, journalId?: string): Promise<Result<ApInvoice>> {
    const values: Record<string, unknown> = {
      status: status as typeof apInvoices.$inferSelect.status,
      updatedAt: new Date(),
    };
    if (journalId) values.journalId = journalId;

    await this.tx.update(apInvoices).set(values).where(eq(apInvoices.id, id));
    return this.findById(id);
  }

  async recordPayment(id: string, amount: bigint): Promise<Result<ApInvoice>> {
    await this.tx.update(apInvoices).set({
      paidAmount: sql`${apInvoices.paidAmount} + ${amount}`,
      updatedAt: new Date(),
    }).where(eq(apInvoices.id, id));

    // Check if fully paid
    const row = await this.tx.query.apInvoices.findFirst({ where: eq(apInvoices.id, id) });
    if (row && row.paidAmount >= row.totalAmount) {
      await this.tx.update(apInvoices).set({ status: "PAID", updatedAt: new Date() }).where(eq(apInvoices.id, id));
    } else if (row && row.paidAmount > 0n) {
      await this.tx.update(apInvoices).set({ status: "PARTIALLY_PAID", updatedAt: new Date() }).where(eq(apInvoices.id, id));
    }

    return this.findById(id);
  }
}
