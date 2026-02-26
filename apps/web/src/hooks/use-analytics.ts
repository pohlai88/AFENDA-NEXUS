/**
 * Analytics — PostHog event tracking.
 *
 * All call-sites import from this module so the vendor choice
 * stays in one place.
 *
 * @module use-analytics
 */

import posthog from 'posthog-js';

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

// ─── Singleton Init ─────────────────────────────────────────────────────────

let _initialized = false;

function ensurePostHog(): boolean {
  if (typeof window === 'undefined') return false;
  if (_initialized) return true;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return false;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // we call it manually
    capture_pageleave: true,
    loaded: () => {
      if (process.env.NODE_ENV === 'development') posthog.debug(false);
    },
  });
  _initialized = true;
  return true;
}

// ─── Core Functions ─────────────────────────────────────────────────────────

export function trackEvent(event: AnalyticsEvent): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[analytics]', event.name, event.properties);
    return;
  }
  if (!ensurePostHog()) return;
  posthog.capture(event.name, event.properties ?? {});
}

export function identifyUser(user: AnalyticsUser): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[analytics] identify', user.id);
    return;
  }
  if (!ensurePostHog()) return;
  posthog.identify(user.id, {
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
  });
}

export function resetAnalytics(): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[analytics] reset');
    return;
  }
  if (!ensurePostHog()) return;
  posthog.reset();
}

export function trackPageView(path: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[analytics] pageview', path);
    return;
  }
  if (!ensurePostHog()) return;
  posthog.capture('$pageview', { $current_url: path });
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
