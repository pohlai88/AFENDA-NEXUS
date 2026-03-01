'use client';

import { useState, useTransition } from 'react';
import { deleteOrgAction } from '@/lib/org-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function OrgDangerZone({ orgName }: { orgName: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmation === orgName;

  function handleDelete() {
    if (!canDelete) return;
    setError(null);

    startTransition(async () => {
      const result = await deleteOrgAction();
      if (!result.ok) {
        setError(result.error ?? 'Failed to delete organization');
      }
    });
  }

  return (
    <div className="rounded-lg border border-destructive/50 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Deleting this organization is permanent and cannot be undone. All data, members,
        and settings will be permanently removed.
      </p>

      <div className="space-y-2">
        <Label htmlFor="delete-confirm">
          Type <strong>{orgName}</strong> to confirm
        </Label>
        <Input
          id="delete-confirm"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder={orgName}
          autoComplete="off"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}

      <Button
        variant="destructive"
        disabled={!canDelete || isPending}
        onClick={handleDelete}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Delete Organization
      </Button>
    </div>
  );
}
