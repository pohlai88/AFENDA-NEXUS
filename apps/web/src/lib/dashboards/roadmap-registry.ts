// ─── Roadmap Registry ────────────────────────────────────────────────────────
//
// Central registry for planned features across all modules. This provides a
// single source of truth for what's on the roadmap, enabling consistent
// "Coming Soon" sections across all domain dashboards.
//
// Key contracts:
// - `RoadmapFeature`: Typed feature definition with target dates and status
// - `getPlannedFeatures()`: Helper to filter planned features for a module
//
// ─────────────────────────────────────────────────────────────────────────────

/** Module IDs that can have roadmap features. */
export type ModuleId =
  | 'finance'
  | 'ap'
  | 'ar'
  | 'gl'
  | 'assets'
  | 'treasury'
  | 'banking'
  | 'tax'
  | 'controlling'
  | 'ifrs'
  | 'consolidation'
  | 'intercompany'
  | 'travel'
  | 'hrm'
  | 'crm'
  | 'boardroom';

/** Status for roadmap features. */
export type RoadmapStatus = 'planned' | 'beta';

/**
 * A planned feature to be shown in the "Coming Soon" section.
 *
 * Fields:
 * - `id`: Unique identifier for this roadmap entry (e.g. 'audit-trail')
 * - `moduleId`: Which module dashboard shows it (e.g. 'finance')
 * - `featureId`: Maps to the feature card (e.g. 'audit')
 * - `title`: User-facing name
 * - `description`: Short summary
 * - `detail`: Optional longer explanation
 * - `target`: Optional target date (e.g. 'Q2 2026', 'MVP-2')
 * - `status`: 'planned' or 'beta'
 * - `order`: Optional display order
 */
export interface RoadmapFeature {
  id: string;
  moduleId: ModuleId;
  featureId: string;
  title: string;
  description: string;
  detail?: string;
  target?: string;
  status: RoadmapStatus;
  order?: number;
}

