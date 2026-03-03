'use client';

import { useEffect, useRef, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface UseMessageSseOptions {
  supplierId: string;
  /** Called whenever the SSE server pushes a 'message' event. */
  onUpdate: () => void;
  /** Whether to connect. Default: true. */
  enabled?: boolean;
}

/**
 * Phase 1.2.1 CAP-MSG — SSE listener for real-time messaging updates.
 *
 * Connects to GET /portal/suppliers/:id/messages/sse and calls `onUpdate`
 * whenever the server emits a `message` event (new thread or message).
 * Automatically reconnects with exponential back-off on connection loss.
 */
export function useMessageSse({ supplierId, onUpdate, enabled = true }: UseMessageSseOptions) {
  const esRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUpdateRef = useRef(onUpdate);

  // Keep callback ref stable.
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const connect = useCallback(() => {
    if (!supplierId || !enabled) return;

    const url = `${API_BASE_URL}/portal/suppliers/${supplierId}/messages/sse`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.onopen = () => {
      retriesRef.current = 0;
    };

    es.addEventListener('message', () => {
      onUpdateRef.current();
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;

      // Exponential back-off: 1s, 2s, 4s, 8s … cap at 30s.
      const delay = Math.min(1_000 * 2 ** retriesRef.current, 30_000);
      retriesRef.current += 1;

      timerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [supplierId, enabled]);

  useEffect(() => {
    if (!enabled) return;

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [connect, enabled]);
}
