'use client';

import { useState, useTransition } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, MailOpen } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/lib/constants';

/**
 * Forgot password form — sends a password reset email via Neon Auth.
 */
export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleSubmit(formData: FormData) {
    const email = formData.get('email') as string;

    if (!email) {
      setError('Email is required.');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const { error: resetError } = await authClient.requestPasswordReset({
          email,
          redirectTo: '/reset-password',
        });

        if (resetError) {
          setError(resetError.message ?? 'Failed to send reset email.');
        } else {
          setSent(true);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to send reset email.';
        setError(message);
      }
    });
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists with that email, we&apos;ve sent a password reset link.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
          <MailOpen className="h-4 w-4 shrink-0" />
          <span>
            The link expires in 15 minutes. Check your spam folder if you don&apos;t see it.
          </span>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href={routes.login}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter the email address associated with your account and we&apos;ll send a reset link.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@company.com"
            required
            autoComplete="email"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send reset link'
          )}
        </Button>
      </form>

      <Button asChild variant="ghost" className="w-full">
        <Link href={routes.login}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Link>
      </Button>
    </div>
  );
}
