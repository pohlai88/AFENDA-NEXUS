import type { Result } from '@afenda/core';
import type { FxRate } from '../entities/fx-rate.js';

export interface IFxRateRepo {
  findRate(fromCurrency: string, toCurrency: string, effectiveDate: Date): Promise<Result<FxRate>>;
}
