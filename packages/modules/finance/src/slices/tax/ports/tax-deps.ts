import type { ITaxRateRepo } from './tax-rate-repo.js';
import type { ITaxCodeRepo } from './tax-code-repo.js';
import type { ITaxReturnRepo } from './tax-return-repo.js';
import type { IWhtCertificateRepo } from './wht-certificate-repo.js';

export interface TaxDeps {
  readonly taxRateRepo: ITaxRateRepo;
  readonly taxCodeRepo: ITaxCodeRepo;
  readonly taxReturnRepo: ITaxReturnRepo;
  readonly whtCertificateRepo: IWhtCertificateRepo;
}
