/**
 * Cash forecast entity — projected cash inflow/outflow.
 */

export type ForecastType = 'RECEIPTS' | 'PAYMENTS' | 'FINANCING' | 'INVESTING';

export interface CashForecast {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly forecastDate: Date;
  readonly forecastType: ForecastType;
  readonly description: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly probability: number;
  readonly sourceDocumentId: string | null;
  readonly sourceDocumentType: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
