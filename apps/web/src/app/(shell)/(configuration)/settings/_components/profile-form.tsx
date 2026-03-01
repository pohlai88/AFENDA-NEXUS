'use client';

import { useState, useTransition } from 'react';
import { authClient, useSession } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle2, Loader2, Mail, User, Calendar } from 'lucide-react';

/**
 * Profile form — view and edit account information.
 *
 * Allows updating the user's display name via `authClient.updateUser()`.
 * Email is read-only; password changes are in a separate form.
 */
export function ProfileForm() {
  const session = useSession();
  const user = session.data?.user;

  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEdit() {
    setName(user?.name ?? '');
    setIsEditing(true);
    setMessage(null);
  }

  function handleCancel() {
    setIsEditing(false);
    setMessage(null);
  }

  function handleSave() {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Name is required.' });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      try {
        const { error } = await authClient.updateUser({ name: name.trim() });

        if (error) {
          setMessage({ type: 'error', text: error.message ?? 'Failed to update profile.' });
          return;
        }

        // Refresh session to get updated user data
        await authClient.getSession();
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully.' });
      } catch (err: unknown) {
        const text = err instanceof Error ? err.message : 'Failed to update profile.';
        setMessage({ type: 'error', text });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Your account information and identity.</CardDescription>
          </div>
          {!isEditing && user && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {session.isPending ? (
          <div className="space-y-3">
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
        ) : user ? (
          <div className="space-y-4">
            {message && (
              <div
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                  message.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                    : 'border-destructive/20 bg-destructive/5 text-destructive'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                {message.text}
              </div>
            )}

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Name</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your display name"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <Input value={user.email} disabled />
                  <p className="text-xs text-muted-foreground">
                    Email address changes are not currently supported.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isPending} size="sm">
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save changes'
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isPending}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <dl className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    Name
                  </dt>
                  <dd className="font-medium">{user.name}</dd>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </dt>
                  <dd className="font-medium">{user.email}</dd>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Member since
                  </dt>
                  <dd className="font-medium">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })
                      : '—'}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Unable to load account information.</p>
        )}
      </CardContent>
    </Card>
  );
}
