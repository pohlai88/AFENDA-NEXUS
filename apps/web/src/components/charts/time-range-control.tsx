'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ChartParams, TimeGrain, CompareMode } from './widget-spec';

interface TimeRangeControlProps {
  value: ChartParams;
  onChange: (params: ChartParams) => void;
  presets?: string[];
  grainOptions?: TimeGrain[];
  compareOptions?: CompareMode[];
  className?: string;
}

/**
 * TimeRangeControl - Standardized time controls for all charts
 * 
 * Features:
 * - Preset ranges (MTD, QTD, YTD, L12M)
 * - Custom date picker
 * - Time grain selector
 * - Compare mode toggle
 */
export function TimeRangeControl({
  value,
  onChange,
  presets = ['MTD', 'QTD', 'YTD', 'L12M', 'Custom'],
  grainOptions = ['day', 'week', 'month', 'quarter', 'year'],
  compareOptions = ['none', 'priorPeriod', 'priorYear', 'budget'],
  className,
}: TimeRangeControlProps) {
  const [selectedPreset, setSelectedPreset] = React.useState('MTD');
  const [showCustom, setShowCustom] = React.useState(false);

  const applyPreset = (preset: string) => {
    const today = new Date();
    let from: Date;
    const to: Date = today;

    switch (preset) {
      case 'MTD':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'QTD':
        from = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        break;
      case 'YTD':
        from = new Date(today.getFullYear(), 0, 1);
        break;
      case 'L12M':
        from = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        break;
      default:
        setShowCustom(true);
        return;
    }

    setSelectedPreset(preset);
    setShowCustom(false);
    onChange({
      ...value,
      range: {
        from: format(from, 'yyyy-MM-dd'),
        to: format(to, 'yyyy-MM-dd'),
      },
    });
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Preset buttons */}
      <div className="flex gap-1">
        {presets.map((preset) => (
          <Button
            key={preset}
            variant={selectedPreset === preset ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyPreset(preset)}
          >
            {preset}
          </Button>
        ))}
      </div>

      {/* Custom date range */}
      {showCustom && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(new Date(value.range.from), 'MMM d')} - {format(new Date(value.range.to), 'MMM d, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: new Date(value.range.from),
                to: new Date(value.range.to),
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onChange({
                    ...value,
                    range: {
                      from: format(range.from, 'yyyy-MM-dd'),
                      to: format(range.to, 'yyyy-MM-dd'),
                    },
                  });
                }
              }}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Grain selector */}
      <Select
        value={value.grain}
        onValueChange={(grain: TimeGrain) => onChange({ ...value, grain })}
      >
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {grainOptions.map((grain) => (
            <SelectItem key={grain} value={grain}>
              {grain.charAt(0).toUpperCase() + grain.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Compare mode */}
      <Select
        value={value.compare}
        onValueChange={(compare: CompareMode) => onChange({ ...value, compare })}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {compareOptions.map((mode) => (
            <SelectItem key={mode} value={mode}>
              {mode === 'none' ? 'No Comparison' : 
               mode === 'priorPeriod' ? 'vs Prior Period' :
               mode === 'priorYear' ? 'vs Prior Year' :
               'vs Budget'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
