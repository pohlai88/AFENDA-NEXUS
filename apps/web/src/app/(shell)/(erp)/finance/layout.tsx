/**
 * Finance module layout.
 *
 * Shared wrapper for every route under /finance/*.
 * The shell layout (sidebar, nav, tenant) is already provided by (shell)/layout.tsx.
 *
 * Use this layout to:
 * - Add finance-specific providers (e.g. FiscalPeriodProvider)
 * - Inject a module-level breadcrumb or sub-nav
 * - Apply finance-wide error/loading boundaries (already colocated as siblings)
 */
export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
