'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTenantContext } from '@/providers/tenant-provider';
import { useActiveOrganization } from '@/lib/auth-client';
import { updateOrgProfileAction } from '@/lib/org-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function OrgProfileForm() {
  const { tenant } = useTenantContext();
  const { data: activeOrg } = useActiveOrganization();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const orgName = activeOrg?.name ?? tenant?.tenantName ?? '';
  const orgSlug = activeOrg?.slug ?? '';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;

    startTransition(async () => {
      const result = await updateOrgProfileAction({ name, slug });
      if (result.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error ?? 'Failed to update');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Organization Name</Label>
        <Input
          id="org-name"
          name="name"
          defaultValue={orgName}
          placeholder="My Organization"
          required
          minLength={2}
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-slug">Slug</Label>
        <Input
          id="org-slug"
          name="slug"
          defaultValue={orgSlug}
          placeholder="my-org"
          pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
          title="Lowercase letters, numbers, and hyphens only"
          minLength={2}
          maxLength={63}
        />
        <p className="text-xs text-muted-foreground">
          Used in URLs. Lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600" role="status">Organization updated successfully.</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
