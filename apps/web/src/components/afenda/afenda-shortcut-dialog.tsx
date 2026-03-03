'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { ChevronDown, Command, HelpCircle } from 'lucide-react';
import { useRegisteredShortcuts } from '@/providers/shortcut-provider';
import type { ShortcutScope } from '@/lib/shortcuts/shortcut-engine';
import type { ShortcutRegistration } from '@/lib/shortcuts/shortcut-engine';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AfendaShortcutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Scope display order and labels ──────────────────────────────────────────

const SCOPE_ORDER: ShortcutScope[] = ['global', 'page', 'table', 'sheet', 'cmdk', 'dialog'];

const SCOPE_LABELS: Record<ShortcutScope, string> = {
  global: 'Global',
  page: 'Page',
  table: 'Table',
  sheet: 'Sheet',
  cmdk: 'Command Palette',
  dialog: 'Dialog',
};

// ─── Static fallback shortcuts (professional / international) ─────────────────

/**
 * Built-in shortcuts shown when the engine returns empty (e.g. hydration timing).
 * Uses platform-agnostic keys (mod = ⌘ on Mac, Ctrl on Win/Linux).
 */
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

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Keyboard shortcut reference dialog.
 * Lists all registered shortcuts grouped by scope.
 * Uses static fallback when engine returns empty (hydration timing).
 * Triggered by "?" shortcut or from the command palette.
 */
export function AfendaShortcutDialog({ open, onOpenChange }: AfendaShortcutDialogProps) {
  const registered = useRegisteredShortcuts();
  const shortcuts = useMemo(() => {
    if (registered.length > 0) return registered;
    return STATIC_SHORTCUTS.map((s) => ({
      ...s,
      handler: () => {},
    })) as ShortcutRegistration[];
  }, [registered]);
  const [filter, setFilter] = useState('');
  const isMac = useMemo(() => {
    if (typeof navigator === 'undefined') return true;
    return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  }, []);

  // Group shortcuts by scope, with sub-groups for global (Module navigation, Create, etc.)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90dvh,calc(100vh-2rem))] max-w-lg flex-col overflow-hidden p-6"
        aria-describedby="shortcut-dialog-description"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription id="shortcut-dialog-description" className="sr-only">
            Browse and filter registered keyboard shortcuts by scope. Use the filter to search.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Filter shortcuts..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mb-3 shrink-0"
          autoFocus
        />
        <ScrollArea className="min-h-0 max-h-[min(50vh,28rem)] flex-1">
          {grouped.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No shortcuts found.</p>
          ) : (
            <div className="space-y-4 pr-2">
              {grouped.map(({ scope, label, shortcuts: items }) => (
                <div key={`${scope}-${label}`}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </h3>
                  <div className="space-y-1">
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className="grid grid-cols-[1fr_auto] items-center gap-4 min-w-0 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                      >
                        <span className="min-w-0 truncate text-left whitespace-nowrap overflow-hidden text-ellipsis">
                          {s.description}
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-right">
                          <AfendaKeyCombo keys={s.keys} isMac={isMac} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Customization helper */}
        <Collapsible className="group/custom shrink-0 border-t pt-3">
          <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <HelpCircle className="size-3.5 shrink-0" />
            <span>How to customize shortcuts</span>
            <ChevronDown className="ml-auto size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/custom:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">Quick Actions</strong> — Press{' '}
                <KbdGroup>
                  <Kbd>{isMac ? <Command className="size-3" aria-hidden /> : 'Ctrl'}</Kbd>
                  <Kbd>Q</Kbd>
                </KbdGroup>{' '}
                to open the picker. Add any action from the sidebar to pin it as{' '}
                <KbdGroup>
                  <Kbd>{isMac ? <Command className="size-3" aria-hidden /> : 'Ctrl'}</Kbd>
                  <Kbd>1</Kbd>
                </KbdGroup>
                …
                <KbdGroup>
                  <Kbd>{isMac ? <Command className="size-3" aria-hidden /> : 'Ctrl'}</Kbd>
                  <Kbd>9</Kbd>
                </KbdGroup>
                . Remove via the ⋮ menu on each item.
              </p>
              <p>
                <strong className="text-foreground">Favorites</strong> — Use the + button in the
                Favorites section of the sidebar to pin pages. Your favorites appear in the command
                palette (
                <KbdGroup>
                  <Kbd>{isMac ? <Command className="size-3" aria-hidden /> : 'Ctrl'}</Kbd>
                  <Kbd>K</Kbd>
                </KbdGroup>
                ).
              </p>
              <p>
                <strong className="text-foreground">Custom shortcuts</strong> — Go to Settings →
                Preferences to remap navigation and create shortcuts.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </DialogContent>
    </Dialog>
  );
}
AfendaShortcutDialog.displayName = 'AfendaShortcutDialog';

// ─── Key combo renderer ──────────────────────────────────────────────────────

function AfendaKeyCombo({ keys, isMac }: { keys: string; isMac: boolean }) {
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
    ctrl: 'Ctrl', // Ctrl-only (e.g. Ctrl+Q for Quick Actions)
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

export type { AfendaShortcutDialogProps };
