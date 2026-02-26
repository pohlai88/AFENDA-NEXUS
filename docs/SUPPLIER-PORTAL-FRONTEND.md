# Supplier Portal — Frontend Design & Development Plan

> **Status**: Planning  
> **Author**: AI Pair Programmer  
> **Date**: 2026-02-26  
> **Backend**: 100% complete — 11 services (N1–N11), 20 API endpoints, 550-line route file  
> **Frontend**: 0% — design spec follows

---

## 1. Architecture Decisions

### 1.1 Routing Strategy — Separate Route Group

The supplier portal is a **distinct application surface** from the internal ERP shell. Suppliers authenticate with a supplier-linked user account and see only their own scoped data. This demands:

```
apps/web/src/app/
  (auth)/             ← existing auth pages (login, register, etc.)
  (shell)/            ← existing internal ERP (finance/, settings/)
  (portal)/           ← NEW — supplier portal
    layout.tsx        ← portal-specific shell (no ERP sidebar)
    loading.tsx
    page.tsx          ← portal dashboard (invoices summary, aging, compliance)
    invoices/
      page.tsx        ← N2: invoice list
      [id]/
        page.tsx      ← N2: invoice detail
      submit/
        page.tsx      ← N1: electronic invoice submission form
    payments/
      page.tsx        ← N2: payment run list
      [runId]/
        page.tsx      ← N2: payment run detail
        remittance/
          page.tsx    ← N4: remittance advice download
    profile/
      page.tsx        ← N6: profile self-service update
    bank-accounts/
      page.tsx        ← N3: bank account management
    documents/
      page.tsx        ← N8: document vault
    disputes/
      page.tsx        ← N9: dispute list
      new/
        page.tsx      ← N9: create dispute
      [id]/
        page.tsx      ← N9: dispute detail
    reconciliation/
      page.tsx        ← N7: statement upload + recon
    wht/
      page.tsx        ← N5: WHT certificate list
      [id]/
        page.tsx      ← N5: WHT certificate detail
    compliance/
      page.tsx        ← N11: compliance status
    settings/
      notifications/
        page.tsx      ← N10: notification preferences
```

**Rationale**:
- Route group `(portal)` gives a separate `layout.tsx` without ERP chrome
- Middleware enforces `supplier:read` / `supplier:write` permissions at the route group level
- Portal users cannot accidentally navigate into `(shell)` routes
- SEO/SSR: all list pages are RSC (server components), detail pages use `BusinessDocument` pattern

### 1.2 Layout — Portal Shell

The portal layout is **visually simpler** than the ERP shell:
- **Top bar**: Supplier name + logo, notification bell, user menu (profile, logout)
- **Left sidebar**: Compact nav (8 items, no collapsible groups)
- **No period/company switcher** (suppliers have one identity)
- **Footer**: "Powered by Afenda" branding

### 1.3 Feature Module Structure

```
apps/web/src/features/portal/
  queries/
    portal.queries.ts     ← all API query functions (server-side)
  actions/
    portal.actions.ts     ← all server actions (mutations)
  blocks/
    portal-dashboard-summary.tsx
    portal-invoice-table.tsx
    portal-invoice-detail-header.tsx
    portal-payment-table.tsx
    portal-remittance-view.tsx
    portal-bank-account-list.tsx
    portal-document-table.tsx
    portal-dispute-table.tsx
    portal-dispute-detail.tsx
    portal-recon-results.tsx
    portal-wht-table.tsx
    portal-compliance-summary.tsx
    portal-notification-prefs.tsx
  forms/
    portal-invoice-submit-form.tsx
    portal-bank-account-form.tsx
    portal-profile-form.tsx
    portal-document-upload-form.tsx
    portal-dispute-form.tsx
    portal-statement-upload-form.tsx
    portal-notification-form.tsx
```

### 1.4 Data Fetching Pattern

Follows the established codebase pattern exactly:

| Layer | Pattern | Example |
|-------|---------|---------|
| **RSC Page** | `getRequestContext()` → query function → render | `payables/page.tsx` |
| **Query** | `createApiClient(ctx).get(...)` returns `ApiResult<T>` | `ap.queries.ts` |
| **Action** | `'use server'` + `getRequestContext()` → mutation | `ap.actions.ts` |
| **Client Block** | `'use client'` + receives data as props | `ap-invoice-table.tsx` |
| **Form** | React Hook Form + Zod + server action via `useTransition` | `ap-invoice-form.tsx` |

### 1.5 Supplier Context

The portal needs to resolve `supplierId` from the authenticated user. This is handled by:

