'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3 } from 'lucide-react';

interface LedgerOption {
  id: string;
  name: string;
}

interface PeriodOption {
  id: string;
  name: string;
}

export type ReportFilterVariant =
  | 'ledger-period'
  | 'ledger-period-range'
  | 'currency-date';

interface ReportFilterBarProps {
  variant: ReportFilterVariant;
  ledgers?: LedgerOption[];
  periods?: PeriodOption[];
  currencies?: string[];
  defaults?: {
    ledgerId?: string;
    periodId?: string;
    fromPeriodId?: string;
    toPeriodId?: string;
    currency?: string;
    asOfDate?: string;
  };
}

export function ReportFilterBar({
  variant,
  ledgers = [],
  periods = [],
  currencies = [],
  defaults,
}: ReportFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [ledgerId, setLedgerId] = useState(defaults?.ledgerId ?? searchParams.get('ledgerId') ?? '');
  const [periodId, setPeriodId] = useState(defaults?.periodId ?? searchParams.get('periodId') ?? '');
  const [fromPeriodId, setFromPeriodId] = useState(defaults?.fromPeriodId ?? searchParams.get('fromPeriodId') ?? '');
  const [toPeriodId, setToPeriodId] = useState(defaults?.toPeriodId ?? searchParams.get('toPeriodId') ?? '');
  const [currency, setCurrency] = useState(defaults?.currency ?? searchParams.get('currency') ?? '');
  const [asOfDate, setAsOfDate] = useState(defaults?.asOfDate ?? searchParams.get('asOfDate') ?? '');

  function handleGenerate() {
    const params = new URLSearchParams();

    if (variant === 'ledger-period') {
      if (ledgerId) params.set('ledgerId', ledgerId);
      if (periodId) params.set('periodId', periodId);
    } else if (variant === 'ledger-period-range') {
      if (ledgerId) params.set('ledgerId', ledgerId);
      if (fromPeriodId) params.set('fromPeriodId', fromPeriodId);
      if (toPeriodId) params.set('toPeriodId', toPeriodId);
    } else if (variant === 'currency-date') {
      if (currency) params.set('currency', currency);
      if (asOfDate) params.set('asOfDate', asOfDate);
    }

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/30 p-4">
      {(variant === 'ledger-period' || variant === 'ledger-period-range') && (
        <div className="space-y-1.5">
          <Label className="text-xs">Ledger</Label>
          <Select value={ledgerId} onValueChange={setLedgerId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select ledger" />
            </SelectTrigger>
            <SelectContent>
              {ledgers.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {variant === 'ledger-period' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Period</Label>
          <Select value={periodId} onValueChange={setPeriodId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {variant === 'ledger-period-range' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">From Period</Label>
            <Select value={fromPeriodId} onValueChange={setFromPeriodId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="From period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To Period</Label>
            <Select value={toPeriodId} onValueChange={setToPeriodId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="To period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {variant === 'currency-date' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="asOfDate" className="text-xs">
              As of Date
            </Label>
            <Input
              id="asOfDate"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-[160px]"
            />
          </div>
        </>
      )}

      <Button onClick={handleGenerate} disabled={isPending} size="sm">
        <BarChart3 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        {isPending ? 'Loading...' : 'Generate'}
      </Button>
    </div>
  );
}
