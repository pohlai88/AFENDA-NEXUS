'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { UserPreferences } from '@afenda/contracts';
import { savePreferencesAction } from '../actions';

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

const DENSITY_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'compact', label: 'Compact' },
  { value: 'ultra', label: 'Ultra Compact' },
] as const;

export function PreferencesForm({ preferences }: { preferences: UserPreferences }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const fd = new FormData(e.currentTarget);

    const patch: Partial<UserPreferences> = {
      theme: fd.get('theme') as UserPreferences['theme'],
      density: fd.get('density') as UserPreferences['density'],
      sidebarCollapsed: fd.get('sidebarCollapsed') === 'true',
    };

    startTransition(async () => {
      const result = await savePreferencesAction(patch);
      if (result.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error ?? 'Failed to save preferences');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="pref-theme">Theme</Label>
        <Select name="theme" defaultValue={preferences.theme}>
          <SelectTrigger id="pref-theme" className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEME_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pref-density">Display Density</Label>
        <Select name="density" defaultValue={preferences.density}>
          <SelectTrigger id="pref-density" className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DENSITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="pref-sidebar"
          name="sidebarCollapsed"
          value="true"
          defaultChecked={preferences.sidebarCollapsed}
        />
        <Label htmlFor="pref-sidebar">Collapse sidebar by default</Label>
      </div>

      { error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      { success ? <p className="text-sm text-green-600" role="status">Preferences saved.</p> : null}

      <Button type="submit" disabled={isPending}>
        { isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save Preferences
      </Button>
    </form>
  );
}
