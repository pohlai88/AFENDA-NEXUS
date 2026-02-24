import { cookies } from "next/headers";
import { AppShell } from "@/components/erp/app-shell";
import { logoutAction } from "@/lib/auth-actions";
import type { TenantContext } from "@/lib/types";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const tenantCookie = cookieStore.get("tenant_context")?.value;

  let initialTenant: TenantContext | undefined;
  if (tenantCookie) {
    try {
      initialTenant = JSON.parse(tenantCookie) as TenantContext;
    } catch {
      // Invalid cookie — will show empty state
    }
  }

  return (
    <AppShell initialTenant={initialTenant} logoutAction={logoutAction}>
      {children}
    </AppShell>
  );
}
