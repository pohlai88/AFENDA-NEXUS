import { eq, and, count } from "drizzle-orm";
import { ok, err, NotFoundError } from "@afenda/core";
import type { Result, PaginationParams, PaginatedResult } from "@afenda/core";
import type { TenantTx } from "@afenda/db";
import { glJournals, glJournalLines } from "@afenda/db";
import type { Journal } from "../entities/journal.js";
import type { IJournalRepo, CreateJournalInput } from "../../../slices/gl/ports/journal-repo.js";
import { mapJournalToDomain } from "../../../shared/mappers/journal-mapper.js";
import type { JournalRowWithLines } from "../../../shared/mappers/journal-mapper.js";

export class DrizzleJournalRepo implements IJournalRepo {
  constructor(private readonly tx: TenantTx) { }

  async findById(id: string): Promise<Result<Journal>> {
    const row = await this.tx.query.glJournals.findFirst({
      where: eq(glJournals.id, id),
      with: {
        lines: { with: { account: true } },
        ledger: true,
      },
    });
    if (!row) return err(new NotFoundError("Journal", id));
    return ok(mapJournalToDomain(row as unknown as JournalRowWithLines));
  }

  async save(journal: Journal): Promise<Result<Journal>> {
    const [updated] = await this.tx
      .update(glJournals)
      .set({
        status: journal.status,
        reversedById: journal.reversedById ?? null,
        updatedAt: new Date(),
      })
      .where(eq(glJournals.id, journal.id))
      .returning();
    if (!updated) return err(new NotFoundError("Journal", journal.id));

    return this.findById(journal.id);
  }

  async create(input: CreateJournalInput): Promise<Result<Journal>> {
    const [journal] = await this.tx
      .insert(glJournals)
      .values({
        tenantId: input.tenantId,
        ledgerId: input.ledgerId,
        fiscalPeriodId: input.fiscalPeriodId,
        journalNumber: input.journalNumber,
        description: input.description,
        postingDate: input.postingDate,
        status: "DRAFT",
        documentType: "JOURNAL",
        metadata: {},
      })
      .returning();

    if (!journal) return err(new NotFoundError("Journal", "new"));

    if (input.lines.length > 0) {
      await this.tx.insert(glJournalLines).values(
        input.lines.map((line, idx) => ({
          tenantId: input.tenantId,
          journalId: journal.id,
          lineNumber: idx + 1,
          accountId: line.accountId,
          description: line.description ?? null,
          debit: line.debit,
          credit: line.credit,
        })),
      );
    }

    return this.findById(journal.id);
  }

  async findByPeriod(
    periodId: string,
    status?: Journal["status"],
    pagination?: PaginationParams,
  ): Promise<Result<PaginatedResult<Journal>>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [eq(glJournals.fiscalPeriodId, periodId)];
    if (status) {
      conditions.push(eq(glJournals.status, status));
    }
    const where = and(...conditions);

    const [rows, [{ total }]] = await Promise.all([
      this.tx.query.glJournals.findMany({
        where,
        limit,
        offset,
        with: {
          lines: { with: { account: true } },
          ledger: true,
        },
      }),
      this.tx.select({ total: count() }).from(glJournals).where(where),
    ]);

    return ok({
      data: rows.map((r) => mapJournalToDomain(r as unknown as JournalRowWithLines)),
      total,
      page,
      limit,
    });
  }
}