/** Global roadmap registry. */
export const ROADMAP_REGISTRY: RoadmapFeature[] = [
  // ─── Finance Module ─────────────────────────────────────────────────────
  {
    id: 'audit-trail',
    moduleId: 'finance',
    featureId: 'audit',
    title: 'Audit Trail',
    description: 'Comprehensive audit logging and compliance reports',
    detail:
      'Full change tracking, user activity logs, regulatory compliance reporting with tamper-proof audit trails.',
    target: 'Q2 2026',
    status: 'planned',
    order: 1,
  },
  {
    id: 'advanced-consolidation',
    moduleId: 'finance',
    featureId: 'consolidation-advanced',
    title: 'Advanced Consolidation',
    description: 'Multi-entity consolidation with eliminations',
    detail:
      'Multi-level consolidation with automatic intercompany eliminations, minority interest calculations, and goodwill tracking.',
    target: 'Q3 2026',
    status: 'planned',
    order: 2,
  },
  {
    id: 'ai-journal-assistant',
    moduleId: 'finance',
    featureId: 'gl-ai',
    title: 'AI Journal Assistant',
    description: 'Intelligent journal entry suggestions and anomaly detection',
    detail:
      'Machine learning-powered assistant that suggests GL postings, detects anomalies, and learns from your accounting patterns.',
    target: 'Q4 2026',
    status: 'planned',
    order: 3,
  },
  {
    id: 'crypto-accounting',
    moduleId: 'finance',
    featureId: 'crypto',
    title: 'Crypto & Digital Assets',
    description: 'Cryptocurrency and digital asset accounting',
    detail:
      'Support for cryptocurrency transactions, wallet integration, fair value adjustments, and regulatory reporting.',
    target: 'Q1 2027',
    status: 'planned',
    order: 4,
  },
  {
    id: 'esg-reporting',
    moduleId: 'finance',
    featureId: 'esg',
    title: 'ESG Reporting',
    description: 'Environmental, Social & Governance metrics and reporting',
    detail:
      'Integrated ESG data collection, carbon accounting, sustainability metrics, and regulatory compliance reports.',
    target: 'Q2 2027',
    status: 'planned',
    order: 5,
  },

  // ─── AP Module ─────────────────────────────────────────────────────────
  {
    id: 'supplier-portal-advanced',
    moduleId: 'ap',
    featureId: 'supplier-portal-v2',
    title: 'Supplier Portal 2.0',
    description: 'Advanced supplier self-service portal',
    detail:
      'Enhanced supplier portal with real-time payment status, dispute resolution, document upload, and communication hub.',
    target: 'Q2 2026',
    status: 'beta',
    order: 1,
  },
  {
    id: 'ap-automation',
    moduleId: 'ap',
    featureId: 'ap-automation',
    title: 'AP Automation',
    description: 'Intelligent invoice processing and approval routing',
    detail:
      'OCR-powered invoice capture, automatic GL coding, smart approval workflows, and exception handling.',
    target: 'Q3 2026',
    status: 'planned',
    order: 2,
  },

  // ─── AR Module ─────────────────────────────────────────────────────────
  {
    id: 'credit-risk-ml',
    moduleId: 'ar',
    featureId: 'credit-risk',
    title: 'Credit Risk ML',
    description: 'Machine learning-powered credit risk assessment',
    detail:
      'Predictive credit risk scoring using ML, automatic credit limit recommendations, and early warning alerts.',
    target: 'Q3 2026',
    status: 'planned',
    order: 1,
  },
  {
    id: 'collections-workflow',
    moduleId: 'ar',
    featureId: 'collections',
    title: 'Collections Workflow',
    description: 'Automated collections management and workflow',
    detail:
      'Smart collections prioritization, automated reminder scheduling, promise-to-pay tracking, and collector dashboards.',
    target: 'Q4 2026',
    status: 'planned',
    order: 2,
  },

  // ─── Treasury Module ───────────────────────────────────────────────────
  {
    id: 'cash-positioning',
    moduleId: 'treasury',
    featureId: 'cash-positioning',
    title: 'Real-Time Cash Positioning',
    description: 'Multi-bank cash visibility and positioning',
    detail:
      'Real-time aggregation of cash positions across multiple banks, currencies, and entities with intraday updates.',
    target: 'Q2 2026',
    status: 'planned',
    order: 1,
  },
  {
    id: 'fx-hedging',
    moduleId: 'treasury',
    featureId: 'fx-hedging',
    title: 'FX Hedging & Derivatives',
    description: 'Foreign exchange hedging and derivative instruments',
    detail:
      'FX exposure management, hedge accounting (IAS 39/IFRS 9), derivative valuation, and effectiveness testing.',
    target: 'Q3 2026',
    status: 'planned',
    order: 2,
  },

  // ─── Tax Module ────────────────────────────────────────────────────────
  {
    id: 'tax-automation',
    moduleId: 'tax',
    featureId: 'tax-automation',
    title: 'Tax Automation',
    description: 'Automated tax calculations and filing',
    detail:
      'Automatic tax determination, real-time compliance checks, e-filing integration, and multi-jurisdiction support.',
    target: 'Q4 2026',
    status: 'planned',
    order: 1,
  },

  // ─── HRM Module ────────────────────────────────────────────────────────
  {
    id: 'talent-acquisition',
    moduleId: 'hrm',
    featureId: 'recruitment-ats',
    title: 'Applicant Tracking System',
    description: 'Full-featured recruitment and ATS',
    detail:
      'Job posting, candidate pipeline, interview scheduling, offer management, and onboarding workflows.',
    target: 'Q3 2026',
    status: 'planned',
    order: 1,
  },

  // ─── Finance Module — AIS Benchmark Gaps ────────────────────────────────
  {
    id: 'accounting-hub',
    moduleId: 'gl',
    featureId: 'accounting-hub',
    title: 'Accounting Hub',
    description: 'Central accounting rule engine and subledger processing',
    detail:
      'Unified rule engine for subledger-to-GL postings, transformation rules, event-driven journal creation, and multi-source integration.',
    target: 'Q3 2026',
    status: 'planned',
    order: 1,
  },
  {
    id: 'accrual-engine',
    moduleId: 'gl',
    featureId: 'accrual-engine',
    title: 'Accrual Engine',
    description: 'Automated accrual calculation and reversal',
    detail:
      'Period-end accrual schedules, auto-reversal on first day of next period, configurable accrual rules, and batch processing.',
    target: 'Q3 2026',
    status: 'planned',
    order: 2,
  },
  {
    id: 'fx-revaluation',
    moduleId: 'gl',
    featureId: 'fx-revaluation',
    title: 'FX Revaluation',
    description: 'Foreign currency revaluation and translation adjustments',
    detail:
      'Period-end revaluation of open balances, unrealized gain/loss posting, CTA (Currency Translation Adjustment), and IAS 21 compliance.',
    target: 'Q4 2026',
    status: 'planned',
    order: 3,
  },
  {
    id: 'ic-settlement',
    moduleId: 'intercompany',
    featureId: 'ic-settlement',
    title: 'IC Settlement & Netting',
    description: 'Intercompany netting, matching, and settlement',
    detail:
      'Automated IC matching, multi-lateral netting runs, payment instruction generation, dispute management, and reconciliation dashboards.',
    target: 'Q1 2027',
    status: 'planned',
    order: 1,
  },
  {
    id: 'profitability-analysis',
    moduleId: 'controlling',
    featureId: 'profitability-analysis',
    title: 'Profitability Analysis (CO-PA)',
    description: 'Margin analysis and contribution reporting by segment',
    detail:
      'Multi-dimensional profitability analysis by customer, product, region, and channel. Contribution margin waterfall and real-time analytics.',
    target: 'Q2 2027',
    status: 'planned',
    order: 1,
  },

  // ─── Finance Module — Competitor-Inspired Features ──────────────────────
  {
    id: 'e-invoicing',
    moduleId: 'ap',
    featureId: 'e-invoicing',
    title: 'E-Invoicing',
    description: 'Electronic invoicing compliance (Peppol, ZATCA, UBL)',
    detail:
      'Standards-based electronic invoicing with Peppol BIS, ZATCA Phase 2, UBL 2.1, and Factur-X support. Real-time validation and regulatory submission.',
    target: 'Q3 2026',
    status: 'planned',
    order: 3,
  },
  {
    id: 'payment-hub',
    moduleId: 'banking',
    featureId: 'payment-hub',
    title: 'Payment Hub',
    description: 'Orchestrated multi-channel payment processing',
    detail:
      'Centralized payment orchestration across banks, payment networks, and methods. Payment factory, format generation (ISO 20022, SWIFT), and real-time status tracking.',
    target: 'Q4 2026',
    status: 'planned',
    order: 1,
  },
  {
    id: 'multi-gaap',
    moduleId: 'gl',
    featureId: 'multi-gaap',
    title: 'Multi-GAAP Reporting',
    description: 'Parallel accounting under multiple standards',
    detail:
      'Maintain books under IFRS, US GAAP, local GAAP simultaneously. Automated adjustment entries, reconciliation, and dual reporting.',
    target: 'Q1 2027',
    status: 'planned',
    order: 4,
  },
  {
    id: 'statutory-reporting',
    moduleId: 'finance',
    featureId: 'statutory-reporting',
    title: 'Statutory Reporting',
    description: 'Jurisdiction-specific regulatory filings',
    detail:
      'Pre-built templates for XBRL, iXBRL, and jurisdiction-specific filings. Automated data extraction, validation, and electronic submission.',
    target: 'Q1 2027',
    status: 'planned',
    order: 6,
  },
  {
    id: 'sox-compliance',
    moduleId: 'finance',
    featureId: 'sox-compliance',
    title: 'SOX Compliance Suite',
    description: 'Internal controls and SOX 302/404 compliance',
    detail:
      'Control library, risk assessment matrix, testing workflows, deficiency tracking, and management certification support for SOX compliance.',
    target: 'Q2 2027',
    status: 'planned',
    order: 7,
  },
  {
    id: 'workflow-designer',
    moduleId: 'finance',
    featureId: 'workflow-designer',
    title: 'Workflow Designer',
    description: 'Visual approval workflow builder',
    detail:
      'Drag-and-drop workflow designer for approval chains, conditional routing, escalation rules, delegation, and SLA monitoring.',
    target: 'Q2 2027',
    status: 'planned',
    order: 8,
  },
  {
    id: 'document-management',
    moduleId: 'finance',
    featureId: 'document-management',
    title: 'Document Management',
    description: 'Financial document management system',
    detail:
      'Centralized DMS for invoices, contracts, receipts, and compliance documents. OCR indexing, retention policies, and full-text search.',
    target: 'Q3 2027',
    status: 'planned',
    order: 9,
  },
  {
    id: 'open-banking',
    moduleId: 'banking',
    featureId: 'open-banking',
    title: 'Open Banking',
    description: 'PSD2 / open banking API integration',
    detail:
      'Real-time bank feeds via open banking APIs, automated reconciliation, consent management, and multi-bank aggregation.',
    target: 'Q4 2027',
    status: 'planned',
    order: 2,
  },
];

