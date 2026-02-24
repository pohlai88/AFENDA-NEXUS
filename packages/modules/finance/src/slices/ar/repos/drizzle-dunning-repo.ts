import { eq, count } from "drizzle-orm";
import { ok, err, NotFoundError } from "@afenda/core";
import type { Result, PaginationParams, PaginatedResult } from "@afenda/core";
import type { TenantTx } from "@afenda/db";
import { dunningRuns, dunningLetters } from "@afenda/db";
import type { DunningRun, DunningLetter, DunningLevel } from "../entities/dunning.js";
import type { IDunningRepo, CreateDunningRunInput, AddDunningLetterInput } from "../ports/dunning-repo.js";

type RunRow = typeof dunningRuns.$inferSelect;
type LetterRow = typeof dunningLetters.$inferSelect;

function mapLetterToDomain(row: LetterRow): DunningLetter {
  return {
    id: row.id,
    dunningRunId: row.dunningRunId,
    customerId: row.customerId,
    level: row.level as DunningLevel,
    invoiceIds: (row.invoiceIds as string[]) ?? [],
    totalOverdue: row.totalOverdue,
    currencyCode: row.currencyCode,
    sentAt: row.sentAt,
  };
}

function mapToDomain(row: RunRow, letters: LetterRow[]): DunningRun {
  return {
    id: row.id,
    tenantId: row.tenantId,
    runDate: row.runDate,
    status: row.status as DunningRun["status"],
    letters: letters.map(mapLetterToDomain),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleDunningRepo implements IDunningRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(input: CreateDunningRunInput): Promise<Result<DunningRun>> {
    const [row] = await this.tx.insert(dunningRuns).values({
      tenantId: input.tenantId,
      runDate: input.runDate,
    }).returning();

    if (!row) return err(new NotFoundError("DunningRun", "new"));
    return ok(mapToDomain(row, []));
  }

  async findById(id: string): Promise<Result<DunningRun>> {
    const row = await this.tx.query.dunningRuns.findFirst({
      where: eq(dunningRuns.id, id),
    });
    if (!row) return err(new NotFoundError("DunningRun", id));

    const letters = await this.tx.query.dunningLetters.findMany({
      where: eq(dunningLetters.dunningRunId, id),
    });

    return ok(mapToDomain(row, letters));
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<DunningRun>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.dunningRuns.findMany({ limit, offset }),
      this.tx.select({ total: count() }).from(dunningRuns),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(rows.map(async (r) => {
      const letters = await this.tx.query.dunningLetters.findMany({
        where: eq(dunningLetters.dunningRunId, r.id),
      });
      return mapToDomain(r, letters);
    }));

    return { data, total, page, limit };
  }

  async addLetter(runId: string, letter: AddDunningLetterInput): Promise<Result<DunningLetter>> {
    const run = await this.tx.query.dunningRuns.findFirst({
      where: eq(dunningRuns.id, runId),
    });
    if (!run) return err(new NotFoundError("DunningRun", runId));

    const [row] = await this.tx.insert(dunningLetters).values({
      tenantId: run.tenantId,
      dunningRunId: runId,
      customerId: letter.customerId,
      level: letter.level,
      invoiceIds: letter.invoiceIds as string[],
      totalOverdue: letter.totalOverdue,
      currencyCode: letter.currencyCode,
    }).returning();

    if (!row) return err(new NotFoundError("DunningLetter", "new"));
    return ok(mapLetterToDomain(row));
  }

  async updateStatus(id: string, status: string): Promise<Result<DunningRun>> {
    await this.tx.update(dunningRuns).set({
      status: status as typeof dunningRuns.$inferSelect.status,
      updatedAt: new Date(),
    }).where(eq(dunningRuns.id, id));
    return this.findById(id);
  }
}
