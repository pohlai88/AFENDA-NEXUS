import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AcceptInviteForm } from './_components/accept-invite-form';

export const metadata: Metadata = {
  title: 'Accept Invitation — Afenda',
};

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          Loading invitation...
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
