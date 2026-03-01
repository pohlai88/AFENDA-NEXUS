'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  readConveniencePrefs,
  writeConveniencePrefs,
} from '@/lib/shell/shell-persistence';
import type { QuickActionItem } from '@/lib/shell/shell-preferences.types';
import { routes } from '@/lib/constants';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum number of quick-action slots (Ctrl+1 … Ctrl+9). */
const MAX_QUICK_ACTIONS = 9;
const STORAGE_KEY = 'quick-actions';

// ─── Default quick actions ──────────────────────────────────────────────────

const DEFAULT_QUICK_ACTIONS: QuickActionItem[] = [
  {
    actionId: routes.finance.journalNew,
    title: 'New Journal Entry',
    icon: 'FilePlus2',
    href: routes.finance.journalNew,
    slot: 1,
    addedAt: 0,
  },
  {
    actionId: routes.finance.payableNew,
    title: 'New Invoice',
    icon: 'FileText',
    href: routes.finance.payableNew,
    slot: 2,
    addedAt: 0,
  },
  {
    actionId: routes.finance.expenseNew,
    title: 'New Expense Claim',
    icon: 'Receipt',
    href: routes.finance.expenseNew,
    slot: 3,
    addedAt: 0,
  },
];

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * CRUD hook for user-configured quick-action shortcuts, persisted in localStorage.
 *
 * Mirrors the Favorites pattern:
 * - `toggle()` adds/removes an action
 * - Each action occupies a numbered slot (1-9) → Ctrl+1 … Ctrl+9
 * - Ctrl+Q opens/closes the quick-action picker
 *
 * The hook also registers global keyboard listeners for Ctrl+1 … Ctrl+9
 * to directly navigate to the corresponding action's href.
 */
export function useQuickActions() {
  const router = useRouter();
  const [actions, setActions] = useState<QuickActionItem[]>(() => {
    const stored = readConveniencePrefs<QuickActionItem[]>(STORAGE_KEY, []);
    return stored.length > 0 ? stored : DEFAULT_QUICK_ACTIONS;
  });

  /** Add or remove a quick action. Returns `true` if added. */
  const toggle = useCallback(
    (item: Omit<QuickActionItem, 'addedAt' | 'slot'>): boolean => {
      let added = false;
      setActions((prev) => {
        const existing = prev.findIndex((a) => a.href === item.href);
        let next: QuickActionItem[];

        if (existing >= 0) {
          // Remove
          next = prev
            .filter((_, i) => i !== existing)
            // Re-number slots
            .map((a, i) => ({ ...a, slot: i + 1 }));
          added = false;
        } else if (prev.length >= MAX_QUICK_ACTIONS) {
          // Max reached — do nothing
          return prev;
        } else {
          // Add at the next available slot
          const newItem: QuickActionItem = {
            ...item,
            slot: prev.length + 1,
            addedAt: Date.now(),
          };
          next = [...prev, newItem];
          added = true;
        }

        writeConveniencePrefs(STORAGE_KEY, next);
        return next;
      });
      return added;
    },
    [],
  );

  /** Check if an action is already a quick-action (by href). */
  const isQuickAction = useCallback(
    (href: string): boolean => {
      return actions.some((a) => a.href === href);
    },
    [actions],
  );

  // ─── Global Ctrl+1…9 keyboard listener ──────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only Ctrl+digit (no meta, no alt, no shift)
      if (!e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      const digit = parseInt(e.key, 10);
      if (isNaN(digit) || digit < 1 || digit > 9) return;

      const action = actions.find((a) => a.slot === digit);
      if (!action) return;

      e.preventDefault();
      e.stopPropagation();
      router.push(action.href);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, router]);

  return { actions, toggle, isQuickAction };
}
