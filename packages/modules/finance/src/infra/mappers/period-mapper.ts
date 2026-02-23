import { companyId, dateRange } from "@afenda/core";
import type { FiscalPeriod, PeriodStatus } from "../../domain/index.js";
import type { FiscalPeriod as DbFiscalPeriod } from "@afenda/db";

export function mapPeriodToDomain(row: DbFiscalPeriod): FiscalPeriod {
  return {
    id: row.id,
    companyId: companyId(""), // periods are tenant-scoped, not company-scoped in DB
    name: row.name,
    range: dateRange(row.startDate, row.endDate),
    status: row.status as PeriodStatus,
  };
}
