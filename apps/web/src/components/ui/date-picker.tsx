'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type DateRange = {
  from?: Date;
  to?: Date;
};

interface DatePickerWithRangeProps {
  className?: string;
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePickerWithRange({
  className,
  value,
  onChange,
  placeholder = 'Select date range',
  disabled,
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    onChange?.(range);
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-[260px] justify-start text-left font-normal',
              !value?.from && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, 'MMM d, yyyy')} - {format(value.to, 'MMM d, yyyy')}
                </>
              ) : (
                format(value.from, 'MMM d, yyyy')
              )
            ) : (
              placeholder
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={value?.from}
            selected={value as never}
            onSelect={handleSelect as never}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
