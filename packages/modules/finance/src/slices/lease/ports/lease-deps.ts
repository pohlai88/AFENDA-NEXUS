import type { ILeaseContractRepo } from "./lease-contract-repo.js";
import type { ILeaseScheduleRepo } from "./lease-schedule-repo.js";
import type { ILeaseModificationRepo } from "./lease-modification-repo.js";

export interface LeaseDeps {
  readonly leaseContractRepo: ILeaseContractRepo;
  readonly leaseScheduleRepo: ILeaseScheduleRepo;
  readonly leaseModificationRepo: ILeaseModificationRepo;
}
