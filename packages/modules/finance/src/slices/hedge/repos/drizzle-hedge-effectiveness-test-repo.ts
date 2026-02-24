import { eq, desc } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { hedgeEffectivenessTests } from "@afenda/db";
import type {
  HedgeEffectivenessTest,
  IHedgeEffectivenessTestRepo,
  CreateHedgeEffectivenessTestInput,
} from "../ports/hedge-effectiveness-test-repo.js";

type Row = typeof hedgeEffectivenessTests.$inferSelect;

function mapToDomain(row: Row): HedgeEffectivenessTest {
  return {
    id: row.id,
    tenantId: row.tenantId,
    hedgeRelationshipId: row.hedgeRelationshipId,
    testDate: row.testDate,
    testMethod: row.testMethod as HedgeEffectivenessTest["testMethod"],
    result: row.result as HedgeEffectivenessTest["result"],
    effectivenessRatioBps: row.effectivenessRatioBps,
    hedgedItemFairValueChange: row.hedgedItemFairValueChange,
    hedgingInstrumentFairValueChange: row.hedgingInstrumentFairValueChange,
    ineffectivePortionAmount: row.ineffectivePortionAmount,
    currencyCode: row.currencyCode,
    notes: row.notes,
    journalId: row.journalId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleHedgeEffectivenessTestRepo implements IHedgeEffectivenessTestRepo {
  constructor(private readonly db: TenantTx) {}

  async findByRelationship(hedgeRelationshipId: string): Promise<readonly HedgeEffectivenessTest[]> {
    const rows = await this.db
      .select()
      .from(hedgeEffectivenessTests)
      .where(eq(hedgeEffectivenessTests.hedgeRelationshipId, hedgeRelationshipId))
      .orderBy(desc(hedgeEffectivenessTests.testDate));
    return rows.map(mapToDomain);
  }

  async findLatest(hedgeRelationshipId: string): Promise<HedgeEffectivenessTest | null> {
    const rows = await this.db
      .select()
      .from(hedgeEffectivenessTests)
      .where(eq(hedgeEffectivenessTests.hedgeRelationshipId, hedgeRelationshipId))
      .orderBy(desc(hedgeEffectivenessTests.testDate))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async create(tenantId: string, input: CreateHedgeEffectivenessTestInput): Promise<HedgeEffectivenessTest> {
    const [row] = await this.db.insert(hedgeEffectivenessTests).values({ tenantId, ...input }).returning();
    return mapToDomain(row!);
  }
}
