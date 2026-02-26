/**
 * Neon Auth — React client for the web app.
 *
 * Provides hooks and methods for client-side authentication:
 * - `useSession()` — reactive session state
 * - `signIn.email()` — email/password sign-in
 * - `signUp.email()` — email/password sign-up
 * - `signOut()` — sign out
 * - `emailOtp.verifyEmail()` — verify email with OTP code
 * - `sendVerificationEmail()` — resend verification (link or code)
 * - `updateUser()` — update profile (name, image)
 * - `changePassword()` — change password (requires current password)
 * - `deleteUser()` — permanently delete the user account
 * - `token()` — retrieve a JWT for cross-service auth
 * - `organization.*` — create, list, invite, manage orgs (multi-tenant)
 * - `useActiveOrganization()` — reactive active org state
 * - `useListOrganizations()` — reactive list of user's orgs
 *
 * Neon Auth is a managed Better Auth service. The client SDK is
 * a thin wrapper around Better Auth's client with Neon-specific defaults.
 */
import { createAuthClient } from '@neondatabase/auth/next';

export const authClient = createAuthClient();

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  emailOtp,
  sendVerificationEmail,
  updateUser,
  changePassword,
  deleteUser,
  token,
  organization,
  useActiveOrganization,
  useListOrganizations,
} = authClient;