```typescript
// features/portal/queries/portal.queries.ts
export async function getPortalSupplier(
  ctx: RequestContext
): Promise<ApiResult<PortalSupplier>> {
  const client = createApiClient(ctx);
  return client.get<PortalSupplier>('/portal/me'); // returns { supplierId, supplierName, status }
}
```

The `(portal)/layout.tsx` fetches this once and provides it via React context or passes to children.

---

## 2. API Surface Mapping

Every backend endpoint maps to a frontend page/action:

| # | Feature | Method | API Endpoint | Frontend Page | Form/Block |
|---|---------|--------|-------------|---------------|------------|
| N1 | Invoice Submit | `POST` | `/portal/suppliers/:id/invoices/submit` | `invoices/submit/page.tsx` | `portal-invoice-submit-form.tsx` |
| N2 | Invoice List | `GET` | `/portal/suppliers/:id/invoices` | `invoices/page.tsx` | `portal-invoice-table.tsx` |
| N2 | Aging Report | `GET` | `/portal/suppliers/:id/aging` | `page.tsx` (dashboard) | `portal-dashboard-summary.tsx` |
| N2 | Payment Run Detail | `GET` | `/portal/suppliers/:id/payment-runs/:runId` | `payments/[runId]/page.tsx` | `portal-payment-detail.tsx` |
| N3 | Add Bank Account | `POST` | `/portal/suppliers/:id/bank-accounts` | `bank-accounts/page.tsx` | `portal-bank-account-form.tsx` |
| N4 | Remittance Download | `GET` | `/portal/suppliers/:id/payment-runs/:runId/remittance` | `payments/[runId]/remittance/page.tsx` | `portal-remittance-view.tsx` |
| N5 | WHT Certificates | `GET` | `/portal/suppliers/:id/wht-certificates` | `wht/page.tsx` | `portal-wht-table.tsx` |
| N5 | WHT Certificate Detail | `GET` | `/portal/suppliers/:id/wht-certificates/:certId` | `wht/[id]/page.tsx` | `portal-wht-detail.tsx` |
| N6 | Profile Update | `PATCH` | `/portal/suppliers/:id/profile` | `profile/page.tsx` | `portal-profile-form.tsx` |
| N7 | Statement Recon | `POST` | `/portal/suppliers/:id/statement-recon` | `reconciliation/page.tsx` | `portal-statement-upload-form.tsx` |
| N8 | Document Upload | `POST` | `/portal/suppliers/:id/documents` | `documents/page.tsx` | `portal-document-upload-form.tsx` |
| N8 | Document List | `GET` | `/portal/suppliers/:id/documents` | `documents/page.tsx` | `portal-document-table.tsx` |
| N9 | Create Dispute | `POST` | `/portal/suppliers/:id/disputes` | `disputes/new/page.tsx` | `portal-dispute-form.tsx` |
| N9 | List Disputes | `GET` | `/portal/suppliers/:id/disputes` | `disputes/page.tsx` | `portal-dispute-table.tsx` |
| N9 | Dispute Detail | `GET` | `/portal/suppliers/:id/disputes/:disputeId` | `disputes/[id]/page.tsx` | `portal-dispute-detail.tsx` |
| N10 | Get Notification Prefs | `GET` | `/portal/suppliers/:id/notification-prefs` | `settings/notifications/page.tsx` | `portal-notification-prefs.tsx` |
| N10 | Update Notification Prefs | `PUT` | `/portal/suppliers/:id/notification-prefs` | `settings/notifications/page.tsx` | `portal-notification-form.tsx` |
| N11 | Compliance Summary | `GET` | `/portal/suppliers/:id/compliance` | `compliance/page.tsx` | `portal-compliance-summary.tsx` |

---

## 3. View Models (UI Types)

```typescript
// features/portal/queries/portal.queries.ts

export interface PortalSupplier {
  supplierId: string;
  supplierName: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'INACTIVE';
  taxId: string | null;
  remittanceEmail: string | null;
  currencyCode: string;
}

export interface PortalInvoiceListItem {
  id: string;
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  amountPaid: string;
  balanceDue: string;
  currencyCode: string;
}

export interface PortalAgingBucket {
  label: string;
  count: number;
  totalAmount: string;
  currencyCode: string;
}

export interface PortalRemittanceItem {
  invoiceId: string;
  invoiceNumber: string;
  grossAmount: string;
  discountAmount: string;
  netAmount: string;
}

export interface PortalRemittanceAdvice {
  paymentRunId: string;
  runNumber: string;
  runDate: string;
  currencyCode: string;
  supplierName: string;
  items: PortalRemittanceItem[];
  totalGross: string;
  totalDiscount: string;
  totalNet: string;
}

export interface PortalBankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string | null;
  swiftBic: string | null;
  currencyCode: string;
  isPrimary: boolean;
}

export interface PortalDocument {
  id: string;
  category: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  checksumSha256: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface PortalDispute {
  id: string;
  invoiceId: string | null;
  paymentRunId: string | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalWhtCertificate {
  id: string;
  invoiceId: string;
  certificateNumber: string;
  whtAmount: string;
  currencyCode: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
}

export interface PortalComplianceItem {
  itemType: string;
  status: string;
  expiresAt: string | null;
  lastVerifiedAt: string | null;
  notes: string | null;
}

export interface PortalNotificationPref {
  eventType: string;
  channel: string;
  enabled: boolean;
  webhookUrl: string | null;
}
```

