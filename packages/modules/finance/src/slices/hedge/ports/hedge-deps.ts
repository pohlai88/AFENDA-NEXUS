import type { IHedgeRelationshipRepo } from './hedge-relationship-repo.js';
import type { IHedgeEffectivenessTestRepo } from './hedge-effectiveness-test-repo.js';

export interface HedgeDeps {
  readonly hedgeRelationshipRepo: IHedgeRelationshipRepo;
  readonly hedgeEffectivenessTestRepo: IHedgeEffectivenessTestRepo;
}
