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
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  divested: { label: 'Divested', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  acquired: { label: 'Newly Acquired', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
};
