import type { ITpPolicyRepo } from './tp-policy-repo.js';
import type { ITpBenchmarkRepo } from './tp-benchmark-repo.js';

export interface TransferPricingDeps {
  readonly tpPolicyRepo: ITpPolicyRepo;
  readonly tpBenchmarkRepo: ITpBenchmarkRepo;
}
