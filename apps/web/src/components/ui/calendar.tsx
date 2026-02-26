'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import 'react-day-picker/style.css';

import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-2',
        month: 'flex flex-col gap-4',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        button_previous: 'absolute left-1 h-7 w-7 rounded-md border bg-background p-0 opacity-50 hover:opacity-100',
        button_next: 'absolute right-1 h-7 w-7 rounded-md border bg-background p-0 opacity-50 hover:opacity-100',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
        week: 'flex w-full mt-2',
        day: 'h-8 w-8 text-center text-sm p-0 relative',
        day_button: 'h-8 w-8 p-0 font-normal rounded-md hover:bg-accent',
        range_start: 'rounded-l-md bg-primary text-primary-foreground',
        range_end: 'rounded-r-md bg-primary text-primary-foreground',
        selected: 'bg-primary text-primary-foreground rounded-md',
        today: 'bg-accent text-accent-foreground rounded-md',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-50',
        range_middle: 'bg-accent/50',
        hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