/**
 * Resolve a dotted domainId to the base moduleId used in roadmap entries.
 *
 * Domain dashboard configs use dotted IDs like `finance.overview`, `finance.ap`,
 * `finance.gl` — but roadmap entries use flat IDs like `finance`, `ap`, `gl`.
 *
 * Resolution strategy:
 * 1. `finance.overview` → `finance` (overview is the parent module)
 * 2. `finance.ap`       → `ap`      (sub-domain suffix is the moduleId)
 * 3. `ap`               → `ap`      (already a flat moduleId)
 */
function resolveModuleId(domainId: string): string {
  if (!domainId.includes('.')) return domainId;
  const parts = domainId.split('.');
  // "finance.overview" → the overview page shows the parent module's roadmap
  if (parts[1] === 'overview') return parts[0]!;
  // "finance.ap" → sub-domain dashboards use the suffix as moduleId
  return parts[1]!;
}

/**
 * Get planned features for a module, excluding active features.
 *
 * Accepts dotted domainIds (e.g. `finance.overview`, `finance.ap`) and
 * resolves them to the flat moduleId used in roadmap entries.
 *
 * @param moduleId - Module or domainId (e.g. 'finance', 'finance.overview', 'finance.ap')
 * @param activeFeatureIds - Set of featureIds already active (to dedupe)
 * @returns Sorted array of roadmap features for the module
 *
 * @example
 * ```ts
 * const shortcuts = deriveShortcuts(navGroups);
 * const activeIds = new Set(shortcuts.map(s => s.featureId));
 * const planned = getPlannedFeatures('finance.overview', activeIds);
 * // Resolves to moduleId 'finance', returns 5 planned features
 * ```
 */
export function getPlannedFeatures(
  moduleId: ModuleId | string,
  activeFeatureIds: Set<string>
): RoadmapFeature[] {
  const resolved = resolveModuleId(moduleId);
  return ROADMAP_REGISTRY.filter(
    (f) => f.moduleId === resolved && !activeFeatureIds.has(f.featureId)
  ).toSorted((a, b) => (a.order ?? 999) - (b.order ?? 999));
}
