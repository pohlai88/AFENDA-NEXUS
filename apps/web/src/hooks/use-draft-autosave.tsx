'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from './use-debounce';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UseDraftAutoSaveOptions<T> {
  key: string;
  debounceMs?: number;
  maxAge?: number;
  onRestore?: (draft: T) => void;
  enabled?: boolean;
}

interface DraftMetadata {
  savedAt: string;
  version: number;
}

interface StoredDraft<T> {
  data: T;
  metadata: DraftMetadata;
}

// ─── useDraftAutoSave Hook ───────────────────────────────────────────────────

export function useDraftAutoSave<T>(
  data: T,
  options: UseDraftAutoSaveOptions<T>
) {
  const {
    key,
    debounceMs = 2000,
    maxAge = 24 * 60 * 60 * 1000, // 24 hours
    onRestore,
    enabled = true,
  } = options;

  const storageKey = `draft-${key}`;
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const versionRef = useRef(0);
  const initializedRef = useRef(false);

  // Debounce the data for auto-save
  const debouncedData = useDebounce(data, debounceMs);

  // Check for existing draft on mount
  useEffect(() => {
    if (!enabled || initializedRef.current) return;
    initializedRef.current = true;

    const stored = loadDraft<T>(storageKey);
    if (stored && !isDraftExpired(stored.metadata, maxAge)) {
      setHasDraft(true);
      setLastSaved(new Date(stored.metadata.savedAt));
      versionRef.current = stored.metadata.version;
    }
  }, [enabled, storageKey, maxAge]);

  // Auto-save when debounced data changes
  useEffect(() => {
    if (!enabled || !debouncedData) return;

    const hasContent = hasSignificantContent(debouncedData);
    if (!hasContent) return;

    setIsSaving(true);
    versionRef.current += 1;

    const draft: StoredDraft<T> = {
      data: debouncedData,
      metadata: {
        savedAt: new Date().toISOString(),
        version: versionRef.current,
      },
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setHasDraft(true);
      setLastSaved(new Date());
    } catch {
      // Storage full or unavailable
    } finally {
      setIsSaving(false);
    }
  }, [debouncedData, enabled, storageKey]);

  // Restore draft
  const restoreDraft = useCallback(() => {
    const stored = loadDraft<T>(storageKey);
    if (stored && onRestore) {
      onRestore(stored.data);
      setHasDraft(false);
    }
    return stored?.data ?? null;
  }, [storageKey, onRestore]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setHasDraft(false);
    setLastSaved(null);
    versionRef.current = 0;
  }, [storageKey]);

  // Get current draft without restoring
  const getDraft = useCallback((): T | null => {
    const stored = loadDraft<T>(storageKey);
    return stored?.data ?? null;
  }, [storageKey]);

  // Check if draft exists and is valid
  const checkDraft = useCallback((): { exists: boolean; savedAt: Date | null } => {
    const stored = loadDraft<T>(storageKey);
    if (stored && !isDraftExpired(stored.metadata, maxAge)) {
      return {
        exists: true,
        savedAt: new Date(stored.metadata.savedAt),
      };
    }
    return { exists: false, savedAt: null };
  }, [storageKey, maxAge]);

  return {
    hasDraft,
    lastSaved,
    isSaving,
    restoreDraft,
    clearDraft,
    getDraft,
    checkDraft,
  };
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function loadDraft<T>(key: string): StoredDraft<T> | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as StoredDraft<T>;
  } catch {
    return null;
  }
}

function isDraftExpired(metadata: DraftMetadata, maxAge: number): boolean {
  const savedAt = new Date(metadata.savedAt).getTime();
  return Date.now() - savedAt > maxAge;
}

function hasSignificantContent(data: unknown): boolean {
  if (!data) return false;
  
  if (typeof data === 'object') {
    const values = Object.values(data as Record<string, unknown>);
    return values.some((v) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      if (typeof v === 'number') return true;
      if (typeof v === 'boolean') return true;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return hasSignificantContent(v);
      return false;
    });
  }
  
  return true;
}

// ─── Draft Recovery Banner Component ─────────────────────────────────────────

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface DraftRecoveryBannerProps {
  hasDraft: boolean;
  lastSaved: Date | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export function DraftRecoveryBanner({
  hasDraft,
  lastSaved,
  onRestore,
  onDiscard,
}: DraftRecoveryBannerProps) {
  if (!hasDraft) return null;

  return (
    <Alert className="mb-4">
      <FileText className="h-4 w-4" />
      <AlertTitle>Unsaved draft found</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          You have an unsaved draft from{' '}
          {lastSaved ? formatRelativeTime(lastSaved.toISOString()) : 'earlier'}.
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onDiscard}>
            <X className="mr-1 h-3 w-3" />
            Discard
          </Button>
          <Button size="sm" onClick={onRestore}>
            Restore Draft
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
