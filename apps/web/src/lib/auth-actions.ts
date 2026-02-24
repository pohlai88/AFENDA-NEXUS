"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ─── Mock Auth Data (replace with real API calls when backend auth is ready) ──

const MOCK_USER = {
  email: "admin@afenda.io",
  password: "admin123",
  userId: "usr_01",
  tenantId: "tnt_01",
  tenantName: "Afenda Demo",
  token: "mock-jwt-token-afenda-demo",
  companies: [
    { id: "cmp_01", name: "Afenda Holdings Sdn Bhd", baseCurrency: "MYR" },
    { id: "cmp_02", name: "Afenda Singapore Pte Ltd", baseCurrency: "SGD" },
  ],
  activePeriod: {
    id: "per_01",
    name: "Jan 2026",
    year: 2026,
    period: 1,
    status: "OPEN" as const,
  },
};

export interface LoginState {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // TODO: Replace with real API call: POST /auth/login
  if (email !== MOCK_USER.email || password !== MOCK_USER.password) {
    return { error: "Invalid email or password." };
  }

  const cookieStore = await cookies();

  cookieStore.set("session_token", MOCK_USER.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set("tenant_id", MOCK_USER.tenantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set("user_id", MOCK_USER.userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const tenantContext = {
    tenantId: MOCK_USER.tenantId,
    tenantName: MOCK_USER.tenantName,
    companies: MOCK_USER.companies,
    activeCompanyId: MOCK_USER.companies[0].id,
    activePeriod: MOCK_USER.activePeriod,
  };

  cookieStore.set("tenant_context", JSON.stringify(tenantContext), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
  cookieStore.delete("tenant_id");
  cookieStore.delete("user_id");
  cookieStore.delete("tenant_context");
  redirect("/login");
}
