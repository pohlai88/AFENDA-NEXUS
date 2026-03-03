import type * as React from 'react';
import type { GeneratedEmptyStateKey } from './empty-state.generated-keys';

// ─── Semantic Variants ───────────────────────────────────────────────────────

/** Represents meaning, not styling. Styling is derived from the variant. */
export type EmptyStateVariant = 'firstRun' | 'noResults' | 'error' | 'forbidden';

/**
 * @deprecated Use `EmptyStateConstraint` instead.
 * sm = inline/table cells, md = card/panel (default), lg = full-page
 */
export type EmptyStateSize = 'sm' | 'md' | 'lg';

// ─── Layout Constraint Tiers ─────────────────────────────────────────────────

/**
 * Layout constraint tier — defines allowed slots, spacing, typography,
 * icon sizing, border policy, and animation policy.
 *
 * | Tier    | Containers                                   | Slots                            |
 * | ------- | -------------------------------------------- | -------------------------------- |
 * | `1x1`   | KPI cards (compact, min-h-[100px])           | icon + title                     |
 * | `1x2`   | Popovers (w-80/w-96), shell widgets, dialogs | icon + title + desc              |
 * | `2x1`   | Dashboard blocks (activity, quick-actions)   | icon + title + desc + opt. CTA   |
 * | `2x2`   | Charts/diagrams (bento min-h-[292px])        | icon + title + desc + CTA        |
 * | `table` | DataTable empty cell (h-48, 192px)           | icon + title + desc + CTA        |
 * | `page`  | Report placeholders, full-page states        | icon + title + desc + CTA        |
 */
export type EmptyStateConstraint = '1x1' | '1x2' | '2x1' | '2x2' | 'table' | 'page';

// ─── Content Contract ────────────────────────────────────────────────────────

export interface EmptyStateContent {
  title: string;
  description?: string;
  ctaLabel?: string;
}

// ─── Registry Key (curated + generated) ──────────────────────────────────────

/** Hand-curated keys — generator never touches this union. */
export type CuratedEmptyStateKey =
  // Finance — GL
  | 'finance.journals'
  | 'finance.accounts'
  | 'finance.ledgers'
  | 'finance.periods'
  | 'finance.recurring'
  // Finance — Sub-ledgers
  | 'finance.payables'
  | 'finance.payables.suppliers'
  | 'finance.payables.paymentRuns'
  | 'finance.payables.whtCerts'
  | 'finance.payables.holds'
  | 'finance.payables.matchTolerances'
  | 'finance.receivables'
  // Finance — FX & IC
  | 'finance.fxRates'
  | 'finance.intercompany'
  // Finance — Reports
  | 'finance.reports.trialBalance'
  | 'finance.reports.balanceSheet'
  | 'finance.reports.incomeStatement'
  | 'finance.reports.cashFlow'
  | 'finance.reports.budgetVariance'
  | 'finance.reports.icAging'
  | 'finance.reports.apAging'
  | 'finance.reports.arAging'
  | 'finance.reports.assetRegister'
  | 'finance.reports.consolidation'
  | 'finance.reports.costAllocation'
  | 'finance.reports.equityStatement'
  | 'finance.reports.taxSummary'
  // Finance — Extended domains
  | 'finance.tax.codes'
  | 'finance.tax.returns'
  | 'finance.tax.whtCerts'
  | 'finance.fixedAssets'
  | 'finance.leases'
  | 'finance.intangibles'
  | 'finance.expenses.claims'
  | 'finance.projects'
  | 'finance.treasury.covenants'
  | 'finance.treasury.icLoans'
  | 'finance.credit.holds'
  | 'finance.credit.customers'
  | 'finance.costAccounting.drivers'
  | 'finance.costAccounting.allocations'
  | 'finance.approvals'
  | 'finance.banking.statements'
  | 'finance.budgetEntries'
  // Portal
  | 'portal.invoices'
  | 'portal.payments'
  | 'portal.documents'
  | 'portal.disputes'
  | 'portal.whtCerts'
  | 'portal.bankAccounts'
  // Admin & Settings
  | 'admin.users'
  | 'admin.audit'
  | 'admin.members'
  | 'settings.auditLog'
  // Shell
  | 'shell.attention'
  | 'shell.moduleNav'
  | 'shell.shortcuts'
  | 'shell.notifications'
  // Dashboard
  | 'finance.dashboard.activity'
  | 'finance.dashboard.attention'
  | 'finance.dashboard.quickActions'
  // Dashboard — Charts
  | 'finance.dashboard.cashFlow'
  | 'finance.dashboard.revenueExpense'
  | 'finance.dashboard.arAging'
  | 'finance.dashboard.apAging'
  | 'finance.dashboard.budgetVariance'
  | 'finance.dashboard.dsoTrend'
  | 'finance.dashboard.assetTreemap'
  | 'finance.dashboard.cashFlowSankey'
  | 'finance.dashboard.financialRatios'
  | 'finance.dashboard.liquidityWaterfall'
  | 'finance.dashboard.taxLiability'
  | 'finance.dashboard.workingCapital'
  // Charts — generic fallbacks
  | 'charts.generic.empty'
  | 'charts.generic.error'
  // KPI Cards — Finance Overview
  | 'kpi.cashPosition'
  | 'kpi.accountsPayable'
  | 'kpi.accountsReceivable'
  | 'kpi.netIncome'
  // KPI Cards — AP
  | 'kpi.apAging'
  | 'kpi.apOverdue'
  | 'kpi.apPending'
  | 'kpi.apDiscount'
  // KPI Cards — AR
  | 'kpi.totalReceivables'
  | 'kpi.arAging'
  | 'kpi.arOverdue'
  | 'kpi.dso'
  // KPI Cards — GL
  | 'kpi.journalsMtd'
  | 'kpi.unpostedJournals'
  | 'kpi.trialBalance'
  // KPI Cards — Banking
  | 'kpi.unreconciledItems'
  // KPI Cards — Assets
  | 'kpi.totalFixedAssets'
  | 'kpi.depreciationMtd'
  | 'kpi.pendingDisposals'
  // KPI Cards — Travel/Expenses
  | 'kpi.openClaims'
  | 'kpi.expensesPending'
  | 'kpi.expensesMtd'
  // KPI Cards — Treasury
  | 'kpi.cashForecast'
  | 'kpi.activeLoans'
  | 'kpi.covenantBreaches'
  // KPI Cards — Controlling
  | 'kpi.activeCostCenters'
  | 'kpi.activeProjects'
  | 'kpi.pendingAllocations'
  | 'kpi.budgetVariance';

