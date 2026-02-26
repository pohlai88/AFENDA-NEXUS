// ─── Deferred Tax Types ──────────────────────────────────────────────────────

export type DeferredTaxType = 'dta' | 'dtl';
export type OriginType =
  | 'fixed_assets'
  | 'intangibles'
  | 'provisions'
  | 'leases'
  | 'revenue_recognition'
  | 'share_compensation'
  | 'losses'
  | 'credits'
  | 'other';
export type ItemStatus = 'active' | 'reversed' | 'utilized';

export interface DeferredTaxItem {
  id: string;
  itemNumber: string;
  description: string;
  type: DeferredTaxType;
  originType: OriginType;
  status: ItemStatus;
  bookBasis: number;
  taxBasis: number;
  temporaryDifference: number;
  taxRate: number;
  deferredTaxAmount: number;
  currency: string;
  jurisdiction: string;
  originatingPeriod: string;
  expectedReversalPeriod: string | null;
  sourceId: string | null;
  sourceType: string | null;
  glAccountId: string;
  glAccountCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeferredTaxMovement {
  id: string;
  itemId: string;
  periodEnd: Date;
  openingBalance: number;
  additions: number;
  reversals: number;
  rateChange: number;
  fxAdjustment: number;
  closingBalance: number;
  journalEntryId: string | null;
}

export interface DeferredTaxSummary {
  totalDTA: number;
  totalDTL: number;
  netPosition: number;
  dtaByOrigin: Record<OriginType, number>;
  dtlByOrigin: Record<OriginType, number>;
  valuationAllowance: number;
  movementYTD: number;
}

export const deferredTaxTypeLabels: Record<DeferredTaxType, string> = {
  dta: 'Deferred Tax Asset',
  dtl: 'Deferred Tax Liability',
};

export const originTypeLabels: Record<OriginType, string> = {
  fixed_assets: 'Fixed Assets',
  intangibles: 'Intangibles',
  provisions: 'Provisions',
  leases: 'Leases (IFRS 16)',
  revenue_recognition: 'Revenue Recognition',
  share_compensation: 'Share-Based Compensation',
  losses: 'Tax Losses',
  credits: 'Tax Credits',
  other: 'Other',
};

export const itemStatusConfig: Record<ItemStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-success/15 text-success dark:bg-success/20' },
  reversed: { label: 'Reversed', color: 'bg-info/15 text-info dark:bg-info/20' },
  utilized: { label: 'Utilized', color: 'bg-muted text-muted-foreground' },
};
