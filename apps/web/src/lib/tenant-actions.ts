'use server';

// @gate-allow-unauth — sets UI preference cookie only, no data mutation
import { cookies } from 'next/headers';

export async function setActiveCompanyAction(companyId: string): Promise<void> {
  if (!companyId) return;

  const cookieStore = await cookies();
  cookieStore.set('active_company_id', companyId, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  });
}
