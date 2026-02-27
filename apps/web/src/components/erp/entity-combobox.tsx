'use client';

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

// ─── Types ──────────────────────────────────────────────────────────────────

/** An option rendered in the combobox dropdown. */
interface EntityOption {
  id: string;
  label: string;
  /** Optional secondary text (e.g. account code). */
  hint?: string;
}

interface EntityComboboxProps {
  /** Currently selected option. */
  value: EntityOption | null;
  /** Callback when the selection changes. */
  onChange: (next: EntityOption | null) => void;
  /** Async loader for options, called on each debounced query. */
  loadOptions: (q: string) => Promise<EntityOption[]>;
  /** Placeholder text shown when no value is selected. */
  placeholder?: string;
  /** Label displayed above the combobox. */
  label?: string;
  /** Help text displayed below the combobox. */
  description?: string;
  /** Disables the combobox. */
  disabled?: boolean;
  /** Accessible label for screen readers. */
  ariaLabel?: string;
  /** Link to a "Create new" page. */
  createHref?: string;
  /** Validation error message. */
  error?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 300;

// ─── Component ──────────────────────────────────────────────────────────────

export function EntityCombobox({
  value,
  onChange,
  loadOptions,
  placeholder = 'Select…',
  label,
  description,
  disabled = false,
  ariaLabel,
  createHref,
  error,
}: EntityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await loadOptions(q);
          setOptions(results);
        } catch {
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }, DEBOUNCE_MS);
    },
    [loadOptions]
  );

  useEffect(() => {
    if (open) {
      search(query);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, query, search]);

  function handleSelect(option: EntityOption) {
    onChange(option);
    setOpen(false);
    setQuery('');
  }

  function handleClear() {
    onChange(null);
    setQuery('');
  }

  const id = ariaLabel?.replace(/\s+/g, '-').toLowerCase() ?? label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id}>
          {label}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={ariaLabel ?? label ?? placeholder}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground',
              error && 'border-destructive'
            )}
          >
            {value ? (
              <span className="truncate">{value.label}</span>
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search${label ? ` ${label.toLowerCase()}` : ''}…`}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loading && options.length === 0 && (
                <CommandEmpty>
                  {query ? 'No results found.' : 'Start typing to search…'}
                </CommandEmpty>
              )}

              {!loading && options.length > 0 && (
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.id}
                      onSelect={() => handleSelect(option)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value?.id === option.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm">{option.label}</span>
                        {option.hint && (
                          <span className="text-xs text-muted-foreground">{option.hint}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {createHref && (
                <div className="border-t px-2 py-2">
                  <Link
                    href={createHref}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    Create new
                  </Link>
                </div>
              )}
            </CommandList>
          </Command>

          {value && (
            <div className="border-t px-2 py-1.5">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear selection
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">{error}</p>
      )}
    </div>
  );
}
EntityCombobox.displayName = 'EntityCombobox';

export type { EntityComboboxProps, EntityOption };
