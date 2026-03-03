'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AcceptInvitationResponse {
  supplierId: string;
  supplierName: string;
  email: string;
  onboardingRedirectUrl: string;
}

type PageState = 'loading' | 'success' | 'error' | 'invalid';

/**
 * Public supplier invitation acceptance page.
 *
 * Flow:
 * 1. Read token from URL query parameter
 * 2. POST /public/accept-invitation with token
 * 3. On success: Create supplier account + redirect to registration
 * 4. On error: Show error message (expired/invalid/already used)
 *
 * Phase 1.1.7 CAP-INV: Supplier Invitation Flow
 *
 * @e2e-exempt: invitation token flow requires a real email; covered by API smoke tests
 */
export default function AcceptSupplierInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [state, setState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AcceptInvitationResponse | null>(null);

  useEffect(() => {
    // Validate token presence
    if (!token || token.length !== 64) {
      setState('invalid');
      setError('Invalid invitation link. Please check the link from your email and try again.');
      return;
    }

    // Accept invitation
    acceptInvitation(token);
  }, [token]);

  async function acceptInvitation(token: string) {
    setState('loading');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/public/accept-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        setState('error');
        setError(body.message || 'Failed to accept invitation.');
        return;
      }

      const data: AcceptInvitationResponse = await res.json();
      setState('success');
      setResponse(data);

      // Auto-redirect to registration after 3 seconds
      setTimeout(() => {
        router.push(`/register?email=${encodeURIComponent(data.email)}`);
      }, 3000);
    } catch (err) {
      setState('error');
      setError('Network error. Please check your connection and try again.');
    }
  }

  // Invalid link (no token or wrong format)
  if (state === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
            <CardDescription>This invitation link is not valid.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="text-center text-sm text-muted-foreground">
              Please check the link from your email or contact support for assistance.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state (processing invitation)
  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Accepting Invitation...</CardTitle>
            <CardDescription>Please wait while we process your invitation.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 py-8">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-center text-sm text-muted-foreground">
              Creating your supplier account...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state (expired/invalid/already accepted)
  if (state === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">Invitation Error</CardTitle>
            <CardDescription>We couldn&#39;t process your invitation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="space-y-2 text-center text-sm text-muted-foreground">
              <p>Common reasons:</p>
              <ul className="list-inside list-disc space-y-1 text-left">
                <li>The invitation link has expired (7-day limit)</li>
                <li>The invitation has already been accepted</li>
                <li>The invitation was cancelled by the sender</li>
              </ul>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Please contact the organization that invited you for a new invitation.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state (account created, redirect to registration)
  if (state === 'success' && response) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">
              Welcome{response.supplierName ? `, ${response.supplierName}!` : '!'}
            </CardTitle>
            <CardDescription>Your supplier account has been created successfully.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 dark:text-green-200">
                Your invitation has been accepted and your supplier profile has been created.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="mb-2 font-semibold text-sm">Next Step: Create Your Login</h3>
                <p className="text-sm text-muted-foreground">
                  To complete your setup and access the supplier portal, you&#39;ll need to create
                  your login credentials.
                </p>
              </div>

              <Button asChild className="w-full" size="lg">
                <Link href={`/register?email=${encodeURIComponent(response.email)}`}>
                  Continue to Registration
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Redirecting automatically in 3 seconds...
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="mb-2 font-semibold text-sm">What Happens Next?</h4>
              <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                <li>Create your login credentials</li>
                <li>Complete the onboarding wizard</li>
                <li>Submit your supplier information for approval</li>
                <li>Start doing business once approved</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
