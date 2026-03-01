/**
 * General Ledger sub-domain layout.
 *
 * Wraps all routes under /finance/general-ledger/*.
 * Use this to add GL-specific providers, breadcrumbs, or sub-navigation.
 */
export default function GeneralLedgerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
