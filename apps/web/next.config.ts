import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';

// ─── Monorepo Root .env Loader ─────────────────────────────────────────────
// Next.js only auto-loads .env from the app directory (apps/web/).
// We keep a single root .env per monorepo convention, so we parse it here
// before any module evaluation. Existing env vars (CI, Vercel, etc.) win.
function loadRootEnv() {
  const envPath = resolve(import.meta.dirname, '../../.env');
  let content: string;
  try {
    content = readFileSync(envPath, 'utf-8');
  } catch {
    return; // Root .env missing — rely on platform-injected vars
  }
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes (single or double)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Strip inline comments (only outside quoted values)
    const hashIdx = value.indexOf(' #');
    if (hashIdx !== -1) value = value.slice(0, hashIdx).trim();
    // Never overwrite existing env vars (CI / Vercel / .env.local take precedence)
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
loadRootEnv();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@afenda/core', '@afenda/contracts', '@afenda/authz', '@afenda/db'],
  serverExternalPackages: [
    '@neondatabase/serverless',
    'drizzle-orm',
    // @opentelemetry/api@1.9.0 has a broken ESM build (build/esm/ missing api/
    // subdirectory). Turbopack resolves via "module" → build/esm/index.js and
    // fails on `import { TraceAPI } from './api/trace'`. Externalising forces
    // Node.js CJS resolution (build/src/) which works correctly.
    '@opentelemetry/api',
  ],
  output: process.env.STANDALONE === 'true' ? 'standalone' : undefined,
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // React Compiler — auto-memoization for client components
  reactCompiler: true,

  // Dev-only fetch logging (reduces overhead in production)
  logging:
    process.env.NODE_ENV === 'development'
      ? { fetches: { fullUrl: true } }
      : undefined,

  // Experimental features for performance
  experimental: {
    // Turbopack: faster production builds via filesystem cache
    turbopackFileSystemCacheForBuild: true,
    // Turbopack: persist dev cache between restarts (faster proxy/page recompile)
    turbopackFileSystemCacheForDev: true,
    // Client router cache: ERP dashboards refresh within 30s, static pages cache 180s
    staleTimes: { dynamic: 30, static: 180 },
    // Smooth View Transitions API for page navigations
    viewTransition: true,
    optimizePackageImports: [
      'cmdk',
      'react-day-picker',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-progress',
      'lucide-react',
      'recharts',
      'date-fns',
      'framer-motion',
    ],
    webpackBuildWorker: true,
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600,
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: '**.afenda.io' },
      { protocol: 'https', hostname: '**.neon.tech' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      // OAuth provider avatars (user profile images)
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 's.gravatar.com' },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              isDev
                ? "connect-src 'self' http://localhost:* ws://localhost:* https://*.neon.tech https://o4508206844526592.ingest.us.sentry.io"
                : "connect-src 'self' https://*.afenda.io https://*.neon.tech https://*.posthog.com https://o4508206844526592.ingest.us.sentry.io",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              // Only upgrade to HTTPS in production; dev server is HTTP-only
              ...(isDev ? [] : ['upgrade-insecure-requests']),
            ].join('; '),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  disableSourceMapUpload: !process.env.SENTRY,
});
