import type * as React from 'react';

// ─── Semantic Variants ───────────────────────────────────────────────────────

/** Represents meaning, not styling. Styling is derived from the variant. */
export type EmptyStateVariant = 'firstRun' | 'noResults' | 'error' | 'forbidden';

/** sm = inline/table cells, md = card/panel (default), lg = full-page */
export type EmptyStateSize = 'sm' | 'md' | 'lg';

// ─── Content Contract ────────────────────────────────────────────────────────

export interface EmptyStateContent {
  title: string;
  description?: string;
  ctaLabel?: string;
}

// ─── Registry Key (curated string union) ─────────────────────────────────────

export type EmptyStateKey =
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
  | 'settings.auditLog';

// ─── Component Props ─────────────────────────────────────────────────────────

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Semantic variant — drives default icon, color accent, and tone. */
  variant?: EmptyStateVariant;
  /** Size — sm (inline/table), md (card/panel), lg (full-page). */
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
