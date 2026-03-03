/**
 * @module erp
 * Barrel export for ERP business components and their associated types.
 *
 * Shell components have been migrated to `@/components/afenda/`.
 * Import the shell from `@/components/afenda` instead.
 *
 * Usage:
 * ```ts
 * import { DataTable, StatusBadge } from '@/components/erp';
 * import type { StatusBadgeProps, DataTableProps } from '@/components/erp';
 * ```
 */

// ─── Layout ──────────────────────────────────────────────────────────────────

export { PageHeader, PageHeaderHeading, PageHeaderDescription } from './page-header';
export type { PageHeaderProps, Breadcrumb } from './page-header';

// ─── Data Display ────────────────────────────────────────────────────────────

export { DataTable } from './data-table';
export type {
  DataTableProps,
  EmptyStateConfig,
  DataTablePaginationProps,
  LegacyPaginationProps,
} from './data-table';

export { StatusBadge } from './status-badge';
export type { StatusBadgeProps } from './status-badge';

export { DateCell } from './date-cell';
export type { DateCellProps, DateFormat } from './date-cell';

export { MoneyCell } from './money-cell';
export type { MoneyCellProps } from './money-cell';

export { DueDateCell } from './due-date-cell';
export type { DueDateCellProps } from './due-date-cell';

export { EmptyState } from './empty-state';
export type { EmptyStateProps } from './empty-state';
export type {
  EmptyStateVariant,
  EmptyStateSize,
  EmptyStateConstraint,
  EmptyStateKey,
  EmptyStateContent,
  CuratedEmptyStateKey,
} from './empty-state.types';
export { CONSTRAINT_SLOTS } from './empty-state.types';
export type { GeneratedEmptyStateKey } from './empty-state.generated-keys';
export { getEmptyStateContent } from './empty-state.registry';

export { Pagination } from './pagination';
export type { PaginationProps } from './pagination';

export {
  LoadingSkeleton,
  TableSkeleton,
  DetailSkeleton,
  FormSkeleton,
  ReportSkeleton,
  StatementSkeleton,
  DashboardSkeleton,
  CardsSkeleton,
  KpiDeckSkeleton,
  ChartsSkeleton,
} from './loading-skeleton';
export type { LoadingSkeletonVariant } from './loading-skeleton';

// ─── KPI & Dashboard ─────────────────────────────────────────────────────────

export { DashboardPage } from './dashboard-page';
export type { DashboardPageProps } from './dashboard-page';

export { DashboardWidgets } from './dashboard-widgets';

export { NeedsAttention } from './needs-attention';

// ─── Documents ───────────────────────────────────────────────────────────────

export { BusinessDocument } from './business-document';
export type { BusinessDocumentProps, BusinessDocumentTab } from './business-document';

export { DocumentUpload } from './document-upload';
export type { DocumentUploadProps, UploadedFile } from './document-upload';

// ─── Reports ─────────────────────────────────────────────────────────────────

export { ExportMenu } from './export-menu';
export type { ExportMenuProps } from './export-menu';

// ─── Document Drill-Down ─────────────────────────────────────────────────────

export { DrilldownRow, DrilldownLink, DrilldownBreadcrumb, DocumentTypeIcon } from './drilldown';

// ─── Posting Preview ─────────────────────────────────────────────────────────

export { PostingPreview } from './posting-preview';
export type { PostingPreviewData, PostingLinePreview } from './posting-preview';

// ─── Context Switcher ────────────────────────────────────────────────────────

export { ContextSwitcher } from './context-switcher';
export type { ContextSwitcherProps } from './context-switcher';

export { PeriodIndicator } from './period-indicator';
export type { PeriodIndicatorProps } from './period-indicator';

// ─── User & Theme ────────────────────────────────────────────────────────────

export { UserMenu } from './user-menu';
export type { UserMenuProps, UserMenuUser } from './user-menu';

export { ThemeToggle } from './theme-toggle';

// ─── Forms & Inputs ──────────────────────────────────────────────────────────

export { EntityCombobox } from './entity-combobox';
export type { EntityComboboxProps, EntityOption } from './entity-combobox';

export { ListFilterBar } from './list-filter-bar';
export type { ListFilterBarProps, StatusOption } from './list-filter-bar';

// ─── Feedback & Errors ───────────────────────────────────────────────────────

export { AuditPanel } from './audit-panel';
export type { AuditPanelProps } from './audit-panel';

export { ReceiptPanel } from './receipt-panel';
export type { ReceiptPanelProps } from './receipt-panel';

export { ErrorBoundary, ErrorDisplay, NotFoundDisplay } from './error-boundary';
export type { ErrorBoundaryProps, ErrorDisplayProps, NotFoundDisplayProps } from './error-boundary';