---

## 4. Portal Dashboard Design

The landing page `(portal)/page.tsx` is a **summary dashboard** with 4 cards:

```
┌──────────────────────────────────────────────────────────────┐
│  Welcome back, {supplierName}                    [🔔] [👤]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ OPEN        │  │ OVERDUE     │  │ PAID (30d)  │          │
│  │ INVOICES    │  │ INVOICES    │  │ INVOICES    │          │
│  │   12        │  │    3        │  │   28        │          │
│  │ $84,500     │  │ $12,300     │  │ $156,200    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  ┌──── Aging Breakdown ──────────────────────────────────┐   │
│  │ Current  │ 1–30 days │ 31–60 │ 61–90 │ 90+          │   │
│  │ $40,000  │ $28,000   │ $12k  │ $3k   │ $1.5k        │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──── Compliance Status ────────┐  ┌──── Recent ────────┐  │
│  │ ✅ KYC Valid                  │  │ INV-2024-0089      │  │
│  │ ✅ Tax Clearance (exp 6mo)    │  │ INV-2024-0088      │  │
│  │ ⚠️  Insurance (expiring soon) │  │ INV-2024-0085      │  │
│  │ ❌ BEE Certificate (expired)  │  │ Payment run #47    │  │
│  └───────────────────────────────┘  └────────────────────┘  │
│                                                              │
│  ┌──── Open Disputes ────────────────────────────────────┐   │
│  │ DISP-001  Incorrect Amount  OPEN  2 days ago          │   │
│  │ DISP-003  Missing Payment   IN_REVIEW  5 days ago     │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Portal Navigation

```typescript
// lib/constants.ts — add portal routes and nav

export const routes = {
  // ... existing ...
  portal: {
    dashboard: '/portal',
    invoices: '/portal/invoices',
    invoiceDetail: (id: string) => `/portal/invoices/${id}`,
    invoiceSubmit: '/portal/invoices/submit',
    payments: '/portal/payments',
    paymentDetail: (runId: string) => `/portal/payments/${runId}`,
    remittance: (runId: string) => `/portal/payments/${runId}/remittance`,
    profile: '/portal/profile',
    bankAccounts: '/portal/bank-accounts',
    documents: '/portal/documents',
    disputes: '/portal/disputes',
    disputeNew: '/portal/disputes/new',
    disputeDetail: (id: string) => `/portal/disputes/${id}`,
    reconciliation: '/portal/reconciliation',
    wht: '/portal/wht',
    whtDetail: (id: string) => `/portal/wht/${id}`,
    compliance: '/portal/compliance',
    notificationSettings: '/portal/settings/notifications',
  },
};

