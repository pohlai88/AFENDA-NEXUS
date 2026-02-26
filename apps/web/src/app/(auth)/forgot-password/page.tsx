import { Suspense } from 'react';
import { ForgotPasswordForm } from './_components/forgot-password-form';

export const metadata = {
  title: 'Reset Password — Afenda',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
