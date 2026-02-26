import { eq, count, desc, inArray, sql } from 'drizzle-orm';
import { ok, err, NotFoundError, money } from '@afenda/core';
import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { arInvoices, arInvoiceLines } from '@afenda/db';
import type { ArInvoice, ArInvoiceLine } from '../entities/ar-invoice.js';
import type { IArInvoiceRepo, CreateArInvoiceInput } from '../ports/ar-invoice-repo.js';

type InvoiceRow = typeof arInvoices.$inferSelect;
type LineRow = typeof arInvoiceLines.$inferSelect;

function extractFirstRow<T>(result: unknown): T | undefined {
  if (Array.isArray(result)) return result[0] as T;
  if (result && typeof result === 'object' && 'rows' in result) {
    return (result as { rows: T[] }).rows[0];
  }
  return undefined;
}

function mapLineToDomain(row: LineRow, currencyCode: string): ArInvoiceLine {
  return {
    id: row.id,
    invoiceId: row.invoiceId,
    lineNumber: row.lineNumber,
    accountId: row.accountId,
    description: row.description,
    quantity: row.quantity,
    unitPrice: money(row.unitPrice, currencyCode),
    amount: money(row.amount, currencyCode),
    taxAmount: money(row.taxAmount, currencyCode),
  };
}

