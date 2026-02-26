// ─── Group Entity Types ──────────────────────────────────────────────────────

export type EntityType = 'parent' | 'subsidiary' | 'associate' | 'joint_venture';
export type ConsolidationMethod = 'full' | 'equity' | 'proportionate' | 'none';
export type EntityStatus = 'active' | 'inactive' | 'divested' | 'acquired';

export interface GroupEntity {
  id: string;
  entityCode: string;
  name: string;
  country: string;
  currency: string;
  entityType: EntityType;
  consolidationMethod: ConsolidationMethod;
  status: EntityStatus;
  parentId: string | null;
  ownershipPercent: number;
  votingRightsPercent: number;
  acquisitionDate: Date | null;
  divestmentDate: Date | null;
  functionalCurrency: string;
  reportingCurrency: string;
  fxRate: number;
  children?: GroupEntity[];
}

export interface OwnershipChange {
  id: string;
  entityId: string;
  effectiveDate: Date;
  previousOwnership: number;
  newOwnership: number;
  changeType: 'acquisition' | 'partial_disposal' | 'dilution' | 'step_acquisition';
  consideration: number | null;
  nciAdjustment: number | null;
  goodwillImpact: number | null;
  journalEntryId: string | null;
}

export interface GoodwillAllocation {
  id: string;
  entityId: string;
  entityName: string;
  acquisitionDate: Date;
  initialGoodwill: number;
  accumulatedImpairment: number;
  carryingAmount: number;
  cguId: string;
  cguName: string;
  lastImpairmentTest: Date | null;
  currency: string;
}

export interface ConsolidationSummary {
  totalEntities: number;
  subsidiaries: number;
  associates: number;
  jointVentures: number;
  totalGoodwill: number;
  nciEquity: number;
  eliminationEntries: number;
}

export const entityTypeLabels: Record<EntityType, string> = {
  parent: 'Parent',
  subsidiary: 'Subsidiary',
  associate: 'Associate',
  joint_venture: 'Joint Venture',
};

export const consolidationMethodLabels: Record<ConsolidationMethod, string> = {
  full: 'Full Consolidation',
  equity: 'Equity Method',
  proportionate: 'Proportionate',
  none: 'Not Consolidated',
};

export const entityStatusConfig: Record<EntityStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-success/15 text-success dark:bg-success/20' },
  inactive: { label: 'Inactive', color: 'bg-muted text-muted-foreground' },
  divested: { label: 'Divested', color: 'bg-warning/15 text-warning dark:bg-warning/20' },
  acquired: { label: 'Newly Acquired', color: 'bg-info/15 text-info dark:bg-info/20' },
};
