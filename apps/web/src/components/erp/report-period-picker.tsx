'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, formatDate } from '@/lib/utils';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import {
  format,
  subMonths,
  subQuarters,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DateRangePreset =
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'last-quarter'
  | 'ytd'
  | 'last-year'
  | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface PeriodOption {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
}

export interface LedgerOption {
  id: string;
  name: string;
}

interface ReportPeriodPickerProps {
  mode?: 'period' | 'date-range' | 'period-range';
  ledgers?: LedgerOption[];
  periods?: PeriodOption[];
  selectedLedgerId?: string;
  selectedPeriodId?: string;
  selectedFromPeriodId?: string;
  selectedToPeriodId?: string;
  selectedDateRange?: DateRange;
  onLedgerChange?: (ledgerId: string) => void;
  onPeriodChange?: (periodId: string) => void;
  onPeriodRangeChange?: (fromPeriodId: string, toPeriodId: string) => void;
  onDateRangeChange?: (range: DateRange) => void;
  className?: string;
}

// ─── Date Range Presets ──────────────────────────────────────────────────────

function getPresetRange(preset: DateRangePreset): DateRange | null {
  const now = new Date();

  switch (preset) {
    case 'this-month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'last-month': {
      const lastMonth = subMonths(now, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case 'this-quarter':
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case 'last-quarter': {
      const lastQuarter = subQuarters(now, 1);
      return { from: startOfQuarter(lastQuarter), to: endOfQuarter(lastQuarter) };
    }
    case 'ytd':
      return { from: startOfYear(now), to: now };
    case 'last-year': {
      const lastYear = subYears(now, 1);
      return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
    }
    default:
      return null;
  }
}

const presetLabels: Record<DateRangePreset, string> = {
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'this-quarter': 'This Quarter',
  'last-quarter': 'Last Quarter',
  ytd: 'Year to Date',
  'last-year': 'Last Year',
  custom: 'Custom Range',
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function ReportPeriodPicker({
  mode = 'period',
  ledgers = [],
  periods = [],
  selectedLedgerId,
  selectedPeriodId,
  selectedFromPeriodId,
  selectedToPeriodId,
  selectedDateRange,
  onLedgerChange,
  onPeriodChange,
  onPeriodRangeChange,
  onDateRangeChange,
  className,
}: ReportPeriodPickerProps) {
  const [preset, setPreset] = useState<DateRangePreset>('this-month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(selectedDateRange);

  const handlePresetChange = (newPreset: DateRangePreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      const range = getPresetRange(newPreset);
      if (range && onDateRangeChange) {
        onDateRangeChange(range);
      }
    }
  };

  return (
    <div className={cn('flex flex-wrap items-end gap-3', className)}>
      {/* Ledger Selector */}
      {ledgers.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Ledger</Label>
          <Select value={selectedLedgerId ?? ''} onValueChange={onLedgerChange}>
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

      {/* Single Period Mode */}
      {mode === 'period' && periods.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Period</Label>
          <Select value={selectedPeriodId ?? ''} onValueChange={onPeriodChange}>
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

      {/* Period Range Mode */}
      {mode === 'period-range' && periods.length > 0 && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">From Period</Label>
            <Select
              value={selectedFromPeriodId ?? ''}
              onValueChange={(v) => onPeriodRangeChange?.(v, selectedToPeriodId ?? '')}
            >
              <SelectTrigger className="w-[180px]">
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
            <Select
              value={selectedToPeriodId ?? ''}
              onValueChange={(v) => onPeriodRangeChange?.(selectedFromPeriodId ?? '', v)}
            >
              <SelectTrigger className="w-[180px]">
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

      {/* Date Range Mode */}
      {mode === 'date-range' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Period</Label>
            <Select value={preset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(presetLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {preset === 'custom' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-[260px] justify-start text-left font-normal',
                      !customRange && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customRange?.from && customRange?.to
                      ? `${format(customRange.from, 'MMM d, yyyy')} - ${format(customRange.to, 'MMM d, yyyy')}`
                      : 'Select date range'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={customRange?.from}
                    selected={{ from: customRange?.from, to: customRange?.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setCustomRange({ from: range.from, to: range.to });
                        onDateRangeChange?.({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </>
      )}
    </div>
  );
}
