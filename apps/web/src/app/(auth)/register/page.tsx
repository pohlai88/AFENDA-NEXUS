import { Suspense } from 'react';
import { RegisterForm } from './_components/register-form';

/**
 * Register page — Server Component wrapper.
 *
 * The client-side `RegisterForm` uses `useSearchParams()` which requires a
 * `<Suspense>` boundary to prevent full-page CSR bailout (Next.js best practice).
 *
 * Registration is handled client-side via `authClient.signUp.email()` so the
 * Better Auth route handler properly sets session cookies in the browser.
 */
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
