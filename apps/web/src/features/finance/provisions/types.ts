// ─── Provision Types ─────────────────────────────────────────────────────────

export type ProvisionType =
  | 'legal'
  | 'warranty'
  | 'restructuring'
  | 'environmental'
  | 'onerous_contract'
  | 'decommissioning'
  | 'other';
export type ProvisionStatus = 'active' | 'utilized' | 'reversed' | 'closed';

export interface Provision {
  id: string;
  provisionNumber: string;
  name: string;
  description: string;
  type: ProvisionType;
  status: ProvisionStatus;
  recognitionDate: Date;
  expectedSettlementDate: Date | null;
  initialAmount: number;
  currentBalance: number;
  currency: string;
  discountRate: number | null;
  presentValue: number | null;
  isDiscounted: boolean;
  utilizationYTD: number;
  additionsYTD: number;
  reversalsYTD: number;
  unwinding: number;
  glAccountId: string;
  glAccountCode: string;
  costCenterId: string | null;
  costCenterCode: string | null;
  contingentLiability: boolean;
  contingencyNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Provision Movement Types ────────────────────────────────────────────────

export type MovementType =
  | 'initial'
  | 'addition'
  | 'utilization'
  | 'reversal'
  | 'unwinding'
  | 'revaluation'
  | 'fx_adjustment';

export interface ProvisionMovement {
  id: string;
  provisionId: string;
  movementDate: Date;
  movementType: MovementType;
  amount: number;
  currency: string;
  description: string;
  reference: string | null;
  journalEntryId: string | null;
  journalEntryNumber: string | null;
  createdBy: string;
  createdAt: Date;
}

// ─── Provision Summary ───────────────────────────────────────────────────────

export interface ProvisionSummary {
  totalProvisions: number;
  activeProvisions: number;
  totalBalance: number;
  utilizationYTD: number;
  additionsYTD: number;
  reversalsYTD: number;
  contingentLiabilities: number;
  provisionsToReview: number;
}

// ─── Status Configs ──────────────────────────────────────────────────────────

export const provisionStatusConfig: Record<ProvisionStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-success/15 text-success dark:bg-success/20' },
  utilized: { label: 'Utilized', color: 'bg-info/15 text-info dark:bg-info/20' },
  reversed: { label: 'Reversed', color: 'bg-warning/15 text-warning dark:bg-warning/20' },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground' },
};

export const provisionTypeLabels: Record<ProvisionType, string> = {
  legal: 'Legal Claims',
  warranty: 'Warranty',
  restructuring: 'Restructuring',
  environmental: 'Environmental',
  onerous_contract: 'Onerous Contract',
  decommissioning: 'Decommissioning',
  other: 'Other',
};

export const movementTypeLabels: Record<MovementType, string> = {
  initial: 'Initial Recognition',
  addition: 'Addition',
  utilization: 'Utilization',
  reversal: 'Reversal',
  unwinding: 'Discount Unwinding',
  revaluation: 'Revaluation',
  fx_adjustment: 'FX Adjustment',
};
