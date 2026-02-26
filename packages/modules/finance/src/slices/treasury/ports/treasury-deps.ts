import type { ICashForecastRepo } from './cash-forecast-repo.js';
import type { ICovenantRepo } from './covenant-repo.js';
import type { IIcLoanRepo } from './ic-loan-repo.js';

export interface TreasuryDeps {
  readonly cashForecastRepo: ICashForecastRepo;
  readonly covenantRepo: ICovenantRepo;
  readonly icLoanRepo: IIcLoanRepo;
}
