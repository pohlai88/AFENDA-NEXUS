import { eq } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { bankMatches } from "@afenda/db";
import type { BankMatch } from "../entities/bank-match.js";
import type { IBankMatchRepo, CreateBankMatchInput } from "../ports/bank-match-repo.js";

type Row = typeof bankMatches.$inferSelect;

function mapToDomain(row: Row): BankMatch {
  return {
    id: row.id,
    tenantId: row.tenantId,
    statementLineId: row.statementLineId,
    journalId: row.journalId,
    sourceDocumentId: row.sourceDocumentId,
    sourceDocumentType: row.sourceDocumentType,
    matchType: row.matchType as BankMatch["matchType"],
    confidence: row.confidence as BankMatch["confidence"],
    confidenceScore: row.confidenceScore,
    matchedAmount: row.matchedAmount,
    currencyCode: row.currencyCode,
    matchedAt: row.matchedAt,
    matchedBy: row.matchedBy,
    confirmedAt: row.confirmedAt,
    confirmedBy: row.confirmedBy,
    createdAt: row.createdAt,
  };
}

export class DrizzleBankMatchRepo implements IBankMatchRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<BankMatch | null> {
    const rows = await this.db.select().from(bankMatches).where(eq(bankMatches.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByStatementLine(statementLineId: string): Promise<BankMatch | null> {
    const rows = await this.db.select().from(bankMatches).where(eq(bankMatches.statementLineId, statementLineId)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findAll(): Promise<readonly BankMatch[]> {
    const rows = await this.db.select().from(bankMatches);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateBankMatchInput): Promise<BankMatch> {
    const [row] = await this.db.insert(bankMatches).values({
      tenantId,
      statementLineId: input.statementLineId,
      journalId: input.journalId,
      sourceDocumentId: input.sourceDocumentId,
      sourceDocumentType: input.sourceDocumentType,
      matchType: input.matchType,
      confidence: input.confidence,
      confidenceScore: input.confidenceScore,
      matchedAmount: input.matchedAmount,
      currencyCode: input.currencyCode,
      matchedBy: input.matchedBy,
    }).returning();
    return mapToDomain(row!);
  }

  async confirm(id: string, confirmedBy: string): Promise<BankMatch> {
    const [row] = await this.db.update(bankMatches).set({ confirmedAt: new Date(), confirmedBy }).where(eq(bankMatches.id, id)).returning();
    return mapToDomain(row!);
  }
}
