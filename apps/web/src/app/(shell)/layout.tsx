import { cookies } from 'next/headers';
import { AppShell } from '@/components/erp/app-shell';
import { logoutAction } from '@/lib/auth-actions';
import { requireAuth, getRequestContext } from '@/lib/auth';
import { buildInitialTenantContext } from '@/lib/tenant-context.server';
import { setActiveCompanyAction } from '@/lib/tenant-actions';
import { isAdmin } from '@/lib/modules/is-admin.server';
import { computeVisibleModulesWithNav } from '@/lib/modules/module-definitions.server';
import { parseShellCookie, SHELL_COOKIE_NAME } from '@/lib/shell/shell-persistence';
import { resolveAttentionSummary } from '@/lib/attention/attention-registry.server';

export const dynamic = 'force-dynamic';

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const requestContext = await getRequestContext(session);

  const [initialTenant, cookieStore, attentionSummary] = await Promise.all([
    buildInitialTenantContext(requestContext),
    cookies(),
    resolveAttentionSummary(requestContext),
  ]);

  // Read shell preferences from cookie for SSR-correct initial render
  const shellCookie = cookieStore.get(SHELL_COOKIE_NAME)?.value;
  const defaultPrefs = parseShellCookie(shellCookie);

  const user = session?.user
    ? {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    }
    : undefined;

  const canSeeAdmin = isAdmin(session);
  const modules = computeVisibleModulesWithNav(canSeeAdmin);

  return (
    <AppShell
      initialTenant={initialTenant}
      user={user}
      logoutAction={logoutAction}
      onSwitchCompany={setActiveCompanyAction}
      modules={modules}
      defaultPrefs={defaultPrefs}
      attentionSummary={attentionSummary}
    >
      {children}
    </AppShell>
  );
}
