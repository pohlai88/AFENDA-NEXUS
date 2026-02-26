import { Suspense } from 'react';
import { LoginForm } from './_components/login-form';

/**
 * Login page — Server Component wrapper.
 *
 * The client-side `LoginForm` uses `useSearchParams()` which requires a
 * `<Suspense>` boundary to prevent full-page CSR bailout (Next.js best practice).
 *
 * Authentication is handled client-side via `authClient.signIn.email()` so the
 * Better Auth route handler properly sets session cookies in the browser.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
