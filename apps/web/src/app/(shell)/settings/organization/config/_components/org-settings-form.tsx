'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import type { TenantSettings } from '@afenda/contracts';

interface OrgSettingsFormProps {
  settings: TenantSettings;
  onSave: (patch: Partial<TenantSettings>) => Promise<{ ok: boolean; error?: string }>;
}

const DATE_FORMAT_OPTIONS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
] as const;

export function OrgSettingsForm({ settings, onSave }: OrgSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const fd = new FormData(e.currentTarget);

    const patch: Partial<TenantSettings> = {
      defaultCurrency: fd.get('defaultCurrency') as string,
      locale: fd.get('locale') as string,
      timezone: fd.get('timezone') as string,
      dateFormat: fd.get('dateFormat') as TenantSettings['dateFormat'],
      fiscalYearStart: {
        month: Number(fd.get('fiscalMonth')),
        day: Number(fd.get('fiscalDay')),
      },
      numberFormat: {
        decimal: fd.get('decimalSep') as '.' | ',',
        thousands: fd.get('thousandsSep') as ',' | '.' | ' ',
      },
      approvalThresholds: {
        apInvoice: Number(fd.get('thresholdApInvoice')),
        journal: Number(fd.get('thresholdJournal')),
      },
    };

    startTransition(async () => {
      const result = await onSave(patch);
      if (result.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error ?? 'Failed to save settings');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Currency & Locale */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Regional</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="defaultCurrency">Default Currency</Label>
            <Input id="defaultCurrency" name="defaultCurrency" defaultValue={settings.defaultCurrency} maxLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locale">Locale</Label>
            <Input id="locale" name="locale" defaultValue={settings.locale} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" name="timezone" defaultValue={settings.timezone} />
          </div>
        </div>
      </fieldset>

      {/* Date & Number Format */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Formatting</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select name="dateFormat" defaultValue={settings.dateFormat}>
              <SelectTrigger id="dateFormat" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="decimalSep">Decimal Separator</Label>
            <Select name="decimalSep" defaultValue={settings.numberFormat.decimal}>
              <SelectTrigger id="decimalSep" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=".">Period (.)</SelectItem>
                <SelectItem value=",">Comma (,)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="thousandsSep">Thousands Separator</Label>
            <Select name="thousandsSep" defaultValue={settings.numberFormat.thousands}>
              <SelectTrigger id="thousandsSep" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=",">Comma (,)</SelectItem>
                <SelectItem value=".">Period (.)</SelectItem>
                <SelectItem value=" ">Space</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      {/* Fiscal Year */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Fiscal Year Start</legend>
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          <div className="space-y-2">
            <Label htmlFor="fiscalMonth">Month</Label>
            <Input id="fiscalMonth" name="fiscalMonth" type="number" min={1} max={12} defaultValue={settings.fiscalYearStart.month} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fiscalDay">Day</Label>
            <Input id="fiscalDay" name="fiscalDay" type="number" min={1} max={31} defaultValue={settings.fiscalYearStart.day} />
          </div>
        </div>
      </fieldset>

      {/* Approval Thresholds */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Approval Thresholds</legend>
        <p className="text-xs text-muted-foreground">Set to 0 to disable automatic approval routing.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="thresholdApInvoice">AP Invoice</Label>
            <Input id="thresholdApInvoice" name="thresholdApInvoice" type="number" min={0} defaultValue={settings.approvalThresholds.apInvoice} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thresholdJournal">Journal</Label>
            <Input id="thresholdJournal" name="thresholdJournal" type="number" min={0} defaultValue={settings.approvalThresholds.journal} />
          </div>
        </div>
      </fieldset>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {success && <p className="text-sm text-green-600" role="status">Settings saved successfully.</p>}

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Settings
      </Button>
    </form>
  );
}
