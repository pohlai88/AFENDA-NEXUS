'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

// ─── Context Shape ──────────────────────────────────────────────────────────

interface PageBreadcrumbContextValue {
  /** Current page-level breadcrumb override (e.g. "Invoice #INV-2024-001"). */
  pageBreadcrumb: string | null;
  /** Set the last breadcrumb segment label. Resets automatically on pathname change. */
  setPageBreadcrumb: (label: string) => void;
}

const PageBreadcrumbCtx = createContext<PageBreadcrumbContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

interface PageBreadcrumbProviderProps {
  children: ReactNode;
}

/**
 * Lightweight context for detail pages to override the last breadcrumb segment
 * with a human-readable label (e.g. "Journal #REF-001" instead of a UUID).
 *
 * Resets automatically when the pathname changes — no manual cleanup needed.
 *
 * Usage in a detail page:
 * ```tsx
 * const { setPageBreadcrumb } = usePageBreadcrumb();
 * useEffect(() => { setPageBreadcrumb('Invoice #INV-2024-001'); }, []);
 * ```
 */
export function PageBreadcrumbProvider({ children }: PageBreadcrumbProviderProps) {
  const pathname = usePathname();
  const [pageBreadcrumb, setPageBreadcrumbState] = useState<string | null>(null);

  // Reset on pathname change — prevents stale labels when navigating
  useEffect(() => {
    setPageBreadcrumbState(null);
  }, [pathname]);

  const setPageBreadcrumb = useCallback((label: string) => {
    setPageBreadcrumbState(label);
  }, []);

  const value = useMemo(
    () => ({ pageBreadcrumb, setPageBreadcrumb }),
    [pageBreadcrumb, setPageBreadcrumb],
  );

  return (
    <PageBreadcrumbCtx.Provider value={value}>{children}</PageBreadcrumbCtx.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Access the page breadcrumb context.
 * Detail pages call `setPageBreadcrumb('Invoice #INV-001')` to override
 * the last breadcrumb segment with a human-readable label.
 */
export function usePageBreadcrumb(): PageBreadcrumbContextValue {
  const ctx = useContext(PageBreadcrumbCtx);
  if (!ctx) {
    throw new Error('usePageBreadcrumb must be used within <PageBreadcrumbProvider>');
  }
  return ctx;
}
