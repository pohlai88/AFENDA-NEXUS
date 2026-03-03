'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Command, Keyboard, Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { EmptyState } from '@/components/erp/empty-state';
import { useRegisteredShortcuts } from '@/providers/shortcut-provider';
import type { ShortcutScope } from '@/lib/shortcuts/shortcut-engine';
import type { ShortcutRegistration } from '@/lib/shortcuts/shortcut-engine';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/constants';
import { POPOVER_DOMAIN_W, SCROLL_MAX_H, TOOL_BAR_W } from './shell.tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShortcutPopoverProps {
  /** Controlled open state (e.g. for Ctrl+?). */
  open?: boolean;
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Resolved shortcut keys that open this popover (e.g. "mod+/"). Shown in tooltip and aria-label. */
  shortcutTriggerKeys?: string;
}

// ─── Scope / grouping ────────────────────────────────────────────────────────

const SCOPE_ORDER: ShortcutScope[] = ['global', 'page', 'table', 'sheet', 'cmdk', 'dialog'];

const SCOPE_LABELS: Record<ShortcutScope, string> = {
  global: 'Global',
  page: 'Page',
  table: 'Table',
  sheet: 'Sheet',
  cmdk: 'Command Palette',
  dialog: 'Dialog',
};

const STATIC_SHORTCUTS: Omit<ShortcutRegistration, 'handler'>[] = [
  {
    id: 'static-help',
    keys: 'mod+/',
    description: 'Show keyboard shortcuts',
    scope: 'global',
  },
  { id: 'static-search', keys: 'mod+k', description: 'Open command palette', scope: 'global' },
  {
    id: 'static-quick-actions',
    keys: 'mod+q',
    description: 'Open Quick Action picker (slots 1…9 for pinned)',
    scope: 'global',
  },
  { id: 'static-calculator', keys: 'mod+=', description: 'Open calculator', scope: 'global' },
  { id: 'static-sidebar', keys: 'mod+b', description: 'Toggle sidebar', scope: 'global' },
  { id: 'static-dashboard', keys: 'g d', description: 'Go to Dashboard', scope: 'global' },
  { id: 'static-journals', keys: 'g j', description: 'Go to Journals', scope: 'global' },
  { id: 'static-accounts', keys: 'g a', description: 'Go to Chart of Accounts', scope: 'global' },
  { id: 'static-periods', keys: 'g p', description: 'Go to Periods', scope: 'global' },
  { id: 'static-ledgers', keys: 'g l', description: 'Go to Ledgers', scope: 'global' },
  { id: 'static-banking', keys: 'g b', description: 'Go to Banking', scope: 'global' },
  { id: 'static-expenses', keys: 'g x', description: 'Go to Expenses', scope: 'global' },
  { id: 'static-invoices', keys: 'g i', description: 'Go to Invoices (AR)', scope: 'global' },
  { id: 'static-bills', keys: 'g v', description: 'Go to Bills (AP)', scope: 'global' },
  { id: 'static-reports', keys: 'g r', description: 'Go to Reports', scope: 'global' },
  { id: 'static-settings', keys: 'g s', description: 'Go to Settings', scope: 'global' },
  { id: 'static-create-journal', keys: 'c j', description: 'New Journal Entry', scope: 'global' },
  { id: 'static-create-invoice', keys: 'c i', description: 'New Invoice (AR)', scope: 'global' },
  { id: 'static-create-bill', keys: 'c b', description: 'New Bill (AP)', scope: 'global' },
  { id: 'static-create-expense', keys: 'c x', description: 'New Expense Claim', scope: 'global' },
  { id: 'static-create-account', keys: 'c a', description: 'New Account', scope: 'global' },
  {
    id: 'static-escape',
    keys: 'escape',
    description: 'Close dialog / clear search',
    scope: 'global',
  },
  { id: 'static-date-today', keys: 't', description: 'Date field: Today', scope: 'global' },
  { id: 'static-date-yesterday', keys: 'y', description: 'Date field: Yesterday', scope: 'global' },
  { id: 'static-date-month-end', keys: 'm', description: 'Date field: Month end', scope: 'global' },
  {
    id: 'static-table-select-all',
    keys: 'mod+a',
    description: 'Table: Select all rows',
    scope: 'global',
  },
  {
    id: 'static-journal-copy-row',
    keys: 'f8',
    description: 'Journal lines: Copy row above into current row',
    scope: 'global',
  },
  {
    id: 'static-page-new',
    keys: 'n',
    description: 'New (contextual — create item on current page)',
    scope: 'global',
  },
  {
    id: 'static-form-save',
    keys: 'mod+s',
    description: 'Save form (when form has focus)',
    scope: 'global',
  },
  {
    id: 'static-form-save-close',
    keys: 'mod+enter',
    description: 'Save and close form',
    scope: 'global',
  },
];

// ─── ShortcutPopover ──────────────────────────────────────────────────────────

/**
 * Keyboard shortcut reference popover — same framework as ModuleNavPopover.
 * Popover with header, filter input, ScrollArea, grouped shortcuts.
 * Triggered by Ctrl+? (keyboard icon) or shortcut.
 */
