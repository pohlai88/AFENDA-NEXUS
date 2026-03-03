import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Afenda Supplier Portal',
  description: 'Public supplier portal access for Afenda ERP',
};

/**
 * Public route group layout - no authentication required.
 *
 * Used for:
 * - Supplier invitation acceptance
 * - Public landing pages
 * - Magic link flows
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