/** Composed union: curated keys + generator-managed keys. */
export type EmptyStateKey = CuratedEmptyStateKey | GeneratedEmptyStateKey;

// ─── Constraint Slot Contract ────────────────────────────────────────────────

/**
 * Defines which content slots are rendered for each constraint tier.
 * Consumers may pass all props freely — hidden slots are silently omitted.
 */
export const CONSTRAINT_SLOTS: Record<
  EmptyStateConstraint,
  { icon: boolean; title: boolean; description: boolean; action: boolean }
> = {
  '1x1': { icon: true, title: true, description: false, action: false },
  '1x2': { icon: true, title: true, description: true, action: false },
  '2x1': { icon: true, title: true, description: true, action: true },
  '2x2': { icon: true, title: true, description: true, action: true },
  table: { icon: true, title: true, description: true, action: true },
  page: { icon: true, title: true, description: true, action: true },
};

// ─── Component Props ─────────────────────────────────────────────────────────

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Semantic variant — drives default icon, color accent, and tone. */
  variant?: EmptyStateVariant;
  /**
   * Layout constraint tier — fully defines spacing, typography, icon sizing,
   * border policy, animation policy, and which slots are rendered.
   * Replaces `size`. Defaults to `'2x2'`.
   */
  constraint?: EmptyStateConstraint;
  /**
   * @deprecated Use `constraint` instead. Maps: sm → 1x1, md → 2x2, lg → page.
   * When both `constraint` and `size` are provided, `constraint` wins.
   */
  size?: EmptyStateSize;
  /** Registry key — resolves title/description/ctaLabel from the registry. */
  contentKey?: EmptyStateKey;
  /** Direct title override (takes precedence over registry). */
  title?: string;
  /** Direct description override. */
  description?: string;
  /** Override the variant's default icon. */
  icon?: React.ElementType;
  /** Action slot rendered below the description (e.g. a CTA button). */
  action?: React.ReactNode;
  /** Disable entrance animation (useful in tests). Defaults to true. */
  animate?: boolean;
}
