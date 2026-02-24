import type { IGroupEntityRepo } from "./group-entity-repo.js";
import type { IOwnershipRecordRepo } from "./ownership-record-repo.js";
import type { IGoodwillRepo } from "./goodwill-repo.js";

export interface ConsolidationDeps {
  readonly groupEntityRepo: IGroupEntityRepo;
  readonly ownershipRecordRepo: IOwnershipRecordRepo;
  readonly goodwillRepo: IGoodwillRepo;
}
