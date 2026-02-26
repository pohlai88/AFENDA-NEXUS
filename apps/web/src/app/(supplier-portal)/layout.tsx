import { PortalShell } from '@/components/portal/portal-shell';
import { logoutAction } from '@/lib/auth-actions';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : undefined;

  return (
    <PortalShell user={user} logoutAction={logoutAction}>
      {children}
    </PortalShell>
  );
}
