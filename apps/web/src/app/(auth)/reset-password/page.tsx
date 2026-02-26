import { Suspense } from 'react';
import { ResetPasswordForm } from './_components/reset-password-form';

export const metadata = {
  title: 'Set New Password — Afenda',
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