function mapToDomain(row: InvoiceRow, lines: LineRow[]): ArInvoice {
  const cc = row.currencyCode;
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId as ArInvoice['companyId'],
    customerId: row.customerId,
    ledgerId: row.ledgerId as ArInvoice['ledgerId'],
    invoiceNumber: row.invoiceNumber,
    customerRef: row.customerRef,
    invoiceDate: row.invoiceDate,
    dueDate: row.dueDate,
    totalAmount: money(row.totalAmount, cc),
    paidAmount: money(row.paidAmount, cc),
    status: row.status as ArInvoice['status'],
    description: row.description,
    paymentTermsId: row.paymentTermsId,
    journalId: row.journalId,
    lines: lines.map((l) => mapLineToDomain(l, cc)),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleArInvoiceRepo implements IArInvoiceRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(input: CreateArInvoiceInput): Promise<Result<ArInvoice>> {
    let total = 0n;
    for (const line of input.lines) {
      total += line.amount + line.taxAmount;
    }

    const [row] = await this.tx
      .insert(arInvoices)
      .values({
        tenantId: input.tenantId,
        companyId: input.companyId,
        customerId: input.customerId,
        ledgerId: input.ledgerId,
        invoiceNumber: input.invoiceNumber,
        customerRef: input.customerRef,
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate,
        currencyCode: input.currencyCode,
        totalAmount: total,
        description: input.description,
        paymentTermsId: input.paymentTermsId,
      })
      .returning();

    if (!row) return err(new NotFoundError('ArInvoice', 'new'));

    const lineRows: LineRow[] = [];
    for (let i = 0; i < input.lines.length; i++) {
      const l = input.lines[i]!;
      const [lineRow] = await this.tx
        .insert(arInvoiceLines)
        .values({
          tenantId: input.tenantId,
          invoiceId: row.id,
          lineNumber: i + 1,
          accountId: l.accountId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: l.amount,
          taxAmount: l.taxAmount,
        })
        .returning();
      if (lineRow) lineRows.push(lineRow);
    }

    return ok(mapToDomain(row, lineRows));
  }

  async findById(id: string): Promise<Result<ArInvoice>> {
    const row = await this.tx.query.arInvoices.findFirst({
      where: eq(arInvoices.id, id),
    });
    if (!row) return err(new NotFoundError('ArInvoice', id));

    const lines = await this.tx.query.arInvoiceLines.findMany({
      where: eq(arInvoiceLines.invoiceId, id),
    });

    return ok(mapToDomain(row, lines));
  }

  async findByCustomer(
    customerId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<ArInvoice>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.arInvoices.findMany({
        where: eq(arInvoices.customerId, customerId),
        orderBy: [desc(arInvoices.createdAt), desc(arInvoices.id)],
        limit,
        offset,
      }),
      this.tx
        .select({ total: count() })
        .from(arInvoices)
        .where(eq(arInvoices.customerId, customerId)),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(
      rows.map(async (r) => {
        const lines = await this.tx.query.arInvoiceLines.findMany({
          where: eq(arInvoiceLines.invoiceId, r.id),
        });
        return mapToDomain(r, lines);
      })
    );

    return { data, total, page, limit };
  }

  async findByStatus(
    status: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<ArInvoice>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.arInvoices.findMany({
        where: eq(arInvoices.status, status as typeof arInvoices.$inferSelect.status),
        orderBy: [desc(arInvoices.createdAt), desc(arInvoices.id)],
        limit,
        offset,
      }),
      this.tx
        .select({ total: count() })
        .from(arInvoices)
        .where(eq(arInvoices.status, status as typeof arInvoices.$inferSelect.status)),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(
      rows.map(async (r) => {
        const lines = await this.tx.query.arInvoiceLines.findMany({
          where: eq(arInvoiceLines.invoiceId, r.id),
        });
        return mapToDomain(r, lines);
      })
    );

    return { data, total, page, limit };
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<ArInvoice>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.arInvoices.findMany({
        orderBy: [desc(arInvoices.createdAt), desc(arInvoices.id)],
        limit,
        offset,
      }),
      this.tx.select({ total: count() }).from(arInvoices),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(
      rows.map(async (r) => {
        const lines = await this.tx.query.arInvoiceLines.findMany({
          where: eq(arInvoiceLines.invoiceId, r.id),
        });
        return mapToDomain(r, lines);
      })
    );

    return { data, total, page, limit };
  }

  async findUnpaid(): Promise<ArInvoice[]> {
    const rows = await this.tx.query.arInvoices.findMany({
      where: inArray(arInvoices.status, ['POSTED', 'PARTIALLY_PAID', 'APPROVED']),
      orderBy: [desc(arInvoices.dueDate), desc(arInvoices.id)],
    });

    return Promise.all(
      rows.map(async (r) => {
        const lines = await this.tx.query.arInvoiceLines.findMany({
          where: eq(arInvoiceLines.invoiceId, r.id),
        });
        return mapToDomain(r, lines);
      })
    );
  }

  async updateStatus(id: string, status: string, journalId?: string): Promise<Result<ArInvoice>> {
    const values: Record<string, unknown> = {
      status: status as typeof arInvoices.$inferSelect.status,
      updatedAt: new Date(),
    };
    if (journalId) values.journalId = journalId;

    await this.tx.update(arInvoices).set(values).where(eq(arInvoices.id, id));
    return this.findById(id);
  }

  async recordPayment(id: string, amount: bigint): Promise<Result<ArInvoice>> {
    const result = await this.tx.execute(sql`
      UPDATE ${arInvoices}
      SET
        paid_amount = ${arInvoices.paidAmount} + ${amount},
        status = CASE
          WHEN ${arInvoices.paidAmount} + ${amount} >= ${arInvoices.totalAmount} THEN 'PAID'
          WHEN ${arInvoices.paidAmount} + ${amount} > 0 THEN 'PARTIALLY_PAID'
          ELSE status
        END,
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `);
    const row = extractFirstRow<InvoiceRow>(result);
    if (!row) return err(new NotFoundError('ArInvoice', id));

    const lines = await this.tx.query.arInvoiceLines.findMany({
      where: eq(arInvoiceLines.invoiceId, id),
    });
    return ok(mapToDomain(row, lines));
  }

  async writeOff(id: string): Promise<Result<ArInvoice>> {
    await this.tx
      .update(arInvoices)
      .set({
        status: 'WRITTEN_OFF',
        updatedAt: new Date(),
      })
      .where(eq(arInvoices.id, id));
    return this.findById(id);
  }
}
