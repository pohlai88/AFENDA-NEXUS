import { eq, and, lte, count, asc } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { recurringTemplates } from "@afenda/db";
import type { PaginationParams, PaginatedResult } from "@afenda/core";
import type { RecurringTemplate, RecurringTemplateLine } from "../../../domain/index.js";
import type { IRecurringTemplateRepo, CreateRecurringTemplateInput } from "../../../slices/hub/ports/recurring-template-repo.js";

function mapRow(row: typeof recurringTemplates.$inferSelect): RecurringTemplate {
  const lines = (row.lineTemplate ?? []) as unknown as RecurringTemplateLine[];
  return {
    id: row.id!,
    companyId: row.companyId as never,
    ledgerId: row.ledgerId as never,
    description: row.description,
    lines,
    frequency: row.frequency as RecurringTemplate["frequency"],
    nextRunDate: row.nextRunDate,
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}

export class DrizzleRecurringTemplateRepo implements IRecurringTemplateRepo {
  constructor(private readonly tx: TenantTx) { }

  async findById(id: string): Promise<RecurringTemplate | null> {
    const [row] = await this.tx
      .select()
      .from(recurringTemplates)
      .where(eq(recurringTemplates.id, id))
      .limit(1);

    return row ? mapRow(row) : null;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<RecurringTemplate>> {
    const limit = params.limit;
    const page = params.page;
    const offset = (page - 1) * limit;

    const [rows, [{ total }]] = await Promise.all([
      this.tx
        .select()
        .from(recurringTemplates)
        .orderBy(asc(recurringTemplates.createdAt))
        .limit(limit)
        .offset(offset),
      this.tx.select({ total: count() }).from(recurringTemplates),
    ]);

    return {
      data: rows.map(mapRow),
      total: total,
      page,
      limit,
    };
  }

  async findDue(asOfDate: Date): Promise<RecurringTemplate[]> {
    const rows = await this.tx
      .select()
      .from(recurringTemplates)
      .where(
        and(
          eq(recurringTemplates.isActive, true),
          lte(recurringTemplates.nextRunDate, asOfDate),
        ),
      )
      .orderBy(asc(recurringTemplates.nextRunDate));

    return rows.map(mapRow);
  }

  async create(input: CreateRecurringTemplateInput): Promise<RecurringTemplate> {
    const [row] = await this.tx
      .insert(recurringTemplates)
      .values({
        tenantId: input.tenantId,
        companyId: input.companyId,
        ledgerId: input.ledgerId,
        description: input.description,
        lineTemplate: input.lines as unknown as Record<string, unknown>,
        frequency: input.frequency,
        nextRunDate: input.nextRunDate,
      })
      .returning();

    return mapRow(row!);
  }

  async updateNextRunDate(id: string, nextRunDate: Date): Promise<void> {
    await this.tx
      .update(recurringTemplates)
      .set({ nextRunDate })
      .where(eq(recurringTemplates.id, id));
  }

  async deactivate(id: string): Promise<void> {
    await this.tx
      .update(recurringTemplates)
      .set({ isActive: false })
      .where(eq(recurringTemplates.id, id));
  }
}