export function ShortcutPopover({
  open,
  onOpenChange,
  shortcutTriggerKeys: _shortcutTriggerKeys,
}: ShortcutPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  const isMac = useMemo(
    () => typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent),
    []
  );

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) setFilter('');
    },
    [setOpen]
  );

  const registered = useRegisteredShortcuts();
  const shortcuts = useMemo(() => {
    if (registered.length > 0) return registered;
    return STATIC_SHORTCUTS.map((s) => ({
      ...s,
      handler: () => {},
    })) as ShortcutRegistration[];
  }, [registered]);

  const grouped = useMemo(() => {
    const q = filter.toLowerCase().trim();
    const filtered = q
      ? shortcuts.filter(
          (s) => s.description.toLowerCase().includes(q) || s.keys.toLowerCase().includes(q)
        )
      : shortcuts;

    const scopeGroups = new Map<ShortcutScope, typeof filtered>();
    for (const s of filtered) {
      const group = scopeGroups.get(s.scope) ?? [];
      group.push(s);
      scopeGroups.set(s.scope, group);
    }

    const result: Array<{ scope: ShortcutScope; label: string; shortcuts: typeof filtered }> = [];

    for (const scope of SCOPE_ORDER) {
      const items = scopeGroups.get(scope) ?? [];
      if (items.length === 0) continue;

      if (scope === 'global') {
        const moduleNav = items.filter(
          (s) => s.keys.startsWith('g ') || s.description.startsWith('Go to ')
        );
        const create = items.filter(
          (s) =>
            s.keys.startsWith('c ') ||
            s.description.startsWith('New ') ||
            s.description.startsWith('Create ')
        );
        const other = items.filter((s) => !moduleNav.includes(s) && !create.includes(s));
        if (moduleNav.length > 0)
          result.push({ scope, label: 'Module navigation', shortcuts: moduleNav });
        if (create.length > 0) result.push({ scope, label: 'Create', shortcuts: create });
        if (other.length > 0) result.push({ scope, label: 'Other', shortcuts: other });
      } else {
        result.push({ scope, label: SCOPE_LABELS[scope], shortcuts: items });
      }
    }

    return result;
  }, [shortcuts, filter]);

  const hasAnyItems = grouped.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'hidden h-8 items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:inline-flex',
                TOOL_BAR_W
              )}
              aria-label="Keyboard shortcuts (⌘ ?)"
            >
              <Keyboard className="size-4 shrink-0" aria-hidden />
              <span className="text-sm">Shortcuts</span>
              <Kbd className="ml-auto min-w-10" suppressHydrationWarning>
                <Command className="size-3" aria-hidden />
                <span>?</span>
              </Kbd>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Keyboard shortcuts{' '}
          <Kbd className="ml-1 min-w-10" suppressHydrationWarning>
            <Command className="size-3" aria-hidden />
            <span>?</span>
          </Kbd>
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="end" side="bottom" className={cn(POPOVER_DOMAIN_W, 'p-0')}>
        <PopoverHeader className="border-b px-4 py-3">
          <PopoverTitle className="text-base">Keyboard Shortcuts</PopoverTitle>
          <div className="mt-2">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Filter shortcuts…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-8 pl-8 text-sm"
                aria-label="Filter shortcuts"
              />
            </div>
          </div>
        </PopoverHeader>
        {!hasAnyItems ? (
          <EmptyState
            contentKey="shell.shortcuts"
            icon={Keyboard}
            variant={filter.trim() ? 'noResults' : 'firstRun'}
            constraint="1x2"
          />
        ) : (
          <ScrollArea className={cn(SCROLL_MAX_H, 'h-[min(70vh,24rem)]')} type="auto">
            <div
              className="flex flex-col gap-4 py-3 pr-4 pl-3"
              role="list"
              aria-label="Keyboard shortcuts"
            >
              {grouped.map(({ scope, label, shortcuts: items }) => (
                <div key={`${scope}-${label}`}>
                  <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </h3>
                  <div className="space-y-0.5">
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground min-w-0"
                      >
                        <span className="min-w-0 truncate text-left whitespace-nowrap overflow-hidden text-ellipsis">
                          {s.description}
                        </span>
                        <span className="shrink-0 text-right whitespace-nowrap">
                          <ShortcutKeyCombo keys={s.keys} isMac={isMac} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <div className="border-t px-4 py-2">
          <Link
            href={routes.settingsPreferences}
            onClick={() => handleOpenChange(false)}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Customize shortcuts in Settings → Preferences
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

ShortcutPopover.displayName = 'ShortcutPopover';

// ─── Key combo renderer ────────────────────────────────────────────────────────

function ShortcutKeyCombo({ keys, isMac }: { keys: string; isMac: boolean }) {
  const parts = keys.split(/(?<=\+)|(?=\+)|\s+/).filter((p) => p !== '+');

  return (
    <KbdGroup>
      {parts.map((part, i) => (
        // eslint-disable-next-line react/no-array-index-key -- Key parts may duplicate; index disambiguates
        <Kbd key={`${part}-${i}`}>
          {part.toLowerCase() === 'mod' && isMac ? (
            <Command className="size-3" aria-hidden />
          ) : (
            formatKey(part, isMac)
          )}
        </Kbd>
      ))}
    </KbdGroup>
  );
}

function formatKey(key: string, isMac: boolean): string {
  const MAP: Record<string, string> = {
    mod: isMac ? '⌘' : 'Ctrl',
    ctrl: 'Ctrl',
    alt: isMac ? '⌥' : 'Alt',
    shift: '⇧',
    escape: 'Esc',
    enter: '↵',
    backspace: '⌫',
    delete: '⌦',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    ' ': 'Space',
  };
  return MAP[key.toLowerCase()] ?? key.toUpperCase();
}
