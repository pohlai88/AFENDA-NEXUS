'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp, authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!name || !email || !password) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const { data, error: signUpError } = await signUp.email({
          name,
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message ?? 'Registration failed.');
          return;
        }

        // Check if email verification is required
        if (data?.user && !data.user.emailVerified) {
          // Redirect to verify-email page.
          // method=code shows the OTP input; omit for verification link flow.
          const params = new URLSearchParams({ email });
          // Use 'code' method when verification codes are configured in Neon Console,
          // otherwise the default "check your inbox" flow handles verification links.
          params.set('method', 'code');
          router.push(`/verify-email?${params.toString()}`);
          return;
        }

        // If no verification required, check for active session
        const { data: session } = await authClient.getSession();
        if (session) {
          window.location.href = '/onboarding';
        } else {
          // Fallback: redirect to login
          router.push('/login');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Registration failed.';
        setError(message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <div className="mb-4 flex items-center justify-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            A
          </div>
          <span className="text-lg font-semibold">Afenda</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Get started with Afenda — your enterprise resource hub
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
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Jane Smith"
            required
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@company.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
              required
              autoComplete="new-password"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Minimum 8 characters</p>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
