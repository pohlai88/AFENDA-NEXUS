'use client';

import { useCallback, useMemo } from 'react';
import {
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsStringLiteral,
  createParser,
} from 'nuqs';

// ─── Types ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FilterParamsConfig = Record<string, any>;

export interface UseFilterParamsOptions {
  shallow?: boolean;
  history?: 'push' | 'replace';
  clearOnDefault?: boolean;
}

// ─── Common Parsers (re-exported for convenience) ────────────────────────────

export { parseAsString, parseAsInteger, parseAsStringLiteral };

export const parseAsPage = parseAsInteger.withDefault(1);

export const parseAsLimit = parseAsInteger.withDefault(20);

export const parseAsSort = parseAsString;

export const parseAsBoolean = createParser({
  parse: (value) => value === 'true',
  serialize: (value) => (value ? 'true' : 'false'),
});

// ─── Standard Finance Filter Presets ─────────────────────────────────────────

export const standardFilters = {
  status: parseAsString,
  period: parseAsString,
  periodId: parseAsString,
  ledgerId: parseAsString,
  year: parseAsString,
  page: parseAsPage,
  limit: parseAsLimit,
  sort: parseAsSort,
  search: parseAsString,
} as const;

// ─── useFilterParams Hook ────────────────────────────────────────────────────

export function useFilterParams<T extends FilterParamsConfig>(
  config: T,
  options: UseFilterParamsOptions = {}
) {
  const { shallow = true, history = 'replace', clearOnDefault = true } = options;

  const [params, setParams] = useQueryStates(config, {
    shallow,
    history,
    clearOnDefault,
  });

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: unknown) => {
      setParams({ [key]: value } as Partial<typeof params>);
    },
    [setParams]
  );

  const clearFilters = useCallback(() => {
    const cleared = Object.keys(config).reduce(
      (acc, key) => ({ ...acc, [key]: null }),
      {} as Partial<typeof params>
    );
    setParams(cleared);
  }, [config, setParams]);

  const clearFilter = useCallback(
    <K extends keyof T>(key: K) => {
      setParams({ [key]: null } as Partial<typeof params>);
    },
    [setParams]
  );

  const hasActiveFilters = useMemo(() => {
    return Object.entries(params).some(([key, value]) => {
      if (key === 'page' || key === 'limit') return false;
      return value !== null && value !== undefined && value !== '';
    });
  }, [params]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(params).filter(([key, value]) => {
      if (key === 'page' || key === 'limit') return false;
      return value !== null && value !== undefined && value !== '';
    }).length;
  }, [params]);

  return {
    filters: params,
    setFilter,
    setFilters: setParams,
    clearFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}

// ─── Preset Filter Hooks ─────────────────────────────────────────────────────

export function useStatusFilter() {
  return useFilterParams({
    status: parseAsString,
    page: parseAsPage,
  });
}

export function usePeriodFilter() {
  return useFilterParams({
    periodId: parseAsString,
    year: parseAsString,
    page: parseAsPage,
  });
}

export function useLedgerFilter() {
  return useFilterParams({
    ledgerId: parseAsString,
    periodId: parseAsString,
    year: parseAsString,
    page: parseAsPage,
  });
}

export function useListFilters() {
  return useFilterParams({
    status: parseAsString,
    search: parseAsString,
    page: parseAsPage,
    limit: parseAsLimit,
    sort: parseAsSort,
  });
}

// ─── URL Builder Utilities ───────────────────────────────────────────────────

export function buildFilterUrl(
  basePath: string,
  filters: Record<string, string | number | boolean | null | undefined>
): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function mergeFilters(
  current: Record<string, unknown>,
  updates: Record<string, unknown>
): Record<string, string | number | boolean | null | undefined> {
  const merged = { ...current, ...updates };

  const result: Record<string, string | number | boolean | null | undefined> = {};
  Object.entries(merged).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      result[key] = null;
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[key] = value;
    }
  });

  return result;
}
