import { AppShell } from '@/components/erp/app-shell';
import { logoutAction } from '@/lib/auth-actions';
import { requireAuth, getRequestContext } from '@/lib/auth';
import { buildInitialTenantContext } from '@/lib/tenant-context.server';
import { setActiveCompanyAction } from '@/lib/tenant-actions';

export const dynamic = 'force-dynamic';

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const requestContext = await getRequestContext(session);

  const initialTenant = await buildInitialTenantContext(requestContext);

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : undefined;

  return (
    <AppShell
      initialTenant={initialTenant}
      user={user}
      logoutAction={logoutAction}
      onSwitchCompany={setActiveCompanyAction}
    >
      {children}
    </AppShell>
  );
}
