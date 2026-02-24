import type { IFinInstrumentRepo } from "./fin-instrument-repo.js";
import type { IFairValueMeasurementRepo } from "./fair-value-measurement-repo.js";

export interface FinInstrumentsDeps {
  readonly finInstrumentRepo: IFinInstrumentRepo;
  readonly fairValueMeasurementRepo: IFairValueMeasurementRepo;
}
