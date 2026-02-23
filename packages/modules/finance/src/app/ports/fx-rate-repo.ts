import type { Result } from "@afenda/core";
import type { FxRate } from "../../domain/index.js";

export interface IFxRateRepo {
  findRate(
    fromCurrency: string,
    toCurrency: string,
    effectiveDate: Date,
  ): Promise<Result<FxRate>>;
}
