'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SavedView {
  id: string;
  name: string;
  filters: Record<string, string | number | boolean | null>;
  columns?: string[];
  sort?: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface SavedViewsStore {
  views: SavedView[];
  activeViewId: string | null;
}

interface UseSavedViewsOptions {
  moduleKey: string;
}

// ─── Storage Key Generator ───────────────────────────────────────────────────

function getStorageKey(moduleKey: string): string {
  return `finance-views-${moduleKey}`;
}

// ─── Load/Save Helpers ───────────────────────────────────────────────────────

function loadFromStorage(moduleKey: string): SavedViewsStore {
  if (typeof window === 'undefined') {
    return { views: [], activeViewId: null };
  }

  try {
    const stored = localStorage.getItem(getStorageKey(moduleKey));
    if (stored) {
      return JSON.parse(stored) as SavedViewsStore;
    }
  } catch {}

  return { views: [], activeViewId: null };
}

function saveToStorage(moduleKey: string, store: SavedViewsStore): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(getStorageKey(moduleKey), JSON.stringify(store));
  } catch {}
}

// ─── Generate View ID ────────────────────────────────────────────────────────

function generateId(): string {
  // eslint-disable-next-line no-restricted-syntax -- ID generator, not a render path
  return `view-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── useSavedViews Hook ──────────────────────────────────────────────────────

export function useSavedViews({ moduleKey }: UseSavedViewsOptions) {
  const [store, setStore] = useState<SavedViewsStore>(() => loadFromStorage(moduleKey));

  // Sync to localStorage whenever store changes
  useEffect(() => {
    saveToStorage(moduleKey, store);
  }, [moduleKey, store]);

  const { views, activeViewId } = store;

  const activeView = useMemo(
    () => views.find((v) => v.id === activeViewId) ?? null,
    [views, activeViewId]
  );

  const defaultView = useMemo(() => views.find((v) => v.isDefault) ?? null, [views]);

  // Create a new saved view
  const createView = useCallback(
    (
      name: string,
      filters: Record<string, string | number | boolean | null>,
      options?: { columns?: string[]; sort?: string; setAsActive?: boolean }
    ): SavedView => {
      const now = new Date().toISOString();
      const newView: SavedView = {
        id: generateId(),
        name,
        filters,
        columns: options?.columns,
        sort: options?.sort,
        createdAt: now,
        updatedAt: now,
        isDefault: false,
      };

      setStore((prev) => ({
        views: [...prev.views, newView],
        activeViewId: options?.setAsActive ? newView.id : prev.activeViewId,
      }));

      return newView;
    },
    []
  );

  // Update an existing view
  const updateView = useCallback(
    (id: string, updates: Partial<Pick<SavedView, 'name' | 'filters' | 'columns' | 'sort'>>) => {
      setStore((prev) => ({
        ...prev,
        views: prev.views.map((v) =>
          v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
        ),
      }));
    },
    []
  );

  // Delete a view
  const deleteView = useCallback((id: string) => {
    setStore((prev) => ({
      views: prev.views.filter((v) => v.id !== id),
      activeViewId: prev.activeViewId === id ? null : prev.activeViewId,
    }));
  }, []);

  // Set active view
  const setActiveView = useCallback((id: string | null) => {
    setStore((prev) => ({ ...prev, activeViewId: id }));
  }, []);

  // Set a view as default
  const setDefaultView = useCallback((id: string | null) => {
    setStore((prev) => ({
      ...prev,
      views: prev.views.map((v) => ({
        ...v,
        isDefault: v.id === id,
        updatedAt: v.id === id ? new Date().toISOString() : v.updatedAt,
      })),
    }));
  }, []);

  // Clear active view
  const clearActiveView = useCallback(() => {
    setStore((prev) => ({ ...prev, activeViewId: null }));
  }, []);

  // Duplicate a view
  const duplicateView = useCallback(
    (id: string, newName?: string): SavedView | null => {
      const sourceView = views.find((v) => v.id === id);
      if (!sourceView) return null;

      const now = new Date().toISOString();
      const newView: SavedView = {
        ...sourceView,
        id: generateId(),
        name: newName ?? `${sourceView.name} (Copy)`,
        createdAt: now,
        updatedAt: now,
        isDefault: false,
      };

      setStore((prev) => ({
        ...prev,
        views: [...prev.views, newView],
      }));

      return newView;
    },
    [views]
  );

  // Rename a view
  const renameView = useCallback(
    (id: string, newName: string) => {
      updateView(id, { name: newName });
    },
    [updateView]
  );

  return {
    views,
    activeView,
    activeViewId,
    defaultView,
    createView,
    updateView,
    deleteView,
    duplicateView,
    renameView,
    setActiveView,
    setDefaultView,
    clearActiveView,
  };
}
