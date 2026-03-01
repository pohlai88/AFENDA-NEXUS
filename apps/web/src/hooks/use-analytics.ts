/**
 * Analytics — PostHog event tracking.
 *
 * PostHog is loaded via dynamic import to keep posthog-js out of the initial
 * bundle; it loads on first analytics call (identify, track, pageView).
 *
 * @module use-analytics
 */

import type PostHog from 'posthog-js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean | null>;
}

export interface AnalyticsUser {
  id: string;
  email?: string;
  name?: string;
  tenantId?: string;
}

// ─── Singleton Init (dynamic import) ─────────────────────────────────────────

let _posthog: PostHog | null = null;
let _initPromise: Promise<boolean> | null = null;

async function ensurePostHog(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (_posthog) return true;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return false;

  if (!_initPromise) {
    _initPromise = (async () => {
      const posthog = (await import('posthog-js')).default;
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // we call it manually
        capture_pageleave: true,
        loaded: () => {
          if (process.env.NODE_ENV === 'development') posthog.debug(false);
        },
      });
      _posthog = posthog;
      return true;
    })();
  }

  await _initPromise;
  return _posthog !== null;
}

// ─── Core Functions ─────────────────────────────────────────────────────────

export function trackEvent(event: AnalyticsEvent): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[analytics]', event.name, event.properties);
    return;
  }
  ensurePostHog().then((ok) => {
    if (ok && _posthog) _posthog.capture(event.name, event.properties ?? {});
  });
}

export function identifyUser(user: AnalyticsUser): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[analytics] identify', user.id);
    return;
  }
  ensurePostHog().then((ok) => {
    if (ok && _posthog) {
      _posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
      });
    }
  });
}

export function resetAnalytics(): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[analytics] reset');
    return;
  }
  ensurePostHog().then((ok) => {
    if (ok && _posthog) _posthog.reset();
  });
}

export function trackPageView(path: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[analytics] pageview', path);
    return;
  }
  ensurePostHog().then((ok) => {
    if (ok && _posthog) _posthog.capture('$pageview', { $current_url: path });
  });
}

// ─── React Hook ─────────────────────────────────────────────────────────────

export function useAnalytics() {
  return {
    track: trackEvent,
    identify: identifyUser,
    reset: resetAnalytics,
    pageView: trackPageView,
  } as const;
}
