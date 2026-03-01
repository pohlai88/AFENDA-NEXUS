'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  readConveniencePrefs,
  writeConveniencePrefs,
} from '@/lib/shell/shell-persistence';
import type { RecentItem } from '@/lib/shell/shell-preferences.types';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_RECENT = 20;
const DEBOUNCE_MS = 1000;
const STORAGE_KEY = 'recents';

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Track recently-visited pages in localStorage.
 *
 * Features:
 * - Debounced: waits 1s after last pathname change before writing
 * - Deduped: skips if href matches the most recent entry
 * - Capped at 20 items (FIFO eviction)
 * - Client-side only (no SSR side effects)
 */
export function useRecentItems() {
  const pathname = usePathname();
  const [recents, setRecents] = useState<RecentItem[]>(() =>
    readConveniencePrefs<RecentItem[]>(STORAGE_KEY, []),
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPathRef = useRef<string>('');

  // Auto-track pathname changes (debounced)
  useEffect(() => {
    // Skip initial mount if pathname hasn't changed
    if (pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;

    // Clear pending timer
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      // Derive title and moduleId from pathname
      const segments = pathname.split('/').filter(Boolean);
      const moduleId = segments[0] ?? 'home';
      const title = segments.length > 0
        ? (segments[segments.length - 1] ?? '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Home';

      // eslint-disable-next-line no-restricted-syntax
      addRecent({ href: pathname, title, moduleId, ts: Date.now() });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  /** Add a recent item (deduped, capped). */
  const addRecent = useCallback((item: RecentItem) => {
    setRecents((prev) => {
      // Dedupe: skip if href matches the most recent entry
      if (prev.length > 0 && prev[0]?.href === item.href) return prev;

      // Remove any existing entry for this href
      const filtered = prev.filter((r) => r.href !== item.href);

      // Prepend and cap
      const next = [item, ...filtered].slice(0, MAX_RECENT);
      writeConveniencePrefs(STORAGE_KEY, next);
      return next;
    });
  }, []);

  /** Get all recent items (most recent first). */
  const getRecent = useCallback((): RecentItem[] => {
    return recents;
  }, [recents]);

  /** Clear all recent items. */
  const clearRecent = useCallback(() => {
    setRecents([]);
    writeConveniencePrefs(STORAGE_KEY, []);
  }, []);

  return { recents, addRecent, getRecent, clearRecent };
}
