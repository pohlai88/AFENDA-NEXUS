/**
 * Portal Registry — machine-readable map of all SP-tracked work items (§0.2).
 *
 * Usage in commits/PRs: feat(SP-1001): wire portal identity resolver
 * Usage in code: // SP-1006: proof chain entry for case status transition
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type SpStatus = 'planned' | 'in_progress' | 'done' | 'blocked';

export interface SpRegistryEntry {
  readonly cap: string;
  readonly title: string;
  readonly status: SpStatus;
  readonly phase: string;
}

// ─── Registry ───────────────────────────────────────────────────────────────

export const PORTAL_REGISTRY = {
  // ─── 1000 series: Kernel ────────────────────────────────────────────────
  'SP-1001': {
    cap: 'KERNEL',
    title: 'Portal Identity & Tenancy',
    status: 'done',
    phase: '1.0',
  },
  'SP-1002': {
    cap: 'KERNEL',
    title: 'Portal Permissions Model',
    status: 'done',
    phase: '1.0',
  },
  'SP-1003': {
    cap: 'KERNEL',
    title: 'Status Dictionary',
    status: 'done',
    phase: '1.0',
  },
  'SP-1004': {
    cap: 'KERNEL',
    title: 'Notification Backbone',
    status: 'done',
    phase: '1.0',
  },
  'SP-1005': {
    cap: 'KERNEL',
    title: 'Audit Log Middleware',
    status: 'done',
    phase: '1.0',
  },
  'SP-1006': {
    cap: 'KERNEL',
    title: 'Proof Chain Writer',
    status: 'done',
    phase: '1.0',
  },
  'SP-1007': {
    cap: 'KERNEL',
    title: 'Attachment Policy',
    status: 'done',
    phase: '1.0',
  },
  'SP-1008': {
    cap: 'KERNEL',
    title: 'Case ID Generator',
    status: 'done',
    phase: '1.0',
  },
  'SP-1009': {
    cap: 'KERNEL',
    title: 'Idempotency Standard',
    status: 'done',
    phase: '1.0',
  },
  'SP-1010': {
    cap: 'KERNEL',
    title: 'PortalRequestContext',
    status: 'done',
    phase: '1.0',
  },

  // ─── 2000 series: Contracts ─────────────────────────────────────────────
  'SP-2001': {
    cap: 'CAP-CASE',
    title: 'Case Contracts (Zod)',
    status: 'done',
    phase: '1.1',
  },
  'SP-2002': {
    cap: 'CAP-MSG',
    title: 'Message Contracts (Zod)',
    status: 'done',
    phase: '1.2',
  },
  'SP-2003': {
    cap: 'CAP-SOS',
    title: 'Escalation Contracts (Zod)',
    status: 'done',
    phase: '1.2',
  },
  'SP-2004': {
    cap: 'CAP-PROOF',
    title: 'Proof Chain Contracts (Zod)',
    status: 'done',
    phase: '1.2',
  },

  // ─── 3000 series: DB Schema ─────────────────────────────────────────────
  'SP-3001': {
    cap: 'CAP-CASE',
    title: 'supplier_case Table',
    status: 'done',
    phase: '1.1',
  },
  'SP-3002': {
    cap: 'CAP-CASE',
    title: 'supplier_case_timeline Table',
    status: 'done',
    phase: '1.1',
  },
  'SP-3003': {
    cap: 'CAP-MSG',
    title: 'supplier_message Tables',
    status: 'done',
    phase: '1.2',
  },
  'SP-3004': {
    cap: 'CAP-PROOF',
    title: 'portal_communication_proof Table',
    status: 'done',
    phase: '1.1',
  },
  'SP-3005': {
    cap: 'CAP-PAY-ETA',
    title: 'supplier_payment_status_fact Table',
    status: 'done',
    phase: '1.0',
  },

  // ─── 4000 series: Domain ────────────────────────────────────────────────
  'SP-4001': {
    cap: 'CAP-CASE',
    title: 'Case State Machine',
    status: 'done',
    phase: '1.0',
  },
  'SP-4002': {
    cap: 'CAP-PAY-ETA',
    title: 'Payment Stage Machine',
    status: 'done',
    phase: '1.0',
  },
  'SP-4003': {
    cap: 'CAP-CASE',
    title: 'SLA Calculator',
    status: 'done',
    phase: '1.0',
  },
  'SP-4004': {
    cap: 'CAP-BULK',
    title: 'Bulk Upload Fingerprint',
    status: 'done',
    phase: '1.0',
  },

  // ─── CAP-PAY-ETA — Real-Time Payment Tracking (P2, SILENT KILLER) ────────
  'SP-2011': {
    cap: 'CAP-PAY-ETA',
    title: 'Payment Status Contracts (Zod)',
    status: 'done',
    phase: '1.0',
  },
  'SP-3008': {
    cap: 'CAP-SCF',
    title: 'early_payment_offer Table',
    status: 'done',
    phase: '1.0',
  },
  'SP-5011': {
    cap: 'CAP-PAY-ETA',
    title: 'Payment Tracking Service',
    status: 'done',
    phase: '1.0',
  },
  'SP-5012': {
    cap: 'CAP-PAY-ETA',
    title: 'Payment Status Fact Repo',
    status: 'done',
    phase: '1.0',
  },
  'SP-5013': {
    cap: 'CAP-PAY-ETA',
    title: 'Payment Status Routes',
    status: 'done',
    phase: '1.0',
  },
  'SP-7011': {
    cap: 'CAP-PAY-ETA',
    title: 'Payment Status Timeline UI',
    status: 'done',
    phase: '1.0',
  },

  // ─── CAP-BULK (P13): Bulk Invoice Upload ──────────────────────────────────
  'SP-2013': {
    cap: 'CAP-BULK',
    title: 'Bulk Upload Contracts (Zod)',
    status: 'done',
    phase: '1.0',
  },
  'SP-5015': {
    cap: 'CAP-BULK',
    title: 'Bulk Upload Service (fingerprint + dedup)',
    status: 'done',
    phase: '1.0',
  },
  'SP-6013': {
    cap: 'CAP-BULK',
    title: 'Bulk Upload Frontend Page + Form',
    status: 'done',
    phase: '1.0',
  },

  // ─── CAP-CRDB (P15): Credit / Debit Note ─────────────────────────────────
  'SP-2014': {
    cap: 'CAP-CRDB',
    title: 'Credit/Debit Note Contracts (Zod)',
    status: 'done',
    phase: '1.0',
  },
  'SP-5016': {
    cap: 'CAP-CRDB',
    title: 'Credit/Debit Note Service + Route',
    status: 'done',
    phase: '1.0',
  },
  'SP-6011': {
    cap: 'CAP-CRDB',
    title: 'Credit/Debit Note Frontend Form',
    status: 'done',
    phase: '1.0',
  },

  // ─── CAP-MATCH (P21): 3-Way Match Resolution ─────────────────────────────
  'SP-6012': {
    cap: 'CAP-MATCH',
    title: '3-Way Match Resolution Page',
    status: 'done',
    phase: '1.0',
  },

  // ─── Phase 1.1.2 — Onboarding Wizard (CAP-ONB) ─────────────────────────
  'SP-2005': {
    cap: 'CAP-ONB',
    title: 'Onboarding Contracts',
    status: 'done',
    phase: '1.1',
  },
  'SP-3006': {
    cap: 'CAP-ONB',
    title: 'Onboarding Submission Table',
    status: 'done',
    phase: '1.1',
  },
  'SP-5001': {
    cap: 'CAP-ONB',
    title: 'Onboarding Service',
    status: 'done',
    phase: '1.1',
  },
  'SP-5002': {
    cap: 'CAP-ONB',
    title: 'Onboarding Routes',
    status: 'done',
    phase: '1.1',
  },
  'SP-6001': {
    cap: 'CAP-ONB',
    title: 'Onboarding Wizard Pages',
    status: 'done',
    phase: '1.1',
  },

  // ─── Phase 1.1.3 — Compliance Expiry Alerts (CAP-COMPL) ────────────────
  'SP-2006': {
    cap: 'CAP-COMPL',
    title: 'Compliance Alert Contracts',
    status: 'done',
    phase: '1.1',
  },
  'SP-3007': {
    cap: 'CAP-COMPL',
    title: 'Compliance Alert Log Table',
    status: 'done',
    phase: '1.1',
  },
  'SP-5003': {
    cap: 'CAP-COMPL',
    title: 'Compliance Alert Service',
    status: 'done',
    phase: '1.1',
  },
  'SP-5004': {
    cap: 'CAP-COMPL',
    title: 'Compliance Alert Routes',
    status: 'done',
    phase: '1.1',
  },
  'SP-7001': {
    cap: 'CAP-COMPL',
    title: 'Compliance Frontend Pages',
    status: 'done',
    phase: '1.1',
  },

  // ─── Phase 1.1.4 — Audit Trail (CAP-AUDIT) ─────────────────────────────────
  'SP-2007': {
    cap: 'CAP-AUDIT',
    title: 'Audit Trail Contracts',
    status: 'done',
    phase: '1.1',
  },
  'SP-5005': {
    cap: 'CAP-AUDIT',
    title: 'Audit Trail Service',
    status: 'done',
    phase: '1.1',
  },
  'SP-5006': {
    cap: 'CAP-AUDIT',
    title: 'Audit Trail Route',
    status: 'done',
    phase: '1.1',
  },
  'SP-7002': {
    cap: 'CAP-AUDIT',
    title: 'Activity Frontend Page',
    status: 'done',
    phase: '1.1',
  },
  'SP-8012': {
    cap: 'CAP-AUDIT',
    title: 'Audit Service Tests',
    status: 'done',
    phase: '1.1',
  },

  // ─── CAP-MSG (P5): Messaging Hub ────────────────────────────────────────
  'SP-5007': {
    cap: 'CAP-MSG',
    title: 'Messaging Service',
    status: 'done',
    phase: '1.2',
  },
  'SP-6002': {
    cap: 'CAP-MSG',
    title: 'Messaging Routes',
    status: 'done',
    phase: '1.2',
  },
  'SP-7003': {
    cap: 'CAP-MSG',
    title: 'Messaging Frontend Pages',
    status: 'done',
    phase: '1.2',
  },
  'SP-8013': {
    cap: 'CAP-MSG',
    title: 'Messaging Service Tests',
    status: 'done',
    phase: '1.2',
  },

  // ─── CAP-SOS (P19): Breakglass Escalation ───────────────────────────────
  'SP-5008': {
    cap: 'CAP-SOS',
    title: 'Escalation Service',
    status: 'done',
    phase: '1.2',
  },
  'SP-6003': {
    cap: 'CAP-SOS',
    title: 'Escalation Routes',
    status: 'done',
    phase: '1.2',
  },
  'SP-7004': {
    cap: 'CAP-SOS',
    title: 'Escalation Frontend Pages',
    status: 'done',
    phase: '1.2',
  },
  'SP-8014': {
    cap: 'CAP-SOS',
    title: 'Escalation Service Tests',
    status: 'done',
    phase: '1.2',
  },

  // ─── CAP-SCF (P3): Early Payment / Dynamic Discounting ──────────────────
  'SP-5014': {
    cap: 'CAP-SCF',
    title: 'SCF Early Payment Service',
    status: 'done',
    phase: '1.0',
  },
  'SP-6004': {
    cap: 'CAP-SCF',
    title: 'SCF Routes',
    status: 'done',
    phase: '1.0',
  },
  'SP-7009': {
    cap: 'CAP-SCF',
    title: 'Early Payment Offers Frontend Page',
    status: 'done',
    phase: '1.0',
  },

  // ─── CAP-LOC (P22): Company Location Directory ──────────────────────────
  'SP-2008': {
    cap: 'CAP-LOC',
    title: 'Location Contracts (Zod)',
    status: 'done',
    phase: '1.2',
  },
  'SP-5009': {
    cap: 'CAP-LOC',
    title: 'Company Location Service',
    status: 'done',
    phase: '1.2',
  },
  'SP-6005': {
    cap: 'CAP-LOC',
    title: 'Location Routes',
    status: 'done',
    phase: '1.2',
  },
  'SP-7005': {
    cap: 'CAP-LOC',
    title: 'Company Locations Frontend Page',
    status: 'done',
    phase: '1.2',
  },
  'SP-8015': {
    cap: 'CAP-LOC',
    title: 'Location Service Tests',
    status: 'done',
    phase: '1.2',
  },

  // ─── CAP-DIR (P23): Senior Management Directory ─────────────────────────
  'SP-2009': {
    cap: 'CAP-DIR',
    title: 'Directory Contracts (Zod)',
    status: 'done',
    phase: '1.2',
  },
  'SP-5017': {
    cap: 'CAP-DIR',
    title: 'Directory Service',
    status: 'done',
    phase: '1.2',
  },
  'SP-6006': {
    cap: 'CAP-DIR',
    title: 'Directory Routes',
    status: 'done',
    phase: '1.2',
  },
  'SP-7006': {
    cap: 'CAP-DIR',
    title: 'Senior Management Directory Frontend',
    status: 'done',
    phase: '1.2',
  },
  'SP-8016': {
    cap: 'CAP-DIR',
    title: 'Directory Service Tests',
    status: 'done',
    phase: '1.2',
  },

  // ─── CAP-ANNOUNCE (P24): Dashboard Announcements ────────────────────────
  'SP-2010': {
    cap: 'CAP-ANNOUNCE',
    title: 'Announcement Contracts (Zod)',
    status: 'done',
    phase: '1.2',
  },
  'SP-3011': {
    cap: 'CAP-ANNOUNCE',
    title: 'portal_announcement Table',
    status: 'done',
    phase: '1.2',
  },
  'SP-5010': {
    cap: 'CAP-ANNOUNCE',
    title: 'Announcement Service',
    status: 'done',
    phase: '1.2',
  },
  'SP-6007': {
    cap: 'CAP-ANNOUNCE',
    title: 'Announcement Routes',
    status: 'done',
    phase: '1.2',
  },
  'SP-7010': {
    cap: 'CAP-ANNOUNCE',
    title: 'Announcements Frontend Page',
    status: 'done',
    phase: '1.2',
  },

  // ─── CAP-VAULT (P26): Document Vault ────────────────────────────────────
  'SP-5018': {
    cap: 'CAP-VAULT',
    title: 'Document Vault Service',
    status: 'done',
    phase: '1.2',
  },
  'SP-6008': {
    cap: 'CAP-VAULT',
    title: 'Document Vault Routes',
    status: 'done',
    phase: '1.2',
  },
  'SP-7007': {
    cap: 'CAP-VAULT',
    title: 'Document Vault Frontend Pages',
    status: 'done',
    phase: '1.2',
  },

  // ─── CAP-APPT (P27): Appointment Scheduling ─────────────────────────────
  'SP-2012': {
    cap: 'CAP-APPT',
    title: 'Appointment Contracts (Zod)',
    status: 'done',
    phase: '1.2',
  },
  'SP-3013': {
    cap: 'CAP-APPT',
    title: 'portal_meeting_request Table',
    status: 'done',
    phase: '1.2',
  },
  'SP-5019': {
    cap: 'CAP-APPT',
    title: 'Appointment Service',
    status: 'done',
    phase: '1.2',
  },
  'SP-6009': {
    cap: 'CAP-APPT',
    title: 'Appointment Routes',
    status: 'done',
    phase: '1.2',
  },
  'SP-7008': {
    cap: 'CAP-APPT',
    title: 'Appointments Frontend Page',
    status: 'done',
    phase: '1.2',
  },

  // ─── CAP-SEARCH (P16): Advanced Search, Filter, Pagination ──────────────
  'SP-2019': {
    cap: 'CAP-SEARCH',
    title: 'Search/Filter Shared Types',
    status: 'done',
    phase: '1.3',
  },
  'SP-7012': {
    cap: 'CAP-SEARCH',
    title: 'Portal Search / Filter UI Components',
    status: 'done',
    phase: '1.3',
  },

  // ─── CAP-BRAND (P12): White-Label Portal Branding ───────────────────────────────────────────────
  'SP-3014': {
    cap: 'CAP-BRAND',
    title: 'portal_brand_config Table',
    status: 'done',
    phase: '1.3',
  },
  'SP-5020': {
    cap: 'CAP-BRAND',
    title: 'Portal Theme CSS Token System',
    status: 'done',
    phase: '1.3',
  },
  'SP-7013': {
    cap: 'CAP-BRAND',
    title: 'Tenant Brand Provider + CSS Variables',
    status: 'done',
    phase: '1.3',
  },

  // ─── CAP-PWA (P11): Mobile-Responsive PWA ───────────────────────────────
  'SP-7014': {
    cap: 'CAP-PWA',
    title: 'PWA Manifest + Mobile Meta',
    status: 'done',
    phase: '1.3',
  },

  // ─── CAP-API (P18): Webhook / API Access ────────────────────────────────
  'SP-2016': {
    cap: 'CAP-API',
    title: 'Webhook Contracts (Zod)',
    status: 'done',
    phase: '1.3',
  },
  'SP-3012': {
    cap: 'CAP-API',
    title: 'portal_webhook_subscription Table',
    status: 'done',
    phase: '1.3',
  },
  'SP-5021': {
    cap: 'CAP-API',
    title: 'Webhook Subscription Service',
    status: 'done',
    phase: '1.3',
  },
  'SP-6010': {
    cap: 'CAP-API',
    title: 'Webhook Routes',
    status: 'done',
    phase: '1.3',
  },
  'SP-7015': {
    cap: 'CAP-API',
    title: 'API Access / Webhook Management Frontend',
    status: 'done',
    phase: '1.3',
  },

  // ─── CAP-MULTI (P9): Multi-Entity Portal View ────────────────────────────
  'SP-2017': {
    cap: 'CAP-MULTI',
    title: 'Multi-Entity Contracts (Zod)',
    status: 'done',
    phase: '1.3',
  },
  'SP-5022': {
    cap: 'CAP-MULTI',
    title: 'Multi-Entity Scope Service',
    status: 'done',
    phase: '1.3',
  },
  'SP-7016': {
    cap: 'CAP-MULTI',
    title: 'Entity Selector + Multi-Entity Dashboard',
    status: 'done',
    phase: '1.3',
  },
  // ─── CAP-BANK (P28): Bank Account Self-Service ───────────────────────────
  'SP-5023': {
    cap: 'CAP-BANK',
    title: 'Bank Account Service',
    status: 'done',
    phase: '1.0',
  },
  'SP-6014': {
    cap: 'CAP-BANK',
    title: 'Bank Account Routes',
    status: 'done',
    phase: '1.0',
  },
  'SP-7017': {
    cap: 'CAP-BANK',
    title: 'Bank Accounts Frontend Page',
    status: 'done',
    phase: '1.0',
  },

  // ─── CAP-BULK ext: Invoice Submit (single-path) ─────────────────────────
  'SP-5024': {
    cap: 'CAP-BULK',
    title: 'Invoice Submit Service (single-path portal flow)',
    status: 'done',
    phase: '1.0',
  },

  // ─── CAP-NOTIF (P29): Notification Preferences ────────────────────────
  'SP-5025': {
    cap: 'CAP-NOTIF',
    title: 'Notification Preferences Service',
    status: 'done',
    phase: '1.0',
  },
  'SP-7018': {
    cap: 'CAP-NOTIF',
    title: 'Notification Settings UI',
    status: 'done',
    phase: '1.0',
  },

  // ─── CAP-PROFILE (P30): Supplier Self-Service Profile ────────────────────
  'SP-5026': {
    cap: 'CAP-PROFILE',
    title: 'Supplier Profile Service',
    status: 'done',
    phase: '1.0',
  },
  'SP-7019': {
    cap: 'CAP-PROFILE',
    title: 'Profile Frontend Page',
    status: 'done',
    phase: '1.0',
  },

  // ─── CAP-PAY-ETA ext: Remittance Advice Download ──────────────────────
  'SP-5027': {
    cap: 'CAP-PAY-ETA',
    title: 'Remittance Advice Service',
    status: 'done',
    phase: '1.0',
  },

  // ─── CAP-RECON (P31): Statement Reconciliation ─────────────────────────
  'SP-5028': {
    cap: 'CAP-RECON',
    title: 'Statement Reconciliation Service',
    status: 'done',
    phase: '1.0',
  },
  'SP-7020': {
    cap: 'CAP-RECON',
    title: 'Reconciliation Frontend Page',
    status: 'done',
    phase: '1.0',
  },

  // ─── CAP-VIS (P32): Portal Invoice/Payment Visibility ───────────────────
  'SP-5036': {
    cap: 'CAP-VIS',
    title: 'Portal Visibility Service (invoice/payment/aging read layer)',
    status: 'done',
    phase: '1.0',
  },

  // ─── CAP-WHT (P33): Withholding Tax Certificate Access ──────────────────
  'SP-5029': {
    cap: 'CAP-WHT',
    title: 'WHT Certificate Service',
    status: 'done',
    phase: '1.0',
  },
  'SP-7021': {
    cap: 'CAP-WHT',
    title: 'WHT Frontend Page',
    status: 'done',
    phase: '1.0',
  },

  // ─── CAP-INV (P34): Supplier Invitation Flow ─────────────────────────────
  'SP-5030': {
    cap: 'CAP-INV',
    title: 'Supplier Invitation Service (magic-link, Phase 1.1.7)',
    status: 'done',
    phase: '1.1',
  },

  // ─── Previously unregistered test files (now registered) ────────────────
  'SP-8017': {
    cap: 'CAP-ONB',
    title: 'Onboarding Service Tests',
    status: 'done',
    phase: '1.1',
  },
  'SP-8018': {
    cap: 'CAP-COMPL',
    title: 'Compliance Service Tests',
    status: 'done',
    phase: '1.1',
  },
  'SP-8019': {
    cap: 'CAP-CASE',
    title: 'Case Service Tests',
    status: 'done',
    phase: '1.1',
  },
  'SP-8021': {
    cap: 'CAP-INV',
    title: 'Invitation Service Tests',
    status: 'done',
    phase: '1.1',
  },

  // ─── 8000 series: Tests ─────────────────────────────────────────────────
  'SP-8001': {
    cap: 'KERNEL',
    title: 'Kernel Unit Tests',
    status: 'done',
    phase: '1.0',
  },
  'SP-8011': {
    cap: 'CAP-CASE',
    title: 'Case E2E Tests',
    status: 'planned',
    phase: '1.1',
  },
  'SP-8020': {
    cap: 'KERNEL',
    title: 'SoD Gate Script',
    status: 'planned',
    phase: '1.0',
  },
  'SP-8022': {
    cap: 'CAP-PROOF',
    title: 'Proof Chain Property Tests',
    status: 'planned',
    phase: '1.0',
  },
  'SP-8025': {
    cap: 'KERNEL',
    title: 'Supplier-Safe Language Gate',
    status: 'planned',
    phase: '1.0',
  },
} as const satisfies Record<string, SpRegistryEntry>;

export type SpCode = keyof typeof PORTAL_REGISTRY;

// ─── Registry Helpers ───────────────────────────────────────────────────────

/**
 * Get a registry entry by SP code.
 */
export function getRegistryEntry(code: SpCode): SpRegistryEntry {
  return PORTAL_REGISTRY[code];
}

/**
 * Get all entries for a given phase.
 */
export function getEntriesByPhase(phase: string): ReadonlyArray<[SpCode, SpRegistryEntry]> {
  return (Object.entries(PORTAL_REGISTRY) as Array<[SpCode, SpRegistryEntry]>).filter(
    ([_, entry]) => entry.phase === phase
  );
}

/**
 * Get all entries for a given capability.
 */
export function getEntriesByCap(cap: string): ReadonlyArray<[SpCode, SpRegistryEntry]> {
  return (Object.entries(PORTAL_REGISTRY) as Array<[SpCode, SpRegistryEntry]>).filter(
    ([_, entry]) => entry.cap === cap
  );
}

/**
 * Get completion percentage for a phase.
 */
export function getPhaseCompletion(phase: string): {
  total: number;
  done: number;
  percent: number;
} {
  const entries = getEntriesByPhase(phase);
  const done = entries.filter(([_, e]) => e.status === 'done').length;
  return {
    total: entries.length,
    done,
    percent: entries.length > 0 ? Math.round((done / entries.length) * 100) : 0,
  };
}
