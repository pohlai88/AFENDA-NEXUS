'use client';

import { useCallback } from 'react';
import { useQueryState, parseAsString } from 'nuqs';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UseTabSyncOptions {
  paramKey?: string;
  defaultTab?: string;
  shallow?: boolean;
}

// ─── useTabSync Hook ─────────────────────────────────────────────────────────

export function useTabSync(options: UseTabSyncOptions = {}) {
  const {
    paramKey = 'tab',
    defaultTab = '',
    shallow = true,
  } = options;

  const [tab, setTabState] = useQueryState(
    paramKey,
    parseAsString.withDefault(defaultTab).withOptions({
      shallow,
      history: 'replace',
      clearOnDefault: true,
    })
  );

  const setTab = useCallback(
    (value: string) => {
      setTabState(value === defaultTab ? null : value);
    },
    [setTabState, defaultTab]
  );

  return {
    tab: tab || defaultTab,
    setTab,
    isDefaultTab: !tab || tab === defaultTab,
  };
}

// ─── Preset Tab Configurations ───────────────────────────────────────────────

export function useDetailTabs(defaultTab = 'overview') {
  return useTabSync({ paramKey: 'tab', defaultTab });
}

export function useListTabs(defaultTab = 'all') {
  return useTabSync({ paramKey: 'view', defaultTab });
}

export function useFormTabs(defaultTab = 'details') {
  return useTabSync({ paramKey: 'section', defaultTab });
}
