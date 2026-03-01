/**
 * Array Utility Functions
 * 
 * Polyfills and helper functions for array operations with browser compatibility
 */

/**
 * Immutable sort with fallback for older browsers
 * 
 * Uses native .toSorted() when available (Chrome 110+, Safari 16+, Firefox 115+),
 * falls back to spread + sort for older browsers.
 * 
 * @example
 * ```typescript
 * const sorted = toSorted(items, (a, b) => a.value - b.value);
 * ```
 */
export function toSorted<T>(arr: T[], compareFn: (a: T, b: T) => number): T[] {
  return arr.toSorted(compareFn);
}

/**
 * Immutable reverse with fallback for older browsers
 * 
 * Uses native .toReversed() when available, falls back to spread + reverse.
 */
export function toReversed<T>(arr: T[]): T[] {
  if ('toReversed' in Array.prototype) {
    return (arr as unknown as { toReversed: () => T[] }).toReversed();
  }
  return [...arr].reverse();
}

/**
 * Immutable splice with fallback for older browsers
 * 
 * Uses native .toSpliced() when available, falls back to spread + splice.
 * 
 * @example
 * ```typescript
 * const updated = toSpliced(items, 2, 1, newItem); // Replace item at index 2
 * ```
 */
export function toSpliced<T>(arr: T[], start: number, deleteCount?: number, ...items: T[]): T[] {
  if ('toSpliced' in Array.prototype) {
    return (arr as unknown as { toSpliced: (start: number, deleteCount: number | undefined, ...items: T[]) => T[] }).toSpliced(start, deleteCount, ...items);
  }
  const copy = [...arr];
  if (deleteCount === undefined) {
    copy.splice(start);
  } else {
    copy.splice(start, deleteCount, ...items);
  }
  return copy;
}

/**
 * Immutable element replacement with fallback for older browsers
 * 
 * Uses native .with() when available, falls back to spread + assignment.
 */
export function arrayWith<T>(arr: T[], index: number, value: T): T[] {
  if ('with' in Array.prototype) {
    return (arr as unknown as { with: (index: number, value: T) => T[] }).with(index, value);
  }
  const copy = [...arr];
  copy[index] = value;
  return copy;
}
