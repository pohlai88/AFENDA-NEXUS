import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { cashForecasts } from '@afenda/db';
import type { CashForecast } from '../entities/cash-forecast.js';
import type { ICashForecastRepo, CreateCashForecastInput } from '../ports/cash-forecast-repo.js';

type Row = typeof cashForecasts.$inferSelect;

function mapToDomain(row: Row): CashForecast {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    forecastDate: row.forecastDate,
    forecastType: row.forecastType as CashForecast['forecastType'],
    description: row.description,
    amount: row.amount,
    currencyCode: row.currencyCode,
    probability: row.probability,
    sourceDocumentId: row.sourceDocumentId,
    sourceDocumentType: row.sourceDocumentType,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleCashForecastRepo implements ICashForecastRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<CashForecast | null> {
    const rows = await this.db
      .select()
      .from(cashForecasts)
      .where(eq(cashForecasts.id, id))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCompany(companyId: string): Promise<readonly CashForecast[]> {
    const rows = await this.db
      .select()
      .from(cashForecasts)
      .where(eq(cashForecasts.companyId, companyId));
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly CashForecast[]> {
    const rows = await this.db.select().from(cashForecasts);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateCashForecastInput): Promise<CashForecast> {
    const [row] = await this.db
      .insert(cashForecasts)
      .values({ tenantId, ...input })
      .returning();
    return mapToDomain(row!);
  }
}
