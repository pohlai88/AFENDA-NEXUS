'use server';

import { redirect } from 'next/navigation';
import { auth } from './auth';

// ─── Server Actions ─────────────────────────────────────────────────────────

/**
 * Sign out the current user. Clears the session and redirects to /login.
 */
export async function logoutAction(): Promise<void> {
  try {
    await auth.signOut();
  } catch {
    // Proceed with redirect even if server signout fails
  }
  redirect('/login');
}
