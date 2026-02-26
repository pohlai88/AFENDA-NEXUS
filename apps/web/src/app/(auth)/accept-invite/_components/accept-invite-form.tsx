'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Loader2, Users } from 'lucide-react';
import Link from 'next/link';

/**
 * Accept an organization invitation.
 *
 * Reads `?id=<invitationId>` from the URL (set by the invitation email).
 * Calls the Neon Auth API to accept the invitation.
 */
export function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const invitationId = searchParams.get('id');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [accepted, setAccepted] = useState(false);

  // Auto-accept if invitationId is present
  useEffect(() => {
    if (!invitationId) return;

    startTransition(async () => {
      try {
        const res = await authClient.organization.acceptInvitation({
          invitationId,
        });

        if (res.error) {
          setError(res.error.message ?? 'Failed to accept invitation.');
        } else {
          setAccepted(true);
        }
      } catch {
        setError('Failed to accept invitation.');
      }
    });
  }, [invitationId]);

  // No invitation ID in URL
  if (!invitationId) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
          <CardDescription>
            This invitation link is invalid or incomplete. Please check the link from your email and
            try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/login">Go to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Accepting invitation...
  if (isPending) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Accepting invitation...</p>
        </CardContent>
      </Card>
    );
  }

  // Error accepting
  if (error) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Invitation Failed</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-center text-xs text-muted-foreground">
            The invitation may have expired or already been used. Contact your team admin for a new
            invitation.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Go to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Success — accepted invitation
  if (accepted) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Invitation Accepted</CardTitle>
          <CardDescription>
            You&apos;ve successfully joined the organization. Click below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            className="w-full"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            <Users className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
