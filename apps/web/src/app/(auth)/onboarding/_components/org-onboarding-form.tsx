'use client';

import Image from 'next/image';
import { useState, useTransition, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Building2, Plus, ArrowRight } from 'lucide-react';

/**
 * Organization onboarding — create first org or select existing.
 *
 * After sign-up, users land here to:
 * 1. Create their first organization (tenant), or
 * 2. Select from existing orgs they've been invited to
 * 3. Accept pending invitations
 *
 * This sets the `activeOrganizationId` on the session, which enables
 * the RLS tenant context for all subsequent API calls.
 */
export function OrgOnboardingForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const { data: orgs, isPending: orgsLoading } = authClient.useListOrganizations();

  // If user has no orgs, show create mode by default
  useEffect(() => {
    if (!orgsLoading && (!orgs || orgs.length === 0)) {
      setMode('create');
    }
  }, [orgs, orgsLoading]);

  function handleCreateOrg(formData: FormData) {
    const name = formData.get('orgName') as string;
    const slug = formData.get('orgSlug') as string;

    if (!name || !slug) {
      setError('Organization name and slug are required.');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError('Slug must be lowercase letters, numbers, and hyphens only.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const { error: createError } = await authClient.organization.create({
        name,
        slug,
      });

      if (createError) {
        setError(createError.message ?? 'Failed to create organization.');
      } else {
        // Organization is created and set as active automatically
        window.location.href = '/';
      }
    });
  }

  function handleSelectOrg(orgId: string) {
    setError(null);
    startTransition(async () => {
      const { error: setActiveError } = await authClient.organization.setActive({
        organizationId: orgId,
      });

      if (setActiveError) {
        setError(setActiveError.message ?? 'Failed to activate organization.');
      } else {
        window.location.href = '/';
      }
    });
  }

  function handleSlugGeneration(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    const slugInput = document.getElementById('orgSlug') as HTMLInputElement;
    if (slugInput && !slugInput.dataset.userEdited) {
      slugInput.value = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  }

  if (orgsLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading organizations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <CardTitle className="text-2xl">
          {mode === 'create' ? 'Create Organization' : 'Select Organization'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Set up your organization to get started with Afenda.'
            : 'Choose which organization to work in.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {mode === 'select' && orgs && orgs.length > 0 ? (
          <div className="space-y-3">
            {orgs.map((org) => (
              <button
                key={org.id}
                type="button"
                disabled={isPending}
                onClick={() => handleSelectOrg(org.id)}
                className="flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {org.logo ? (
                    org.logo.startsWith('data:') ? (
                      <img
                        src={org.logo}
                        alt={org.name}
                        className="h-8 w-8 rounded-md object-cover"
                      />
                    ) : (
                      <Image
                        src={org.logo}
                        alt={org.name}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-md object-cover"
                      />
                    )
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-bold">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground">{org.slug}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setMode('create')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Organization
              </Button>
            </div>
          </div>
        ) : (
          <form action={handleCreateOrg} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                name="orgName"
                type="text"
                placeholder="Acme Corporation"
                required
                autoFocus
                onChange={handleSlugGeneration}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgSlug">Slug</Label>
              <Input
                id="orgSlug"
                name="orgSlug"
                type="text"
                placeholder="acme-corp"
                required
                pattern="[a-z0-9-]+"
                title="Lowercase letters, numbers, and hyphens only"
                onInput={(e) => {
                  (e.target as HTMLInputElement).dataset.userEdited = 'true';
                }}
              />
              <p className="text-xs text-muted-foreground">
                URL-safe identifier. Lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Organization'}
            </Button>

            {orgs && orgs.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode('select')}
              >
                Back to organization list
              </Button>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
