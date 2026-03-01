/**
 * Controlling sub-domain layout.
 *
 * Wraps all routes under /finance/controlling/*.
 * Use this to add controlling-specific providers, breadcrumbs, or sub-navigation.
 */
export default function ControllingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
