/**
 * Intercompany sub-domain layout.
 *
 * Wraps all routes under /finance/intercompany/*.
 * Use this to add intercompany-specific providers, breadcrumbs, or sub-navigation.
 */
export default function IntercompanyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
