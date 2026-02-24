import { eq, desc } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { fairValueMeasurements } from "@afenda/db";
import type { FairValueMeasurement, IFairValueMeasurementRepo, CreateFairValueMeasurementInput } from "../ports/fair-value-measurement-repo.js";

type Row = typeof fairValueMeasurements.$inferSelect;

function mapToDomain(row: Row): FairValueMeasurement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    instrumentId: row.instrumentId,
    measurementDate: row.measurementDate,
    fairValueLevel: row.fairValueLevel as FairValueMeasurement["fairValueLevel"],
    fairValue: row.fairValue,
    previousFairValue: row.previousFairValue,
    valuationMethod: row.valuationMethod,
    currencyCode: row.currencyCode,
    gainOrLoss: row.gainOrLoss,
    isRecognizedInPL: row.isRecognizedInPL,
    journalId: row.journalId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleFairValueMeasurementRepo implements IFairValueMeasurementRepo {
  constructor(private readonly db: TenantTx) {}

  async findByInstrument(instrumentId: string): Promise<readonly FairValueMeasurement[]> {
    const rows = await this.db
      .select()
      .from(fairValueMeasurements)
      .where(eq(fairValueMeasurements.instrumentId, instrumentId))
      .orderBy(desc(fairValueMeasurements.measurementDate));
    return rows.map(mapToDomain);
  }

  async findLatest(instrumentId: string): Promise<FairValueMeasurement | null> {
    const rows = await this.db
      .select()
      .from(fairValueMeasurements)
      .where(eq(fairValueMeasurements.instrumentId, instrumentId))
      .orderBy(desc(fairValueMeasurements.measurementDate))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async create(tenantId: string, input: CreateFairValueMeasurementInput): Promise<FairValueMeasurement> {
    const [row] = await this.db.insert(fairValueMeasurements).values({ tenantId, ...input }).returning();
    return mapToDomain(row!);
  }
}
