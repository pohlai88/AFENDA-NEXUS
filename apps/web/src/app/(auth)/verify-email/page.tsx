import { Suspense } from 'react';
import { VerifyEmailStatus } from './_components/verify-email-status';

export const metadata = {
  title: 'Verify Email',
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Verifying...</p>}>
        <VerifyEmailStatus />
      </Suspense>
    </div>
  );
}
