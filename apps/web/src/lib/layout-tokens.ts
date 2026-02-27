/**
 * Layout design tokens — use these class names instead of hardcoded values.
 * All values are defined in globals.css :root for consistency and theming.
 *
 * Usage:
 *   <main className={cn(pageMinH, "flex flex-col items-center justify-center px-4")}>
 *   <TableHead className={colAccount}>Account Code</TableHead>
 *   <span className={cn(truncateLayoutMd, "truncate")}>{name}</span>
 */

export const layoutTokens = {
  /** Full-page error/not-found/empty states (e.g. min-h-[60vh]) */
  pageMinH: 'page-min-h',
  /** Auth flows: loading/verifying states */
  authMinH: 'auth-min-h',
  /** Auth forms max width */
  authMaxW: 'auth-max-w',
  /** Truncate text — small (e.g. entity names in tight columns) */
  truncateLayoutSm: 'truncate-layout-sm truncate',
  /** Truncate text — medium (e.g. descriptions, subjects) */
  truncateLayoutMd: 'truncate-layout-md truncate',
  /** Table column: account code */
  colAccount: 'col-account',
  /** Table column: amount/debit/credit */
  colAmount: 'col-amount',
  /** Table column: actions */
  colActions: 'col-actions',
  /** Table column: config key / label */
  colKey: 'col-key',
  /** Table column: date / updated */
  colDate: 'col-date',
  /** Select trigger width — small */
  selectWidthSm: 'select-width-sm',
  /** Select trigger width — medium */
  selectWidthMd: 'select-width-md',
  /** Select trigger width — large (date picker, etc.) */
  selectWidthLg: 'select-width-lg',
  /** ScrollArea fixed height */
  scrollAreaH: 'scroll-area-h',
  /** Skeleton row height */
  skeletonRow: 'skeleton-row',
  /** Skeleton table/block height */
  skeletonTable: 'skeleton-table',
  /** Skeleton chart/report height */
  skeletonChart: 'skeleton-chart',
} as const;
