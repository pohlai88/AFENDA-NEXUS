/**
 * @module erp
 * Barrel export for all ERP components and their associated types.
 *
 * Usage:
 * ```ts
 * import { AppShell, DataTable, StatusBadge } from '@/components/erp';
 * import type { StatusBadgeProps, DataTableProps } from '@/components/erp';
 * ```
 */

// ─── Shell & Layout ──────────────────────────────────────────────────────────

export { AppShell } from './app-shell';
export type { AppShellProps, AppShellUser } from './app-shell';

export { ModuleRail } from './module-rail';
export type { ModuleRailProps } from './module-rail';

export { DomainPopover } from './domain-popover';
export type { DomainPopoverProps } from './domain-popover';

/** @deprecated Replaced by ModuleRail + DomainPopover split. */
export { AppSidebar } from './app-sidebar';
export type { AppSidebarProps } from './app-sidebar';

/** @deprecated Use ModuleRail instead. */
export { ModuleSidebar } from './module-sidebar';
export type { ModuleSidebarProps, ModuleItemProps } from './module-sidebar';

/** @deprecated Use DomainPopover instead. */
export { DomainSidebar } from './domain-sidebar';
export type { DomainSidebarProps } from './domain-sidebar';

export { ShellHeader } from './shell-header';
export type { ShellHeaderProps, ShellHeaderUser } from './shell-header';

export { CommandPalette } from './command-palette';
export type { CommandPaletteProps } from './command-palette';

export { DomainNav, SidebarNavSkeleton } from './sidebar-nav';
export type { DomainNavProps, ApprovalBadgeCounts } from './sidebar-nav';

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
  EmptyStateKey,
  EmptyStateContent,
} from './empty-state.types';
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
} from './loading-skeleton';
export type { LoadingSkeletonVariant } from './loading-skeleton';

// ─── KPI & Dashboard ─────────────────────────────────────────────────────────

export { KPICard } from './kpi-card';
export type { KPICardProps } from './kpi-card';

export { DashboardPage } from './dashboard-page';
export type { DashboardPageProps } from './dashboard-page';

export { ShortcutGrid } from './shortcut-grid';
export type { ShortcutGridProps } from './shortcut-grid';

// ─── Documents ───────────────────────────────────────────────────────────────

export { BusinessDocument } from './business-document';
export type { BusinessDocumentProps, BusinessDocumentTab } from './business-document';

export { DocumentUpload } from './document-upload';
export type { DocumentUploadProps, UploadedFile } from './document-upload';

export { DocumentViewer, AttachmentsPanel } from './document-viewer';
export type { DocumentFile, DocumentViewerProps, AttachmentsPanelProps } from './document-viewer';

// ─── Reports ─────────────────────────────────────────────────────────────────

export { ReportWrapper, DrilldownRow, useReportFavorites } from './report-wrapper';
export type {
  ReportWrapperProps,
  DrilldownLink,
  ReportBreadcrumb,
  DrilldownRowProps,
} from './report-wrapper';

export { ReportPeriodPicker } from './report-period-picker';
export type {
  ReportPeriodPickerProps,
  DateRangePreset,
  DateRange,
  PeriodOption,
  LedgerOption,
} from './report-period-picker';

export { ExportMenu } from './export-menu';
export type { ExportMenuProps } from './export-menu';

// ─── Context Switchers ───────────────────────────────────────────────────────

export { CompanySwitcher } from './company-switcher';
export type { CompanySwitcherProps } from './company-switcher';

export { TenantSwitcher } from './tenant-switcher';
export type { TenantSwitcherProps } from './tenant-switcher';

export { PeriodIndicator } from './period-indicator';
export type { PeriodIndicatorProps } from './period-indicator';

// ─── User & Theme ────────────────────────────────────────────────────────────

export { UserMenu } from './user-menu';
export type { UserMenuProps, UserMenuUser } from './user-menu';

export { ThemeToggle } from './theme-toggle';

// ─── Forms & Inputs ──────────────────────────────────────────────────────────

export { EntityCombobox } from './entity-combobox';
export type { EntityComboboxProps, EntityOption } from './entity-combobox';

// ─── Feedback & Errors ───────────────────────────────────────────────────────

export { AuditPanel } from './audit-panel';
export type { AuditPanelProps } from './audit-panel';

export { ReceiptPanel } from './receipt-panel';
export type { ReceiptPanelProps } from './receipt-panel';

export { ErrorBoundary, ErrorDisplay, NotFoundDisplay } from './error-boundary';
export type {
  ErrorBoundaryProps,
  ErrorDisplayProps,
  NotFoundDisplayProps,
} from './error-boundary';
