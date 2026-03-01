'use client';

import { useEffect } from 'react';

/**
 * Format a Date to YYYY-MM-DD for HTML date inputs.
 */
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Get today's date in local timezone as YYYY-MM-DD.
 */
function getToday(): string {
  const d = new Date();
  return toISODate(d);
}

/**
 * Get yesterday's date.
 */
function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toISODate(d);
}

/**
 * Get last day of current month.
 */
function getMonthEnd(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return toISODate(d);
}

/**
 * Global keydown handler for date field shortcuts.
 * Only acts when focus is in an input with type="date" or data-type="date".
 *
 * Shortcuts (WCAG 2.1.4: focus-bound, no single-char conflict):
 * - t → Today
 * - y → Yesterday
 * - m → Month end (last day of current month)
 */
export function useDateFieldShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tag = target.tagName?.toLowerCase();
      if (tag !== 'input') return;

      const input = target as HTMLInputElement;
      const isDateInput =
        input.type === 'date' || input.getAttribute('data-type') === 'date';
      if (!isDateInput) return;

      // Only plain t, y, m (no modifiers)
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      const key = e.key.toLowerCase();
      let value: string | null = null;

      if (key === 't') value = getToday();
      else if (key === 'y') value = getYesterday();
      else if (key === 'm') value = getMonthEnd();

      if (value !== null) {
        e.preventDefault();
        e.stopPropagation();
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);
}
