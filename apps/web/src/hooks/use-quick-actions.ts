'use client';

import { useCallback, useState } from 'react';
import {
  readConveniencePrefs,
  writeConveniencePrefs,
} from '@/lib/shell/shell-persistence';
import type { QuickActionItem } from '@/lib/shell/shell-preferences.types';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum number of quick-action slots (Ctrl+1 … Ctrl+9). */
const MAX_QUICK_ACTIONS = 9;
const STORAGE_KEY = 'quick-actions';

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * CRUD hook for user-configured quick-action shortcuts, persisted in localStorage.
 *
 * Mirrors the Favorites pattern:
 * - Starts empty by default (no hardcoded actions)
 * - `toggle()` adds/removes an action
 * - Each action occupies a numbered slot (1-9) → Ctrl+1 … Ctrl+9
 * - Ctrl+Q opens/closes the quick-action picker
 *
 * Keyboard handling (Ctrl+Q, Ctrl+1…9) is registered by QuickActionShortcuts
 * with the ShortcutEngine so shortcuts appear in the keyboard shortcut dialog.
 */
export function useQuickActions() {
  const [actions, setActions] = useState<QuickActionItem[]>(() => {
    const stored = readConveniencePrefs<QuickActionItem[]>(STORAGE_KEY, []);
    return stored ?? [];
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
            // eslint-disable-next-line no-restricted-syntax
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

  return { actions, toggle, isQuickAction };
}
