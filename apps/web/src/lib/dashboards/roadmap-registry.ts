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
];

/**
 * Get planned features for a module, excluding active features.
 *
 * @param moduleId - The module to filter for (e.g. 'finance', 'ap')
 * @param activeFeatureIds - Set of featureIds already active (to dedupe)
 * @returns Sorted array of roadmap features for the module
 *
 * @example
 * ```ts
 * const shortcuts = deriveShortcuts(navGroups);
 * const activeIds = new Set(shortcuts.map(s => s.featureId));
 * const planned = getPlannedFeatures('finance', activeIds);
 * // planned will not include any features with featureId in activeIds
 * ```
 */
export function getPlannedFeatures(
  moduleId: ModuleId,
  activeFeatureIds: Set<string>
): RoadmapFeature[] {
  return ROADMAP_REGISTRY.filter(
    (f) => f.moduleId === moduleId && !activeFeatureIds.has(f.featureId)
  ).toSorted((a, b) => (a.order ?? 999) - (b.order ?? 999));
}
