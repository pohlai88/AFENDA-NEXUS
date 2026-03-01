'use client';

import { useCallback, useState } from 'react';
import {
  readConveniencePrefs,
  writeConveniencePrefs,
} from '@/lib/shell/shell-persistence';
import type { FavoriteItem } from '@/lib/shell/shell-preferences.types';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_FAVORITES = 20;
const STORAGE_KEY = 'favorites';

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * CRUD hook for user-pinned (starred) pages, persisted in localStorage.
 *
 * Features:
 * - Toggle: add or remove a favorite in one call
 * - Capped at 20 items
 * - No PII stored (only href, title, module)
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() =>
    readConveniencePrefs<FavoriteItem[]>(STORAGE_KEY, []),
  );

  /** Toggle a page as favorite. Returns `true` if added, `false` if removed. */
  const toggle = useCallback(
    (item: Omit<FavoriteItem, 'addedAt'>): boolean => {
      let added = false;
      setFavorites((prev) => {
        const existing = prev.findIndex((f) => f.href === item.href);
        let next: FavoriteItem[];

        if (existing >= 0) {
          // Remove from favorites
          next = prev.filter((_, i) => i !== existing);
          added = false;
        } else {
          // Add to favorites (capped)
          // eslint-disable-next-line no-restricted-syntax
          const newItem: FavoriteItem = { ...item, addedAt: Date.now() };
          next = [newItem, ...prev].slice(0, MAX_FAVORITES);
          added = true;
        }

        writeConveniencePrefs(STORAGE_KEY, next);
        return next;
      });
      return added;
    },
    [],
  );

  /** Check if an href is currently favorited. */
  const isFavorite = useCallback(
    (href: string): boolean => {
      return favorites.some((f) => f.href === href);
    },
    [favorites],
  );

  /** Get all favorites (most recently added first). */
  const getFavorites = useCallback((): FavoriteItem[] => {
    return favorites;
  }, [favorites]);

  return { favorites, toggle, isFavorite, getFavorites };
}