export const portalNavigationItems: NavItem[] = [
  { title: 'Dashboard', href: routes.portal.dashboard, icon: 'LayoutDashboard' },
  { title: 'Invoices', href: routes.portal.invoices, icon: 'Receipt' },
  { title: 'Payments', href: routes.portal.payments, icon: 'Banknote' },
  { title: 'Documents', href: routes.portal.documents, icon: 'FolderOpen' },
  { title: 'Disputes', href: routes.portal.disputes, icon: 'MessageSquareWarning' },
  { title: 'Reconciliation', href: routes.portal.reconciliation, icon: 'GitMerge' },
  { title: 'Compliance', href: routes.portal.compliance, icon: 'ShieldCheck' },
  { title: 'Settings', href: routes.portal.notificationSettings, icon: 'Settings' },
];
```

---

## 6. Component Reuse Strategy

| ERP Component | Reuse in Portal | Notes |
|---------------|----------------|-------|
| `PageHeader` | ✅ Direct | Same breadcrumb + title pattern |
| `BusinessDocument` | ✅ Direct | Tabs + right rail for invoice detail |
| `EmptyState` | ✅ Direct | Same empty list pattern |
| `StatusBadge` | ✅ Direct | Add INCOMPLETE, OPEN, IN_REVIEW, RESOLVED, REJECTED statuses |
| `MoneyCell` | ✅ Direct | Same BigInt→string formatting |
| `DateCell` | ✅ Direct | Same date formatting |
| `AuditPanel` | ✅ Direct | Dispute timeline |
| `Table/*` | ✅ Direct | shadcn table primitives |
| `Card` | ✅ Direct | Dashboard summary cards |
| `form.tsx` (RHF) | ✅ Direct | All portal forms |
| `AppShell` | ❌ New | Portal needs its own lighter shell |
| `SidebarNav` | ⚠️ Adapt | Simpler nav, no collapsible groups |
| `DataTable` | ⚠️ Maybe | If advanced sorting/filtering needed; else plain Table |

**New shared components to build:**

| Component | Purpose |
|-----------|---------|
| `PortalShell` | Top bar + sidebar + content area for portal layout |
| `PortalSidebar` | Simplified sidebar with 8 nav items |
| `ComplianceStatusIcon` | ✅ / ⚠️ / ❌ icons for compliance items |
| `AgingChart` | Horizontal bar chart for aging buckets |
| `FileUploadZone` | Drag-and-drop zone for N7 statement + N8 document upload |
| `ReconResultsTable` | Matched / Unmatched / Statement-only tabs |

---

## 7. Development Phases

### Phase 1 — Foundation (Est. 2–3 days)

**Goal**: Portal shell, routing, auth guard, dashboard skeleton

| # | Task | Files | Deps |
|---|------|-------|------|
| 1.1 | Add portal routes to `constants.ts` | `lib/constants.ts` | — |
| 1.2 | Add `INCOMPLETE` + dispute statuses to `statusConfig` | `lib/constants.ts` | — |
| 1.3 | Create `(portal)/layout.tsx` with portal shell | layout + PortalShell | shadcn sidebar |
| 1.4 | Create `PortalShell` component | `components/portal/portal-shell.tsx` | — |
| 1.5 | Create `PortalSidebar` component | `components/portal/portal-sidebar.tsx` | — |
| 1.6 | Add portal auth middleware guard | `middleware.ts` | — |
| 1.7 | Create `features/portal/queries/portal.queries.ts` | query file | — |
| 1.8 | Create `features/portal/actions/portal.actions.ts` | action file | — |
| 1.9 | Portal dashboard page with summary cards | `(portal)/page.tsx` | N2 aging API |
| 1.10 | `loading.tsx` for portal route group | `(portal)/loading.tsx` | — |

**Deliverable**: Supplier can log in, see portal shell, view dashboard with aging + compliance summary.

### Phase 2 — Core Read Views (Est. 2–3 days)

**Goal**: Invoice list, invoice detail, payment run visibility

| # | Task | Files | Deps |
|---|------|-------|------|
| 2.1 | `portal-invoice-table.tsx` block | block | N2 API |
| 2.2 | Invoice list page with filters | `invoices/page.tsx` | 2.1 |
| 2.3 | `portal-invoice-detail-header.tsx` block | block | N2 API |
| 2.4 | Invoice detail page | `invoices/[id]/page.tsx` | 2.3 |
| 2.5 | `portal-payment-table.tsx` block | block | N2 API |
| 2.6 | Payment run list page | `payments/page.tsx` | 2.5 |
| 2.7 | Payment run detail page | `payments/[runId]/page.tsx` | N2 API |
| 2.8 | `portal-remittance-view.tsx` block | block | N4 API |
| 2.9 | Remittance advice page | `payments/[runId]/remittance/page.tsx` | 2.8 |
| 2.10 | WHT certificate list + detail | `wht/page.tsx`, `wht/[id]/page.tsx` | N5 API |

**Deliverable**: Full read-only supplier visibility — invoices, payments, remittance, WHT.

### Phase 3 — Self-Service Forms (Est. 3–4 days)

**Goal**: All write operations (submit invoice, add bank, update profile, upload doc, raise dispute)

| # | Task | Files | Deps |
|---|------|-------|------|
| 3.1 | `portal-invoice-submit-form.tsx` (multi-row + lines) | form | N1 API |
| 3.2 | Invoice submit page | `invoices/submit/page.tsx` | 3.1 |
| 3.3 | `portal-bank-account-form.tsx` + list | form + block | N3 API |
| 3.4 | Bank accounts page | `bank-accounts/page.tsx` | 3.3 |
| 3.5 | `portal-profile-form.tsx` | form | N6 API |
| 3.6 | Profile page | `profile/page.tsx` | 3.5 |
| 3.7 | `FileUploadZone` shared component | component | — |
| 3.8 | `portal-document-upload-form.tsx` + table | form + block | N8 API |
| 3.9 | Documents page | `documents/page.tsx` | 3.8 |
| 3.10 | `portal-dispute-form.tsx` | form | N9 API |
| 3.11 | Dispute create + list + detail pages | 3 pages | 3.10, N9 API |

**Deliverable**: Supplier can submit invoices, manage bank accounts, upload documents, raise disputes.

### Phase 4 — Advanced Features (Est. 2–3 days)

**Goal**: Statement reconciliation, compliance, notifications

| # | Task | Files | Deps |
|---|------|-------|------|
| 4.1 | `portal-statement-upload-form.tsx` (CSV parser) | form | — |
| 4.2 | `ReconResultsTable` component | component | — |
| 4.3 | Reconciliation page | `reconciliation/page.tsx` | N7 API |
| 4.4 | `portal-compliance-summary.tsx` block | block | N11 API |
| 4.5 | Compliance page | `compliance/page.tsx` | 4.4 |
| 4.6 | `portal-notification-form.tsx` | form | N10 API |
| 4.7 | Notification preferences page | `settings/notifications/page.tsx` | 4.6 |

**Deliverable**: Full portal feature set complete.

### Phase 5 — Polish & Testing (Est. 2 days)

| # | Task |
|---|------|
| 5.1 | Responsive design audit (mobile-first) |
| 5.2 | Loading states (`loading.tsx` for every route) |
| 5.3 | Error boundaries + `not-found.tsx` pages |
| 5.4 | Accessibility audit (keyboard nav, ARIA labels, screen reader) |
| 5.5 | Component tests (Vitest + Testing Library) |
| 5.6 | E2E smoke tests (Playwright — portal login → dashboard → invoice list → submit) |
| 5.7 | Dark mode verification |

---

## 8. Middleware — Portal Auth Guard

```typescript
// middleware.ts — add portal path matching

// Portal routes require supplier-linked auth
if (pathname.startsWith('/portal')) {
  const session = await getSession(request);
  if (!session) return redirectToLogin(request);
  
  // Verify user has supplier role (not internal admin)
  if (!session.user.supplierId) {
    return NextResponse.redirect(new URL('/forbidden', request.url));
  }
}
```

---

## 9. File Count Estimate

| Category | Count |
|----------|-------|
| **Pages** (route `page.tsx`) | 17 |
| **Loading states** | 10 |
| **Feature blocks** | 14 |
| **Feature forms** | 7 |
| **Feature queries/actions** | 2 |
| **Portal components** | 6 |
| **Constants/types updates** | 2 |
| **Middleware update** | 1 |
| **Total new files** | ~59 |

---

## 10. Backend Prerequisites

All backend services are **already implemented and tested** (N1–N11, 20 endpoints). No backend work is needed.

However, the following backend additions would improve the portal:

| Item | Description | Priority |
|------|-------------|----------|
| `GET /portal/me` | Resolve supplier from auth session | **P0** — needed for portal context |
| BigInt→string serialization | API responses serialize `bigint` as string for JSON | Already handled by `registerBigIntSerializer` |
| Supplier-user linking | `auth_user.supplierId` column or lookup table | **P0** — needed for auth guard |
| CORS portal origin | Allow portal subdomain if separate deployment | P2 |

---

## 11. Key Design Principles

1. **Supplier-scoped by default** — every query passes `supplierId` from session context, never from user input
2. **Read-heavy, write-light** — most pages are RSC server-rendered lists; forms use `useTransition` for optimistic updates
3. **Reuse ERP primitives** — `StatusBadge`, `MoneyCell`, `DateCell`, `EmptyState`, `BusinessDocument`, `Table` all shared
4. **Progressive disclosure** — dashboard shows summaries; drill-down to detail pages
5. **Mobile-responsive** — suppliers may access on mobile; all layouts must work at 375px+
6. **Audit trail** — every write action emits an outbox event (handled backend-side, visible in AuditPanel)
7. **Accessibility** — WCAG 2.1 AA compliance; all forms have labels, all tables have captions, all actions have focus management

---

## 12. Dependency Additions

No new npm dependencies needed. Everything is built with existing stack:

- **Next.js 15** — RSC + server actions
- **React Hook Form** + **Zod** — form validation
- **shadcn/ui** — all UI primitives
- **Lucide** — icons
- **Tailwind CSS** — styling
- **@afenda/contracts** — shared Zod schemas

Optional (P2):
- `papaparse` — CSV parsing for statement reconciliation (N7)
- `recharts` — aging chart visualization on dashboard
