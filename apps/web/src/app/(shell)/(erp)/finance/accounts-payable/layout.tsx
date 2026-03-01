/**
 * Accounts Payable sub-domain layout.
 *
 * Wraps all routes under /finance/accounts-payable/*.
 * Use this to add AP-specific providers, breadcrumbs, or sub-navigation.
 */
export default function AccountsPayableLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
