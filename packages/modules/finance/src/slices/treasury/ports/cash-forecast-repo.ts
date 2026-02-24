import type { CashForecast } from "../entities/cash-forecast.js";

export interface CreateCashForecastInput {
  readonly companyId: string;
  readonly forecastDate: Date;
  readonly forecastType: CashForecast["forecastType"];
  readonly description: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly probability: number;
  readonly sourceDocumentId: string | null;
  readonly sourceDocumentType: string | null;
}

export interface ICashForecastRepo {
  findById(id: string): Promise<CashForecast | null>;
  findByCompany(companyId: string): Promise<readonly CashForecast[]>;
  findAll(): Promise<readonly CashForecast[]>;
  create(tenantId: string, input: CreateCashForecastInput): Promise<CashForecast>;
}
