import type { IArInvoiceRepo } from "./ar-invoice-repo.js";
import type { IArPaymentAllocationRepo } from "./ar-payment-allocation-repo.js";
import type { IDunningRepo } from "./dunning-repo.js";

export interface ArDeps {
  readonly arInvoiceRepo: IArInvoiceRepo;
  readonly arPaymentAllocationRepo: IArPaymentAllocationRepo;
  readonly dunningRepo: IDunningRepo;
}
