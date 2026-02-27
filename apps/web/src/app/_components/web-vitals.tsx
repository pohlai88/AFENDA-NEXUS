'use client';

import { useReportWebVitals } from 'next/web-vitals';

type ReportWebVitalsCallback = Parameters<typeof useReportWebVitals>[0];

/**
 * Reports Core Web Vitals (LCP, CLS, TTFB, INP, FCP) via useReportWebVitals.
 *
 * Sentry's browserTracingIntegration auto-captures web vitals in production.
 * This component provides dev-mode visibility and a hook point for future
 * analytics (PostHog, custom endpoint, etc.).
 */
const handleWebVitals: ReportWebVitalsCallback = (metric) => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug(
      `[web-vital] ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`,
    );
  }
};

export function WebVitals() {
  useReportWebVitals(handleWebVitals);
  return null;
}
