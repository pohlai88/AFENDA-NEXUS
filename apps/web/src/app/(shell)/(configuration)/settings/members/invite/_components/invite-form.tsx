'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { inviteMemberAction } from '@/lib/member-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'clerk', label: 'Clerk' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'member', label: 'Member' },
] as const;

export function InviteForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;

    startTransition(async () => {
      const result = await inviteMemberAction({ email, role });
      if (result.ok) {
        setSuccess(true);
        e.currentTarget?.reset();
        router.refresh();
      } else {
        setError(result.error ?? 'Failed to send invitation');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email Address</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="colleague@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <Select name="role" defaultValue="member" required>
          <SelectTrigger id="invite-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600" role="status">Invitation sent successfully.</p>
      )}

      <Button type="submit" disabled={isPending}>
        { isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Send Invitation
      </Button>
    </form>
  );
}
