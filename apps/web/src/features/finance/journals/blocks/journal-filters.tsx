'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { layoutTokens } from '@/lib/layout-tokens';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface JournalFiltersProps {
  status: string;
  periodId: string;
  search: string;
  page: number;
  totalPages: number;
  onStatusChange: (value: string) => void;
  onPeriodChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (value: number) => void;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'REVERSED', label: 'Reversed' },
  { value: 'VOIDED', label: 'Voided' },
];

export function JournalFilters({
  status,
  periodId: _periodId,
  search,
  page,
  totalPages,
  onStatusChange,
  onPeriodChange: _onPeriodChange,
  onSearchChange,
  onPageChange,
}: JournalFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className={layoutTokens.selectWidthSm}>
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search journals…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={layoutTokens.selectWidthMd}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      )}
    </div>
  );
}
