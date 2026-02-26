# Next.js Performance Optimizations

## Overview

This document outlines the enterprise-grade performance optimizations implemented in the Afenda web application.

## Configuration Optimizations

### next.config.ts

#### Compiler Optimizations
- **Console removal**: Removes `console.log` in production (keeps `error` and `warn`)
- **Server external packages**: Optimizes bundling for `@neondatabase/serverless` and `drizzle-orm`

#### Experimental Features
- **optimizePackageImports**: Tree-shaking for large libraries
  - `@radix-ui/react-icons`
  - `lucide-react`
  - `recharts`
  - `date-fns`
  - `framer-motion`
- **webpackBuildWorker**: Parallel webpack builds
- **parallelServerCompiles**: Faster server component compilation
- **parallelServerBuildTraces**: Optimized build traces

#### Image Optimization
- **Formats**: AVIF (preferred) and WebP fallback
- **Device sizes**: Optimized for 8 breakpoints (640px to 3840px)
- **Image sizes**: 8 size variants for responsive images
- **Cache TTL**: 60 seconds minimum
- **Security**: SVG disabled, content disposition set to attachment

#### Caching Strategy
- **Static assets**: 1 year cache with immutable flag
  - `/_next/static/*` - Build artifacts
  - `/fonts/*` - Font files
- **Dynamic routes**: Force-dynamic with revalidate: 0

## Security Headers

### Content Security Policy (CSP)
- Strict CSP with minimal `unsafe-inline` (only for styles)
- Production removes `unsafe-eval`
- Separate policies for development and production
- Sentry integration for error reporting

### Security Headers Applied
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: Restricts camera, microphone, geolocation, payment
- `Strict-Transport-Security`: HSTS with 2-year max-age and preload

## Middleware (Edge Runtime)

### Benefits
- Runs on Vercel Edge Network (low latency)
- Minimal cold start times
- Global distribution

### Responsibilities
- Session validation
- OAuth token exchange
- Protected route enforcement
- Security header injection

## Font Optimization

### Inter Font Configuration
- **Preload**: Enabled for critical font loading
- **Display**: swap (prevents FOIT)
- **Fallback**: system-ui, arial
- **adjustFontFallback**: Automatic fallback metrics adjustment
- **Variable font**: Uses CSS custom property `--font-sans`

## Metadata & SEO

### Comprehensive Metadata
- OpenGraph tags for social sharing
- Twitter Card support
- Structured data ready
- Dynamic titles with template
- Robots meta tags (environment-aware)

### PWA Support
- Web App Manifest (`manifest.json`)
- App shortcuts for quick access
- Theme color support (light/dark)
- Standalone display mode

## React Server Components (RSC)

### Dashboard Page Optimization
- **Suspense boundaries**: Granular loading states
- **Parallel data fetching**: Multiple queries with `Promise.all()`
- **Streaming**: Progressive rendering of dashboard sections
- **Custom skeletons**: Tailored loading states for each section

### Benefits
- Reduced JavaScript bundle size
- Faster initial page load
- Better perceived performance
- SEO-friendly server rendering

## Caching Strategy

### Route Segment Config
- **Dynamic routes**: `export const dynamic = 'force-dynamic'`
- **Revalidation**: `export const revalidate = 0` for real-time data
- **Static routes**: Default ISR where applicable

### Data Fetching
- Server-side data fetching in RSC
- Client-side caching via React Query (where needed)
- Optimistic updates for mutations

## Bundle Optimization

### Code Splitting
- Automatic route-based splitting
- Dynamic imports for heavy components
- Lazy loading for modals and dialogs

### Tree Shaking
- ES modules throughout
- Named exports preferred
- Dead code elimination in production

### Bundle Analysis
- `ANALYZE=true pnpm build` to generate bundle report
- Monitor bundle size in CI/CD
- Target: < 200KB initial JS bundle

## Performance Monitoring

### Sentry Integration
- Error tracking
- Performance monitoring
- Request error capture via `onRequestError`
- Source maps uploaded in production

### Web Vitals
- LCP (Largest Contentful Paint): Target < 2.5s
- FID (First Input Delay): Target < 100ms
- CLS (Cumulative Layout Shift): Target < 0.1
- TTFB (Time to First Byte): Target < 600ms

## Best Practices Applied

### 1. Static Generation Where Possible
- Error pages (404, 500)
- Public marketing pages (future)

### 2. Incremental Static Regeneration (ISR)
- Reports with stable data
- Dashboard widgets with revalidation

### 3. Edge Runtime
- Middleware for auth checks
- API routes for simple operations

### 4. Database Optimization
- Connection pooling via Neon
- Prepared statements
- Query optimization with indexes

### 5. Asset Optimization
- Image optimization via Next.js Image
- Font subsetting
- CSS minification
- JavaScript minification

## Monitoring & Debugging

### Development
- Turbopack for fast HMR
- Source maps enabled
- Verbose error messages

### Production
- Sentry error tracking
- Performance monitoring
- User session replay (optional)

## Future Optimizations

### Planned
- [ ] Service Worker for offline support
- [ ] Background sync for form submissions
- [ ] Prefetching for predictable navigation
- [ ] Resource hints (dns-prefetch, preconnect)
- [ ] Critical CSS extraction
- [ ] HTTP/3 and QUIC support

### Under Consideration
- [ ] Partial Prerendering (PPR)
- [ ] React Server Actions optimization
- [ ] Edge caching with Vercel KV
- [ ] GraphQL for data fetching
- [ ] WebAssembly for heavy computations

## Performance Checklist

- [x] Next.js config optimized
- [x] Middleware on Edge Runtime
- [x] Comprehensive security headers
- [x] Image optimization configured
- [x] Font optimization with preload
- [x] Metadata and SEO tags
- [x] PWA manifest
- [x] Error boundaries
- [x] Loading states with Suspense
- [x] Static asset caching
- [x] Bundle analysis tooling
- [x] Sentry integration
- [ ] Lighthouse score > 90 (to be measured)
- [ ] Core Web Vitals passing (to be measured)

## Measuring Performance

### Local Testing
```bash
# Build and analyze
ANALYZE=true pnpm build

# Test production build locally
pnpm build && pnpm start

# Run Lighthouse
npx lighthouse http://localhost:3000 --view
```

### CI/CD Integration
- Lighthouse CI in GitHub Actions
- Bundle size tracking
- Performance regression detection

## Resources

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)
- [Vercel Edge Network](https://vercel.com/docs/edge-network/overview)
- [Core Web Vitals](https://web.dev/vitals/)
