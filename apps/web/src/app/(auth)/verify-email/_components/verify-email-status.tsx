'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, MailOpen, Loader2, RefreshCw } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { routes } from '@/lib/constants';

/**
 * Verify-email landing page.
 *
 * Supports two verification methods configured in the Neon Console:
 *
 * 1. **Verification links** — Neon Auth handles the actual verification at
 *    `/api/auth/verify-email?token=xxx` and redirects here with:
 *    - `?verified=true` on success
 *    - `?error=...` on failure (expired/invalid token)
 *
 * 2. **Verification codes (OTP)** — When `?method=code&email=xxx` is present,
 *    shows an OTP input form. The user enters the numeric code from their email
 *    and submits it via `authClient.emailOtp.verifyEmail()`.
 *
 * If accessed directly (no params), shows a "check your inbox" message.
 */
export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified') === 'true';
  const error = searchParams.get('error');
  const method = searchParams.get('method'); // 'code' for OTP verification
  const emailParam = searchParams.get('email') ?? '';

  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [isVerified, setIsVerified] = useState(verified);
  const [isPending, startTransition] = useTransition();
  const [isResending, setIsResending] = useState(false);

  // ── Handle OTP code submission ──────────────────────────────────────────
  function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    startTransition(async () => {
      try {
        const { data, error: verifyError } = await authClient.emailOtp.verifyEmail({
          email: emailParam,
          otp: code,
        });

        if (verifyError) {
          setMessage(verifyError.message ?? 'Verification failed. Please try again.');
          return;
        }

        // If auto-sign-in returned a session, redirect to app
        if (data && 'session' in data && data.session) {
          window.location.href = '/';
          return;
        }

        // Otherwise show success and prompt sign-in
        setIsVerified(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An error occurred';
        setMessage(msg);
      }
    });
  }

  // ── Resend verification email ───────────────────────────────────────────
  async function handleResend() {
    if (!emailParam) {
      setMessage('No email address available. Please try signing up again.');
      return;
    }

    setIsResending(true);
    setMessage('');

    try {
      const { error: resendError } = await authClient.sendVerificationEmail({
        email: emailParam,
        callbackURL: `${window.location.origin  }/verify-email`,
      });

      if (resendError) {
        setMessage(resendError.message ?? 'Failed to resend. Please try again.');
      } else {
        setMessage('Verification email sent! Check your inbox.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setMessage(msg);
    } finally {
      setIsResending(false);
    }
  }

  // ── Success state — email was verified ──────────────────────────────────
  if (isVerified) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Email Verified</CardTitle>
          <CardDescription>
            Your email has been verified successfully. You can now sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href={routes.login}>Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Error state — token expired or invalid ──────────────────────────────
  if (error) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Verification Failed</CardTitle>
          <CardDescription>
            {error === 'token_expired'
              ? 'This verification link has expired. Please request a new one.'
              : 'This verification link is invalid. Please request a new one.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {emailParam && (
            <Button
              variant="outline"
              className="w-full"
              disabled={isResending}
              onClick={handleResend}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend verification email
                </>
              )}
            </Button>
          )}
          { message ? <p className="text-center text-sm text-muted-foreground">{message}</p> : null}
          <Button asChild variant="ghost" className="w-full">
            <Link href={routes.login}>Back to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── OTP code entry form ─────────────────────────────────────────────────
  if (method === 'code' && emailParam) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MailOpen className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            Enter the verification code sent to{' '}
            <span className="font-medium text-foreground">{emailParam}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-code">Verification code</Label>
              <Input
                id="otp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
                autoComplete="one-time-code"
              />
            </div>

            { message ? <p className="text-center text-sm text-destructive">{message}</p> : null}

            <Button type="submit" className="w-full" disabled={isPending || !code}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </form>

          <div className="space-y-2">
            <p className="text-center text-xs text-muted-foreground">
              Didn&apos;t receive the code? Check your spam folder.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={isResending}
              onClick={handleResend}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend code
                </>
              )}
            </Button>
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link href={routes.login}>Back to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Default — show "check your inbox" message (verification link) ──────
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MailOpen className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Check Your Email</CardTitle>
        <CardDescription>
          {emailParam ? (
            <>
              We&apos;ve sent a verification email to{' '}
              <span className="font-medium text-foreground">{emailParam}</span>. Click the link to
              verify your account.
            </>
          ) : (
            <>
              We&apos;ve sent a verification link to your email address. Click the link to verify
              your account.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the email? Check your spam folder.
        </p>
        {emailParam && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isResending}
              onClick={handleResend}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend verification email
                </>
              )}
            </Button>
            { message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </>
        )}
        <Button asChild variant="ghost" className="w-full">
          <Link href={routes.login}>Back to Sign In</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
