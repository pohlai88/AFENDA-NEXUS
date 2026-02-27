import { PortalShell } from '@/components/portal/portal-shell';
import { PortalSupplierProvider } from '@/features/portal/portal-supplier-context';
import { getPortalSupplier } from '@/features/portal/queries/portal.queries';
import { logoutAction } from '@/lib/auth-actions';
import { requireAuth, getRequestContext } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const ctx = await getRequestContext();

  const user = session?.user
    ? {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    }
    : undefined;

  const supplierResult = await getPortalSupplier(ctx);

  // If supplier data fails, still render the shell but without context.
  // Individual pages can handle the missing context gracefully.
  if (!supplierResult.ok) {
    return (
      <PortalShell user={user} logoutAction={logoutAction}>
        {children}
      </PortalShell>
    );
  }

  return (
    <PortalShell user={user} logoutAction={logoutAction}>
      <PortalSupplierProvider supplier={supplierResult.value}>
        {children}
      </PortalSupplierProvider>
    </PortalShell>
  );
}
