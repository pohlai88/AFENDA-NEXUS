'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRegisteredShortcuts } from '@/providers/shortcut-provider';
import type { ShortcutScope } from '@/lib/shortcuts/shortcut-engine';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShortcutDialogProps {
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

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Keyboard shortcut reference dialog.
 * Lists all registered shortcuts grouped by scope.
 * Triggered by "?" shortcut or from the command palette.
 */
export function ShortcutDialog({ open, onOpenChange }: ShortcutDialogProps) {
  const shortcuts = useRegisteredShortcuts();
  const [filter, setFilter] = useState('');

  // Group shortcuts by scope, filtered by search
  const grouped = useMemo(() => {
    const q = filter.toLowerCase().trim();
    const filtered = q
      ? shortcuts.filter(
          (s) =>
            s.description.toLowerCase().includes(q) ||
            s.keys.toLowerCase().includes(q),
        )
      : shortcuts;

    const groups = new Map<ShortcutScope, typeof filtered>();
    for (const s of filtered) {
      const group = groups.get(s.scope) ?? [];
      group.push(s);
      groups.set(s.scope, group);
    }

    // Return in display order, skip empty groups
    return SCOPE_ORDER
      .filter((scope) => groups.has(scope))
      .map((scope) => ({
        scope,
        label: SCOPE_LABELS[scope],
        shortcuts: groups.get(scope)!,
      }));
  }, [shortcuts, filter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Filter shortcuts..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mb-3"
          autoFocus
        />
        <ScrollArea className="max-h-[60vh]">
          {grouped.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No shortcuts found.
            </p>
          ) : (
            <div className="space-y-4">
              {grouped.map(({ scope, label, shortcuts: items }) => (
                <div key={scope}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </h3>
                  <div className="space-y-1">
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                      >
                        <span>{s.description}</span>
                        <KeyCombo keys={s.keys} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
ShortcutDialog.displayName = 'ShortcutDialog';

// ─── Key combo renderer ──────────────────────────────────────────────────────

function KeyCombo({ keys }: { keys: string }) {
  const parts = keys.split(/(?<=\+)|(?=\+)|\s+/).filter((p) => p !== '+');

  return (
    <span className="flex items-center gap-1">
      {parts.map((part, i) => (
        <kbd
          key={`${part}-${i}`}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
        >
          {formatKey(part)}
        </kbd>
      ))}
    </span>
  );
}

function formatKey(key: string): string {
  const MAP: Record<string, string> = {
    mod: '⌘',
    ctrl: '⌃',
    alt: '⌥',
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
