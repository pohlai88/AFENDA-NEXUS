'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updateNotificationPrefsAction } from '../actions/portal.actions';
import { Loader2 } from 'lucide-react';
import type { PortalNotificationPref } from '../queries/portal.queries';

interface PortalNotificationFormProps {
  supplierId: string;
  preferences: PortalNotificationPref[];
}

export function PortalNotificationForm({ supplierId, preferences }: PortalNotificationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [prefs, setPrefs] = useState<PortalNotificationPref[]>(preferences);

  function togglePref(index: number) {
    setPrefs((prev) => prev.map((p, i) => (i === index ? { ...p, enabled: !p.enabled } : p)));
  }

  function updateWebhook(index: number, url: string) {
    setPrefs((prev) => prev.map((p, i) => (i === index ? { ...p, webhookUrl: url || null } : p)));
  }

  function handleSubmit() {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateNotificationPrefsAction(supplierId, {
        preferences: prefs,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertDescription>Preferences saved successfully.</AlertDescription>
          </Alert>
        )}

        {prefs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No notification preferences configured.
          </p>
        ) : (
          <div className="space-y-4">
            {prefs.map((pref, index) => (
              <div
                key={`${pref.eventType}-${pref.channel}`}
                className="flex items-center gap-4 rounded-md border p-3"
              >
                <Switch
                  checked={pref.enabled}
                  onCheckedChange={() => togglePref(index)}
                  id={`pref-${index}`}
                />
                <div className="flex-1">
                  <Label htmlFor={`pref-${index}`} className="text-sm font-medium">
                    {pref.eventType}
                  </Label>
                  <p className="text-xs text-muted-foreground">Channel: {pref.channel}</p>
                </div>
                {pref.channel === 'WEBHOOK' && (
                  <div className="w-64">
                    <Input
                      type="url"
                      value={pref.webhookUrl ?? ''}
                      onChange={(e) => updateWebhook(index, e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-xs"
                      aria-label="Webhook URL"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
