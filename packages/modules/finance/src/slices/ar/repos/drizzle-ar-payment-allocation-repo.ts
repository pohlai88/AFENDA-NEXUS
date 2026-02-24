import { eq, count } from "drizzle-orm";
import { ok, err, NotFoundError, money } from "@afenda/core";
import type { Result, PaginationParams, PaginatedResult } from "@afenda/core";
import type { TenantTx } from "@afenda/db";
import { arPaymentAllocations, arAllocationItems } from "@afenda/db";
import type { ArPaymentAllocation, AllocationItem } from "../entities/ar-payment-allocation.js";
import type {
  IArPaymentAllocationRepo,
  CreatePaymentAllocationInput,
  AddAllocationItemInput,
} from "../ports/ar-payment-allocation-repo.js";

type AllocRow = typeof arPaymentAllocations.$inferSelect;
type ItemRow = typeof arAllocationItems.$inferSelect;

function mapItemToDomain(row: ItemRow, currencyCode: string): AllocationItem {
  return {
    id: row.id,
    paymentAllocationId: row.paymentAllocationId,
    invoiceId: row.invoiceId,
    allocatedAmount: money(row.allocatedAmount, currencyCode),
    journalId: row.journalId,
  };
}

function mapToDomain(row: AllocRow, items: ItemRow[]): ArPaymentAllocation {
  const cc = row.currencyCode;
  return {
    id: row.id,
    tenantId: row.tenantId,
    customerId: row.customerId,
    paymentDate: row.paymentDate,
    paymentRef: row.paymentRef,
    totalAmount: money(row.totalAmount, cc),
    allocations: items.map((i) => mapItemToDomain(i, cc)),
    createdAt: row.createdAt,
  };
}

export class DrizzleArPaymentAllocationRepo implements IArPaymentAllocationRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(input: CreatePaymentAllocationInput): Promise<Result<ArPaymentAllocation>> {
    const [row] = await this.tx.insert(arPaymentAllocations).values({
      tenantId: input.tenantId,
      customerId: input.customerId,
      paymentDate: input.paymentDate,
      paymentRef: input.paymentRef,
      totalAmount: input.totalAmount,
      currencyCode: input.currencyCode,
    }).returning();

    if (!row) return err(new NotFoundError("ArPaymentAllocation", "new"));
    return ok(mapToDomain(row, []));
  }

  async findById(id: string): Promise<Result<ArPaymentAllocation>> {
    const row = await this.tx.query.arPaymentAllocations.findFirst({
      where: eq(arPaymentAllocations.id, id),
    });
    if (!row) return err(new NotFoundError("ArPaymentAllocation", id));

    const items = await this.tx.query.arAllocationItems.findMany({
      where: eq(arAllocationItems.paymentAllocationId, id),
    });

    return ok(mapToDomain(row, items));
  }

  async findByCustomer(customerId: string, params?: PaginationParams): Promise<PaginatedResult<ArPaymentAllocation>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.arPaymentAllocations.findMany({
        where: eq(arPaymentAllocations.customerId, customerId),
        limit,
        offset,
      }),
      this.tx.select({ total: count() }).from(arPaymentAllocations)
        .where(eq(arPaymentAllocations.customerId, customerId)),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(rows.map(async (r) => {
      const items = await this.tx.query.arAllocationItems.findMany({
        where: eq(arAllocationItems.paymentAllocationId, r.id),
      });
      return mapToDomain(r, items);
    }));

    return { data, total, page, limit };
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<ArPaymentAllocation>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.arPaymentAllocations.findMany({ limit, offset }),
      this.tx.select({ total: count() }).from(arPaymentAllocations),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(rows.map(async (r) => {
      const items = await this.tx.query.arAllocationItems.findMany({
        where: eq(arAllocationItems.paymentAllocationId, r.id),
      });
      return mapToDomain(r, items);
    }));

    return { data, total, page, limit };
  }

  async addItem(allocationId: string, item: AddAllocationItemInput): Promise<Result<AllocationItem>> {
    const alloc = await this.tx.query.arPaymentAllocations.findFirst({
      where: eq(arPaymentAllocations.id, allocationId),
    });
    if (!alloc) return err(new NotFoundError("ArPaymentAllocation", allocationId));

    const [row] = await this.tx.insert(arAllocationItems).values({
      tenantId: alloc.tenantId,
      paymentAllocationId: allocationId,
      invoiceId: item.invoiceId,
      allocatedAmount: item.allocatedAmount,
    }).returning();

    if (!row) return err(new NotFoundError("ArAllocationItem", "new"));
    return ok(mapItemToDomain(row, alloc.currencyCode));
  }
}
