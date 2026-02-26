import type { IIcAgreementRepo, IIcTransactionRepo } from './ic-repo.js';
import type { IIcSettlementRepo } from './ic-settlement-repo.js';

export interface IcDeps {
  readonly icAgreementRepo: IIcAgreementRepo;
  readonly icTransactionRepo: IIcTransactionRepo;
  readonly icSettlementRepo: IIcSettlementRepo;
}
