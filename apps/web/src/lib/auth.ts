import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ─── Server-Side Auth Helpers ───────────────────────────────────────────────

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value;
}

export async function getTenantId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("tenant_id")?.value;
}

export async function getUserId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("user_id")?.value;
}

export async function requireAuth(): Promise<{
  token: string;
  tenantId: string;
  userId: string;
}> {
  const [token, tenantId, userId] = await Promise.all([
    getSessionToken(),
    getTenantId(),
    getUserId(),
  ]);

  if (!token || !tenantId || !userId) {
    redirect("/login");
  }

  return { token, tenantId, userId };
}

// ─── Request Context Builder ────────────────────────────────────────────────

export async function getRequestContext() {
  const { token, tenantId, userId } = await requireAuth();
  return { tenantId, userId, token };
}
