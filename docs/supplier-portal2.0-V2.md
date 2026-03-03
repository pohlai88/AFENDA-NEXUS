# Supplier Portal 2.0 — Enterprise Trade & Payment Platform

> **Status:** Draft v2.4 — Phase 1 Complete + CAP-INV Registered | **Build:** ✅
> Finance+Web 0 TS errors (2026-03-03) | **Target:** 2026 (two-phase delivery) |
> **Owner:** Platform Team
>
> **Roadmap ID:** `supplier-portal-v2` | **Tracking prefix:** `SP-`
>
> **Phase 1 Complete (2026-03-03):** All 22 Phase 1 capabilities shipped —
> kernel 10/10 done, 22/22 capabilities with service + DB + UI + registry SP
> codes. See §0.3.

---

## 0. Tracking & Annotation System

### 0.1 Work-Item Numbering Scheme

Every **file or component** receives a **stable numeric annotation** for
traceability across tickets, commits, PRs, docs, and visual review. The scheme
is human-scannable and machine-parseable.

**Scope rule:** SP codes track _documents and files_ (schemas, tables, services,
components, test suites), **not** individual minor changes. This keeps the
registry clean and aligned with the codebase — one SP code per meaningful
deliverable, not per line-edit. Require SP codes for:

- **Kernel + cross-cutting concerns** (1000–1999) — always tracked
- **Capability milestones** — each CAP-\* has at least one SP per layer it
  touches
- **New files/components** — any new `.ts`/`.tsx` file that ships a distinct
  unit

For small UI-only tweaks, bug fixes within an existing SP file, or style
adjustments, use normal tickets without SP codes. The registry stays valuable
without becoming red tape.

**Format:** `SP-{LAYER}{SEQ}[-{EXT}][{REV}]`

| Segment   | Meaning                                                      | Examples                                                                                                                                                             |
| --------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SP-`     | Supplier Portal prefix (global namespace)                    | —                                                                                                                                                                    |
| `{LAYER}` | 4-digit series per architectural layer                       | `1001` = Kernel, `2001` = Contract, `3001` = DB, `4001` = Domain, `5001` = App/Service, `6001` = Route/Infra, `7001` = Frontend, `8001` = Test, `9001` = Doc/OpenAPI |
| `{SEQ}`   | Sequential within layer (1001, 1002, 1003…)                  | `SP-1001` = Kernel identity, `SP-1002` = Kernel permissions                                                                                                          |
| `-{EXT}`  | Extension / sub-task (`-01`, `-02`)                          | `SP-1001-01` = extend `resolveSupplierIdentity()`                                                                                                                    |
| `{REV}`   | Revision suffix (`a`, `b`, `c`) for updates to shipped items | `SP-1001a` = revision to kernel identity after initial delivery                                                                                                      |

**Layer series allocation:**

| Series        | Layer                                  | Package / Location                                                  |
| ------------- | -------------------------------------- | ------------------------------------------------------------------- |
| **1000–1099** | Kernel (shared infrastructure)         | `packages/supplier-kernel/`                                         |
| **2000–2099** | Contracts (Zod schemas)                | `packages/contracts/src/portal/`                                    |
| **3000–3099** | DB Schema (Drizzle tables, migrations) | `packages/db/src/schema/portal-*`                                   |
| **4000–4099** | Domain (pure logic, calculators)       | `packages/supplier-kernel/src/domain/`                              |
| **5000–5099** | Application (services, ports)          | `packages/modules/finance/src/slices/ap/services/supplier-portal-*` |
| **6000–6099** | Infrastructure (routes, adapters)      | `packages/modules/finance/src/slices/ap/routes/supplier-portal-*`   |
| **7000–7099** | Frontend (pages, components)           | `apps/web/src/app/(supplier-portal)/`                               |
| **8000–8099** | Tests (unit, integration, E2E)         | `packages/modules/finance/src/__tests__/`, `apps/e2e/`              |
| **9000–9099** | Documentation (README, OpenAPI, audit) | `docs/`, OpenAPI spec                                               |

**Capability codes** (product-level, for sprint boards and briefs):

| Code           | Feature                             | P#  | Phase |
| -------------- | ----------------------------------- | --- | ----- |
| `CAP-ONB`      | Onboarding Wizard                   | P1  | 1     |
| `CAP-PAY-ETA`  | Real-Time Payment Tracking          | P2  | 1     |
| `CAP-SCF`      | Early Payment / Dynamic Discounting | P3  | 1     |
| `CAP-SCORE`    | Supplier Performance Scorecard      | P4  | 2     |
| `CAP-MSG`      | Messaging Hub                       | P5  | 1     |
| `CAP-POFLIP`   | PO Flip / Order Confirmation        | P6  | 2     |
| `CAP-3WAY`     | 3-Way Match (GR side)               | P7  | 2     |
| `CAP-COMPL`    | Compliance & Certificate Mgmt       | P8  | 1     |
| `CAP-MULTI`    | Multi-Entity Portal View            | P9  | 1     |
| `CAP-CATALOG`  | Catalog / Price List                | P10 | 2     |
| `CAP-PWA`      | Mobile-Responsive PWA               | P11 | 1     |
| `CAP-BRAND`    | White-Label Portal Branding         | P12 | 1     |
| `CAP-BULK`     | Bulk Invoice Upload                 | P13 | 1     |
| `CAP-AUDIT`    | Audit Trail / Activity Log          | P14 | 1     |
| `CAP-CRDB`     | Credit Note / Debit Note            | P15 | 1     |
| `CAP-SEARCH`   | Advanced Search, Filter, Pagination | P16 | 1     |
| `CAP-PERSONA`  | Contractor & Lease Variants         | P17 | 2     |
| `CAP-API`      | Webhook / API Access                | P18 | 1     |
| `CAP-SOS`      | Breakglass Escalation               | P19 | 1     |
| `CAP-CASE`     | Case Management                     | P20 | 1     |
| `CAP-MATCH`    | 3-Way Match Resolution Screen       | P21 | 1+2   |
| `CAP-LOC`      | Company Location Directory          | P22 | 1     |
| `CAP-DIR`      | Senior Management Directory         | P23 | 1     |
| `CAP-ANNOUNCE` | Dashboard Announcements             | P24 | 1     |
| `CAP-PROOF`    | Tamper-Evident Communication Log    | P25 | 1     |
| `CAP-VAULT`    | Document Vault (enhanced)           | P26 | 1     |
| `CAP-APPT`     | Appointment Scheduling              | P27 | 1     |
| `CAP-BANK`     | Bank Account Self-Service           | P28 | 1     |
| `CAP-NOTIF`    | Notification Preferences            | P29 | 1     |
| `CAP-PROFILE`  | Supplier Profile Self-Service       | P30 | 1     |
| `CAP-RECON`    | Statement Reconciliation            | P31 | 1     |
| `CAP-VIS`      | Portal Visibility / Dashboard Data  | P32 | 1     |
| `CAP-WHT`      | Withholding Tax Certificates        | P33 | 1     |
| `CAP-INV`      | Supplier Invitation Flow            | P34 | 1     |

### 0.2 Registry

A `portal-registry.ts` file in `packages/supplier-kernel/src/` maintains a
machine-readable map:

```typescript
export const PORTAL_REGISTRY = {
  'SP-1001': {
    cap: 'KERNEL',
    title: 'Portal Identity & Tenancy',
    status: 'planned',
    phase: '1.0',
  },
  'SP-1002': {
    cap: 'KERNEL',
    title: 'Portal Permissions Model',
    status: 'planned',
    phase: '1.0',
  },
  'SP-1003': {
    cap: 'KERNEL',
    title: 'Status Dictionary',
    status: 'planned',
    phase: '1.0',
  },
  'SP-1004': {
    cap: 'KERNEL',
    title: 'Notification Backbone',
    status: 'planned',
    phase: '1.0',
  },
  'SP-1005': {
    cap: 'KERNEL',
    title: 'Audit Log Middleware',
    status: 'planned',
    phase: '1.0',
  },
  'SP-1006': {
    cap: 'KERNEL',
    title: 'Proof Chain Writer',
    status: 'planned',
    phase: '1.0',
  },
  'SP-1007': {
    cap: 'KERNEL',
    title: 'Attachment Policy',
    status: 'planned',
    phase: '1.0',
  },
  'SP-1008': {
    cap: 'KERNEL',
    title: 'Case ID Generator',
    status: 'planned',
    phase: '1.0',
  },
  'SP-1009': {
    cap: 'KERNEL',
    title: 'Idempotency Standard',
    status: 'planned',
    phase: '1.0',
  },
  'SP-1010': {
    cap: 'KERNEL',
    title: 'PortalRequestContext',
    status: 'planned',
    phase: '1.0',
  },
  'SP-2001': {
    cap: 'CAP-CASE',
    title: 'Case Contracts (Zod)',
    status: 'planned',
    phase: '1.1',
  },
  'SP-3001': {
    cap: 'CAP-CASE',
    title: 'supplier_case Table',
    status: 'planned',
    phase: '1.1',
  },
  // ... extends as work items are added
} as const;
```

**Usage in commits/PRs:** `feat(SP-1001): wire portal identity resolver` **Usage
in JIRA/Linear:** ticket title includes `[SP-1001]` **Usage in code:**
`// SP-1006: proof chain entry for case status transition`

> **Guideline:** If a change only touches an existing SP-tracked file (e.g., a
> bug fix in SP-1003's Status Dictionary), reference the existing SP code in the
> commit message — don't mint a new one. New SP codes are for **new files or
> components**, not patches.

---

### 0.3 Codebase Audit — 2026-03-03 (Updated: Phase 1 Complete)

Actual implementation state verified against
`packages/supplier-kernel/src/portal-registry.ts`, `packages/db/src/schema/`,
`packages/modules/finance/src/slices/ap/services/`, and
`apps/web/src/app/(supplier-portal)/portal/`.

**Legend:** ✅ All layers done | 🔶 Service + DB done, registry gaps | 🔲 Not
started

#### Phase 1 — Kernel (1000-series)

| SP Code | Title                 | Status  |
| ------- | --------------------- | ------- |
| SP-1001 | Portal Identity       | ✅ done |
| SP-1002 | Permissions Model     | ✅ done |
| SP-1003 | Status Dictionary     | ✅ done |
| SP-1004 | Notification Backbone | ✅ done |
| SP-1005 | Audit Log Middleware  | ✅ done |
| SP-1006 | Proof Chain Writer    | ✅ done |
| SP-1007 | Attachment Policy     | ✅ done |
| SP-1008 | Case ID Generator     | ✅ done |
| SP-1009 | Idempotency Standard  | ✅ done |
| SP-1010 | PortalRequestContext  | ✅ done |

**Kernel completion: 10/10 (100%)**

#### Phase 1 — Capabilities

| CAP            | DB Schema                           | Service File                             | Tests   | Frontend Page                | Status                                       |
| -------------- | ----------------------------------- | ---------------------------------------- | ------- | ---------------------------- | -------------------------------------------- |
| `CAP-ONB`      | `portal-onboarding.ts` ✅           | `supplier-portal-onboarding.ts` ✅       | ✅      | `onboarding/` ✅             | ✅ done                                      |
| `CAP-PAY-ETA`  | `portal-payment-status.ts` ✅       | `supplier-portal-payment-tracking.ts` ✅ | —       | `payments/` ✅               | ✅ done                                      |
| `CAP-SCF`      | `early_payment_offer` ✅            | `supplier-portal-scf.ts` ✅              | —       | `early-payment/` ✅          | ✅ done (SP-5014, SP-6004, SP-7009 minted)   |
| `CAP-MSG`      | `portal-messaging.ts` ✅            | `supplier-portal-messaging.ts` ✅        | ✅      | `messages/` ✅               | ✅ done (SP-5007, SP-6002, SP-7003 minted)   |
| `CAP-COMPL`    | `portal-compliance-alert.ts` ✅     | `supplier-portal-compliance.ts` ✅       | ✅      | `compliance/` ✅             | ✅ done                                      |
| `CAP-MULTI`    | — (session-scoped)                  | `supplier-portal-multi-entity.ts` ✅     | —       | `PortalEntitySwitcher` ✅    | ✅ done (SP-5022, SP-7016)                   |
| `CAP-PWA`      | — (manifest)                        | — (PWA infra pre-existing)               | —       | `manifest.json` ✅           | ✅ done (SP-7014, portal shortcuts+fields)   |
| `CAP-BRAND`    | `portal-brand-config.ts` ✅         | `supplier-portal-brand.ts` ✅            | —       | `TenantBrandStyle` ✅        | ✅ done (SP-3014, SP-5020, SP-7013)          |
| `CAP-BULK`     | —                                   | `supplier-portal-bulk-upload.ts` ✅      | —       | bulk-upload UI ✅            | ✅ done                                      |
| `CAP-AUDIT`    | `audit.ts` ✅                       | `supplier-portal-audit.ts` ✅            | ✅      | `activity/` ✅               | ✅ done                                      |
| `CAP-CRDB`     | —                                   | `supplier-portal-crdb.ts` ✅             | —       | credit/debit form ✅         | ✅ done                                      |
| `CAP-SEARCH`   | — (URL search params)               | — (filter params in queries layer)       | —       | filter bars + pagination ✅  | ✅ done (SP-7012, invoice+case filters)      |
| `CAP-API`      | `portal-webhook-subscription.ts` ✅ | `supplier-portal-webhook.ts` ✅          | —       | `settings/api/` ✅           | ✅ done (SP-3012, SP-5021, SP-6010, SP-7015) |
| `CAP-SOS`      | `portal-escalation.ts` ✅           | `supplier-portal-escalation.ts` ✅       | ✅      | `escalations/` ✅            | ✅ done (SP-5008, SP-6003, SP-7004 minted)   |
| `CAP-CASE`     | `portal-case.ts` ✅                 | `supplier-portal-case.ts` ✅             | ✅      | `cases/` ✅                  | ✅ done (E2E pending SP-8011)                |
| `CAP-MATCH`    | —                                   | —                                        | —       | match resolution ✅          | ✅ done (AP-side)                            |
| `CAP-LOC`      | `portal-location-directory.ts` ✅   | `supplier-portal-location.ts` ✅         | ✅      | `company/` ✅                | ✅ done (SP-2008, SP-5009 minted)            |
| `CAP-DIR`      | —                                   | `supplier-portal-directory.ts` ✅        | ✅      | `directory/` ✅              | ✅ done (SP-2009, SP-5017 minted)            |
| `CAP-ANNOUNCE` | `portal-announcement.ts` ✅         | `supplier-portal-announcement.ts` ✅     | —       | `announcements/` ✅          | ✅ done (SP-2010, SP-5010 minted)            |
| `CAP-PROOF`    | `portal-communication-proof` ✅     | `TamperResistantOutboxWriter` ✅         | planned | `verification/` ✅           | ✅ done (property tests pending SP-8022)     |
| `CAP-VAULT`    | —                                   | `supplier-portal-document-vault.ts` ✅   | —       | `documents/` ✅              | ✅ done (SP-5018, SP-6008, SP-7007 minted)   |
| `CAP-APPT`     | `portal-meeting-request.ts` ✅      | `supplier-portal-appointment.ts` ✅      | —       | `appointments/` ✅           | ✅ done (SP-2012, SP-5019 minted)            |
| `CAP-BANK`     | — (uses supplier tables)            | `supplier-portal-bank-account.ts` ✅     | —       | `bank-accounts/` ✅          | ✅ done (SP-5023, SP-6014, SP-7017)          |
| `CAP-NOTIF`    | — (prefs in supplier row)           | `supplier-portal-notifications.ts` ✅    | —       | `settings/notifications/` ✅ | ✅ done (SP-5025, SP-7018)                   |
| `CAP-PROFILE`  | — (uses supplier tables)            | `supplier-portal-profile.ts` ✅          | —       | `profile/` ✅                | ✅ done (SP-5026, SP-7019)                   |
| `CAP-RECON`    | — (uses invoice/payment tables)     | `supplier-portal-statement-recon.ts` ✅  | —       | `reconciliation/` ✅         | ✅ done (SP-5028, SP-7020)                   |
| `CAP-VIS`      | — (reads invoice/payment/aging)     | `supplier-portal-visibility.ts` ✅       | —       | invoices / payments / aging  | ✅ done (SP-5036)                            |
| `CAP-WHT`      | — (uses wht_certificate tables)     | `supplier-portal-wht.ts` ✅              | —       | `wht/[id]/` ✅               | ✅ done (SP-5029, SP-7021)                   |
| `CAP-INV`      | — (uses supplier/token tables)      | `supplier-portal-invitation.ts` ✅       | —       | `onboarding/` ✅             | ✅ done (SP-5030, SP-8021)                   |

> **Note:** CAP-BULK extended with SP-5024 (`supplier-portal-invoice-submit.ts`)
> covering the single-path invoice submit route (`invoices/submit/`). **Note:**
> CAP-PAY-ETA extended with SP-5027 (`supplier-portal-remittance.ts`) covering
> remittance advice download (`payments/[runId]/remittance/`).

**Phase 1 scorecard:**

- ✅ Fully done + registered: **30/30 capabilities** — Phase 1 100% complete
- 🔶 Backend done, registry gaps: **0** (all resolved)
- 🔲 Not started: **0**
- 🗑️ Dispute system: **DELETED** (replaced by Case Management)

**Work completed in this session:**

1. Minted ~55 missing SP codes (all series) in `portal-registry.ts`
2. **CAP-SEARCH** — `PortalInvoiceFilterBar` + `PortalCaseFilterBar` +
   invoice/case page pagination
3. **CAP-BRAND** — `portal-brand-config.ts` DB schema +
   `supplier-portal-brand.ts` service + `TenantBrandStyle` component + layout
   wiring
4. **CAP-PWA** — `manifest.json` updated with portal shortcuts, orientation,
   lang/dir
5. **CAP-API** — `portal-webhook-subscription.ts` schema +
   `supplier-portal-webhook.ts` service + CRUD Fastify routes +
   `PortalWebhookList` component + `settings/api/page.tsx`
6. **CAP-MULTI** — `supplier-portal-multi-entity.ts` service +
   `PortalEntitySwitcher` combobox + `PortalShell` + layout integration

**Pending test items:** SP-8011 (Case E2E), SP-8020 (SoD Gate Script), SP-8022
(Proof Chain Property Tests), SP-8025 (Supplier-Safe Language Gate)

**All Phase 1 gaps resolved. Remaining actions:**

1. **Test suites**: Execute SP-8011 (Case E2E), SP-8022 (Proof Chain property
   tests), SP-8020 (SoD Gate), SP-8025 (Supplier-Safe Language Gate)
2. **Phase 2 scoping**: Begin procurement domain assessment for CAP-SCORE,
   CAP-POFLIP, CAP-3WAY, CAP-CATALOG, CAP-PERSONA

---

### 0.4 Gap & Drift Report — 2026-03-03

Findings from filesystem audit vs `portal-registry.ts` and this document.

#### A. Registry Gaps — Unregistered Services & Routes (✅ Fixed)

All 8 previously unregistered services have been classified and minted into
`portal-registry.ts`.

| Service File                         | CAP Assigned      | SP Codes Minted           |
| ------------------------------------ | ----------------- | ------------------------- |
| `supplier-portal-bank-account.ts`    | `CAP-BANK`        | SP-5023, SP-6014, SP-7017 |
| `supplier-portal-invoice-submit.ts`  | `CAP-BULK` ext    | SP-5024                   |
| `supplier-portal-notifications.ts`   | `CAP-NOTIF`       | SP-5025, SP-7018          |
| `supplier-portal-profile.ts`         | `CAP-PROFILE`     | SP-5026, SP-7019          |
| `supplier-portal-remittance.ts`      | `CAP-PAY-ETA` ext | SP-5027                   |
| `supplier-portal-statement-recon.ts` | `CAP-RECON`       | SP-5028, SP-7020          |
| `supplier-portal-visibility.ts`      | `CAP-VIS`         | SP-5036                   |
| `supplier-portal-wht.ts`             | `CAP-WHT`         | SP-5029, SP-7021          |

#### B. Legacy Drift — Dispute System (✅ Deleted)

The dispute system has been **fully removed** and replaced by Case Management
(`CAP-CASE`). All dispute files deleted 2026-03-03:

| Item                                 | Action                   |
| ------------------------------------ | ------------------------ |
| `supplier-portal-dispute.ts` service | ✅ Deleted               |
| `portal/disputes/` route group       | ✅ Deleted               |
| `portal/disputes/new/`               | ✅ Deleted               |
| `portal/disputes/[id]/`              | ✅ Deleted               |
| Dispute Zod schemas                  | Retained as type aliases |

> Dispute Zod schemas are kept temporarily as aliases for any in-flight clients.
> They can be removed once `CAP-CASE` contracts are the sole reference across
> all consumers.

#### C. Registry Code Drift — SP-3014 (Fixed)

`portal-brand-config.ts` DB schema was referenced in §0.3 as "SP-3014" but the
entry was missing from `portal-registry.ts`. **Fixed in this session** — SP-3014
entry added with `status: 'done'`.

#### D. Document Drift — §2.1 Stale Statuses (Fixed)

The following §2.1 rows were stale prior to this revision (all corrected above):

| CAP          | Old §2.1 Status               | Actual Codebase State                              |
| ------------ | ----------------------------- | -------------------------------------------------- |
| `CAP-SCF`    | 🔶 Backend done, no UI page   | ✅ `payments/early-payment/` exists, SP-7009 done  |
| `CAP-MSG`    | 🔶 Done, registry gaps        | ✅ All SP codes minted (SP-5007, SP-6002, SP-7003) |
| `CAP-MULTI`  | 🔲 Not started                | ✅ SP-5022, SP-7016 done                           |
| `CAP-PWA`    | 🔲 Not started                | ✅ SP-7014 done                                    |
| `CAP-BRAND`  | 🔲 Not started                | ✅ SP-3014, SP-5020, SP-7013 done                  |
| `CAP-API`    | 🔲 Not started                | ✅ SP-3012, SP-5021, SP-6010, SP-7015 done         |
| `CAP-SOS`    | 🔶 Done, registry gaps        | ✅ All SP codes done including SP-8014             |
| `CAP-SEARCH` | 🔲 Not started (routes wired) | ✅ SP-7012 done                                    |

#### E. Open Test Debt (planned SP items)

| SP Code | Description                 | Priority  |
| ------- | --------------------------- | --------- |
| SP-8011 | Case E2E Tests              | 🔴 High   |
| SP-8020 | SoD Gate Script             | 🔴 High   |
| SP-8022 | Proof Chain Property Tests  | 🔴 High   |
| SP-8025 | Supplier-Safe Language Gate | 🟡 Medium |

#### F. Phase 1 Completion Fixes — v2.4 Session (Fixed)

All items below were discovered in the v2.4 audit pass and resolved in the same
session:

| Item                                                              | Status   | Detail                                                                        |
| ----------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| Dispute imports in `supplier-portal-routes.ts`                    | ✅ Fixed | `SupplierPortalCreateDisputeSchema` + service import removed; 0 TS errors     |
| Dispute route handlers (N9 block, 3 endpoints)                    | ✅ Fixed | Full N9 block removed from routes file; N10 now follows N8 directly           |
| Stale route constants (`disputes`, `disputeNew`, `disputeDetail`) | ✅ Fixed | Removed from `routes.portal` in `constants.ts`                                |
| Disputes sidebar nav item                                         | ✅ Fixed | Removed from `portalNavigationItems`; `MessageSquareWarning` icon removed     |
| Missing nav items (Bank Accounts, Profile, WHT)                   | ✅ Fixed | Added to `portalNavigationItems` with `Landmark`, `UserCog`, `FileText` icons |
| `MessageSquareWarning` icon in `portal-sidebar.tsx`               | ✅ Fixed | Removed from import and `iconMap`; `Landmark/UserCog/FileText` added          |
| CAP-INV (P34) unregistered                                        | ✅ Fixed | SP-5030 minted in `portal-registry.ts`; §0.1/§0.3/§2.1 updated; 30/30 score   |

---

## 1. Vision & Strategic Context

### 1.1 What exists today (Portal v1)

| Layer      | Inventory                                                                 |
| ---------- | ------------------------------------------------------------------------- |
| Backend    | 11 services (N1–N11), 17+ Fastify endpoints, all with `requirePermission` |
| DB         | 24 supplier tables with RLS, full MDM model                               |
| Frontend   | 38 pages (19 unique + `loading.tsx` pairs), 23 feature files              |
| Contracts  | ~20 portal-specific + ~15 MDM Zod schemas                                 |
| Tests      | 2 files (1,796 lines), N1–N11 unit tests with mock repos                  |
| Shell      | Dedicated `(supplier-portal)` route group, own sidebar/topbar             |
| Events     | 11 domain events (`SUPPLIER_*`) registered in `events.ts`                 |
| Navigation | 8 sidebar items: Dashboard–Settings                                       |

### 1.2 The two-phase rationale

The codebase has a **fully built AP module** but **no procurement domain**.
Building procurement-dependent features (PO Flip, Catalog, Sourcing) on top of a
missing domain creates projection tables, lifecycle mismatches, and throwaway
code. Therefore:

| Phase       | Name                            | Depends on                       | Timeline                       | Description                                                                                                                                                                          |
| ----------- | ------------------------------- | -------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Phase 1** | **AP-Anchored Portal**          | Existing AP module (fully dev)   | 13 weeks                       | Everything a supplier needs to interact with Accounts Payable: invoices, payments, reconciliation, cases, messaging, compliance, document vault, onboarding, audit trail, API access |
| **Phase 2** | **Procurement-Anchored Portal** | Procurement module (not started) | After procurement module ships | PO Flip, Catalog Management, Sourcing, Goods Receipt visibility, Supplier Evaluation Scorecard, Contractor/Lease variants                                                            |

Phase 1 delivers a **complete, production-ready** portal grounded in finance
truth. Phase 2 extends it with procurement capabilities when the domain exists.

### 1.3 Where we're going

**Trade & payment communication platform** — serving suppliers, contractors, and
leasers as internal and external partners. Free for suppliers, driving AP module
stickiness. Benchmarking against SAP Ariba, Coupa, Tipalti, Bill.com, Taulia,
and C2FO.

---

## 2. Feature Classification

### 2.1 Phase 1: AP-Anchored (13 weeks after kickoff)

| #       | CAP            | Feature                                   | Class             | Status                                       | Rationale                                                                                        |
| ------- | -------------- | ----------------------------------------- | ----------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **P1**  | `CAP-ONB`      | Supplier Onboarding Wizard                | **ESSENTIAL**     | ✅ Done                                      | DB has `supplierOnboardingStatusEnum` but zero UI. Coupa/Ariba's #1 value prop.                  |
| **P2**  | `CAP-PAY-ETA`  | Real-Time Payment Tracking & ETA          | **SILENT KILLER** | ✅ Done                                      | Suppliers' #1 complaint. Tipalti/Bill.com differentiate here. Currently static payment-run list. |
| **P3**  | `CAP-SCF`      | Early Payment / Dynamic Discounting       | **SILENT KILLER** | ✅ Done (SP-5014, SP-6004, SP-7009)          | Taulia/C2FO's model. No mid-market ERP offers this integrated. Genuine moat.                     |
| **P5**  | `CAP-MSG`      | Messaging Hub (two-way communication)     | **ESSENTIAL**     | ✅ Done (SP-5007, SP-6002, SP-7003)          | Roadmap mentions "communication hub." Currently disputes are the only channel.                   |
| **P8**  | `CAP-COMPL`    | Compliance & Certificate Management       | **ESSENTIAL**     | ✅ Done                                      | DB has `supplier_compliance_item` with statuses. Missing: automated reminders, renewal workflow. |
| **P9**  | `CAP-MULTI`    | Multi-Entity / Multi-Company Portal View  | **GOOD TO HAVE**  | ✅ Done (SP-5022, SP-7016)                   | Supplier trades with 3 entities → unified view. Currently single-scope.                          |
| **P11** | `CAP-PWA`      | Mobile-Responsive PWA                     | **ESSENTIAL**     | ✅ Done (SP-7014)                            | 40%+ supplier users on mobile. Desktop-first layout today.                                       |
| **P12** | `CAP-BRAND`    | White-Label Portal Branding               | **GOOD TO HAVE**  | ✅ Done (SP-3014, SP-5020, SP-7013)          | Buyer's logo/colors on portal. Low effort with CSS variables.                                    |
| **P13** | `CAP-BULK`     | Bulk Invoice Upload (CSV/Excel/E-Invoice) | **ESSENTIAL**     | ✅ Done                                      | Current submit is single. Enterprise suppliers send hundreds/month.                              |
| **P14** | `CAP-AUDIT`    | Audit Trail / Activity Log (self-service) | **ESSENTIAL**     | ✅ Done                                      | Required for SOX/ISAE. Finance has activity feed — portal has nothing.                           |
| **P15** | `CAP-CRDB`     | Credit Note / Debit Note Submission       | **ESSENTIAL**     | ✅ Done                                      | Backend e-invoice builder already supports credit/debit notes.                                   |
| **P16** | `CAP-SEARCH`   | Advanced Search, Filtering, Pagination    | **ESSENTIAL**     | ✅ Done (SP-7012)                            | Portal queries accept params but UI doesn't wire them.                                           |
| **P18** | `CAP-API`      | Webhook / API Access for Suppliers        | **SILENT KILLER** | ✅ Done (SP-3012, SP-5021, SP-6010, SP-7015) | Enterprise suppliers want API, not portal clicks.                                                |
| **P19** | `CAP-SOS`      | Breakglass Escalation (SOS button)        | **ESSENTIAL**     | ✅ Done (SP-5008, SP-6003, SP-7004, SP-8014) | Supplier's lifeline when standard channels fail.                                                 |
| **P20** | `CAP-CASE`     | Case Management (upgrade from "disputes") | **ESSENTIAL**     | ✅ Done (E2E pending)                        | Structured ticket system replacing simple disputes.                                              |
| **P21** | `CAP-MATCH`    | 3-Way Match Resolution Screen (AP-side)   | **ESSENTIAL**     | ✅ Done (AP-side)                            | Multi-persona resolution workspace.                                                              |
| **P22** | `CAP-LOC`      | Company Location / Address Directory      | **ESSENTIAL**     | ✅ Done (SP-2008, SP-5009)                   | Supplier needs buyer's delivery/billing addresses.                                               |
| **P23** | `CAP-DIR`      | Senior Management Directory               | **ESSENTIAL**     | ✅ Done (SP-2009, SP-5017)                   | Government-body inspired contact directory.                                                      |
| **P24** | `CAP-ANNOUNCE` | Dashboard Announcements / Pinned Messages | **ESSENTIAL**     | ✅ Done (SP-2010, SP-5010)                   | Company banner, service closures, policy changes.                                                |
| **P25** | `CAP-PROOF`    | Tamper-Evident Communication Log          | **SILENT KILLER** | ✅ Done (property tests pending SP-8022)     | Audit-grade proof of record for all portal comms.                                                |
| **P26** | `CAP-VAULT`    | Document Vault (enhanced)                 | **ESSENTIAL**     | ✅ Done (SP-5018, SP-6008, SP-7007)          | Contract lifecycle, version history, dual-party sharing.                                         |
| **P27** | `CAP-APPT`     | Appointment Scheduling                    | **GOOD TO HAVE**  | ✅ Done (SP-2012, SP-5019)                   | Meeting booking with buyer-side contacts.                                                        |
| **P28** | `CAP-BANK`     | Bank Account Self-Service                 | **ESSENTIAL**     | ✅ Done (SP-5023, SP-6014, SP-7017)          | Suppliers manage their own remittance bank accounts via portal.                                  |
| **P29** | `CAP-NOTIF`    | Notification Preferences                  | **ESSENTIAL**     | ✅ Done (SP-5025, SP-7018)                   | Suppliers configure email/webhook event preferences.                                             |
| **P30** | `CAP-PROFILE`  | Supplier Profile Self-Service             | **ESSENTIAL**     | ✅ Done (SP-5026, SP-7019)                   | Suppliers update remittance email, contact, restricted fields.                                   |
| **P31** | `CAP-RECON`    | Statement Reconciliation                  | **ESSENTIAL**     | ✅ Done (SP-5028, SP-7020)                   | Supplier reconciles AP ledger against their own statement.                                       |
| **P32** | `CAP-VIS`      | Portal Visibility / Dashboard Data        | **ESSENTIAL**     | ✅ Done (SP-5036)                            | Core invoice/payment/aging read layer powering the portal dashboard.                             |
| **P33** | `CAP-WHT`      | Withholding Tax Certificate Access        | **ESSENTIAL**     | ✅ Done (SP-5029, SP-7021)                   | Suppliers view their WHT certificates and exemption status.                                      |
| **P34** | `CAP-INV`      | Supplier Invitation Flow                  | **ESSENTIAL**     | ✅ Done (SP-5030, SP-8021)                   | Buyer-initiated magic-link invitation for supplier onboarding (Phase 1.1.7).                     |

### 2.2 Phase 2: Procurement-Anchored (after procurement module ships)

| #       | CAP           | Feature                                           | Class            | Rationale                                                            |
| ------- | ------------- | ------------------------------------------------- | ---------------- | -------------------------------------------------------------------- |
| **P6**  | `CAP-POFLIP`  | PO Flip / Order Confirmation                      | **ESSENTIAL**    | Requires procurement PO domain — projections are fragile without it. |
| **P7**  | `CAP-3WAY`    | Goods Receipt / 3-Way Match (procurement-side GR) | **GOOD TO HAVE** | GR data comes from procurement/warehouse domain.                     |
| **P4**  | `CAP-SCORE`   | Supplier Performance Scorecard & Analytics        | **GOOD TO HAVE** | DB tables exist but evaluation criteria are procurement-defined.     |
| **P10** | `CAP-CATALOG` | Catalog / Price List Management                   | **GOOD TO HAVE** | Requires procurement sourcing domain.                                |
| **P17** | `CAP-PERSONA` | Contractor & Lease Portal Variants                | **GOOD TO HAVE** | Persona explosion risk — validate Phase 1 first.                     |

### 2.3 Ad-Hoc Ideas — Evaluation

#### P19 `CAP-SOS`: Breakglass Escalation (SOS Button) — **STRONG YES**

> _"Supplier's SOS button to find next level or top management if dispute,
> payment, anything didn't get response. A dedicated senior manager assigned,
> similar to Relationship Manager."_

**Verdict: ESSENTIAL.** This is a genuine differentiator. No mid-market ERP
portal has this. It transforms the portal from a "submit and hope" window into a
**guaranteed resolution channel**. Think of it as SWIFT's complaint escalation
or FCA's "final response" mechanism.

**Implementation model:**

| Concept             | Detail                                                                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trigger**         | Supplier clicks "Escalate" on any case/invoice/payment that has been unresolved for >N days (configurable SLA). Also available as a manual SOS button in the portal header.        |
| **Auto-assignment** | System assigns a senior manager from the buyer's escalation roster (`portal_directory_entry WHERE isEscalationContact = true`). Round-robin or least-loaded.                       |
| **SLA clock**       | Escalated case gets a hard SLA (e.g., 48h response, 5-day resolution). Countdown visible to both parties. Breach → auto-notify next level up.                                      |
| **Visibility**      | Supplier sees: assigned manager's name/title/email, SLA countdown, case timeline. Manager sees: all case history, supplier's full context (recent invoices, payments, compliance). |
| **SoD**             | `PORTAL_READONLY` suppliers **cannot** trigger breakglass — requires `ESCALATE` permission from `PORTAL_OWNER` or `PORTAL_FINANCE` role.                                           |
| **Audit**           | Every escalation creates an immutable proof-chain entry (`SP-1006`).                                                                                                               |

**Why it works in this codebase:** The tamper-resistant outbox already has
SHA-256 hash-chain integrity. The `supplier_contact` table already has `role`
enum including `EXECUTIVE`. The notification backbone (`SP-1004`) delivers to
the right people. This is infrastructure-ready — the gap is the workflow + UI.

---

#### P20 `CAP-CASE`: Case Management (replacing "disputes") — **STRONG YES**

> _"Replace or upgrade 'dispute' to 'usecase' or 'case' with specific ticket
> number, that such case can serve for training or upgrading purpose in the
> future."_

**Verdict: ESSENTIAL.** The current dispute model
(`OPEN → IN_REVIEW → RESOLVED → REJECTED`, 7 categories) is too limited for
enterprise.

| Current (dispute)             | Upgraded (case)                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 4 statuses                    | 8 statuses: `DRAFT → SUBMITTED → ASSIGNED → IN_PROGRESS → AWAITING_INFO → RESOLVED → CLOSED → REOPENED`                       |
| 7 hardcoded categories        | Extensible category taxonomy: payment, invoice, compliance, delivery, quality, onboarding, general, **escalation** (from P19) |
| No ticket number              | Auto-generated ticket: `CASE-{TENANT_SHORT}-{YYYY}-{SEQ}` (e.g., `CASE-AFD-2026-00142`)                                       |
| No assignment                 | Assigned resolver (buyer-side), optional co-assignees                                                                         |
| No SLA                        | SLA per category + priority. Timer visible to supplier.                                                                       |
| Single resolution text        | Resolution + root cause + corrective action fields (training/audit data)                                                      |
| No knowledge base             | Closed cases (anonymized) can be tagged for FAQ/knowledge base extraction                                                     |
| Links to invoice/payment only | Links to any portal entity: invoice, payment, PO, document, compliance item                                                   |
| Separate from messages        | **Unified timeline** (see §2.4)                                                                                               |

**Migration:** The existing `supplier_dispute` table (19 columns, 2 indexes) is
small. Add new `supplier_case` table alongside, migrate existing disputes as
cases, deprecate dispute endpoints with 301 redirects. Keep the dispute Zod
schemas as aliases during transition.

---

#### P21 `CAP-MATCH`: 3-Way Match Resolution Screen — **STRONG YES (reimagined)**

> _"3-way matching will involve 3 internal + external. Internal: warehouse GRN,
> procurement PO, invoice finance/account. Hence dedicated persona assigned to
> resolve dispute or follow up status in the same screen."_

**Verdict: ESSENTIAL — Phase 1 AP-side first, Phase 2 completes procurement
side.**

| Column               | Phase | Persona                | What they resolve                                       |
| -------------------- | ----- | ---------------------- | ------------------------------------------------------- |
| **Invoice (AP)**     | 1     | AP clerk / AP manager  | Amount discrepancies, duplicate invoices, tax issues    |
| **Supplier**         | 1     | Supplier (portal user) | Missing docs, incorrect references, amount confirmation |
| **GR (Warehouse)**   | 2     | Warehouse/receiving    | Quantity received vs ordered, quality issues, damage    |
| **PO (Procurement)** | 2     | Procurement officer    | PO terms, pricing, delivery schedule                    |

**Key design:** Each column shows its own status + actions. The case
(`CAP-CASE`) is the umbrella. The resolution screen is a case detail view with
dedicated columns per persona. All actions feed the **unified case timeline**
(§2.4).

---

#### P22 `CAP-LOC`: Company Location / Address Directory — **YES**

**Implementation:**

- New `portal_company_location` projection table (or read from existing `entity`
  table if entity addresses exist)
- Portal page `/portal/company/locations` — map view + list with address cards
- Each location shows: type (HQ, warehouse, billing), primary contact, business
  hours
- Links from invoice/case screens: "View delivery address" → location card

---

#### P23 `CAP-DIR`: Senior Management Directory — **YES (with guard rails)**

**Implementation:**

- **NOT a full org chart** — that's HR domain scope, doesn't exist. Instead: a
  curated `portal_directory_entry` table with: `name`, `title`, `department`
  (enum: `ACCOUNTS_PAYABLE`, `PROCUREMENT`, `COMPLIANCE`, `FINANCE_MANAGEMENT`,
  `EXECUTIVE`), `email` (masked: `j.smith@...`), `availability` (working hours),
  `isEscalationContact` (for P19 breakglass)
- Portal page `/portal/company/directory` — department-grouped cards,
  government-style layout
- Each entry is **buyer-curated** (not auto-generated from HR data). Buyer admin
  maintains the directory via ERP-side settings
- Privacy guard: no direct phone numbers unless buyer opts in. Email sends via
  portal messaging (`CAP-MSG`), not raw exposure

---

#### P24 `CAP-ANNOUNCE`: Dashboard Announcements / Pinned Messages — **YES**

**Implementation:**

- New `portal_announcement` table: `title`, `body` (rich text), `severity`
  (`info` | `warning` | `critical`), `pinned` (boolean), `validFrom`,
  `validUntil`, `createdBy`
- Dashboard renders announcements above KPI deck (using
  `AttentionItem`-compatible structure for consistency with finance dashboard
  pattern)
- Pinned announcements show as a persistent banner across all portal pages (not
  just dashboard)
- Buyer admin creates announcements via ERP-side supplier management UI

---

#### P25 `CAP-PROOF`: Tamper-Evident Communication Log — **STRONG YES**

> _"Blockchain or similar services for verification of communication as proof of
> record."_

**Verdict: SILENT KILLER.** The codebase already has the infrastructure:
`TamperResistantOutboxWriter` implements a **SHA-256 hash chain** — each entry's
`contentHash` includes the previous entry's hash. This is more practical than
blockchain and achieves the same goal: **audit-grade immutability and
provability of communication records**.

> **Terminology note:** This is a linear hash chain, not a Merkle tree (which
> implies branching). We use "hash chain" throughout.

**Legal-grade semantics** (see §7.5 for full spec):

- Hash input is deterministic:
  `event_id + event_type + entity_type + entity_id + actor_type + actor_id + event_at (server UTC) + canonical JSON payload (stable key order) + previous_hash`
- Chain scope: `tenant_id` (one chain per tenant, covering all portal events)
- Periodic anchoring: daily anchor hash written to `audit.audit_log` as a "daily
  digest" record (no blockchain needed — provides cross-referencing point for
  auditors)
- Authorship: `actor_id` + `actor_type` (`SUPPLIER` | `BUYER` | `SYSTEM`) is
  part of the hash input, proving _who_ created the record

**Implementation:**

- Extend the tamper-resistant outbox to cover all portal communication events
- Portal page `/portal/verification` — supplier can:
  - View the hash chain for any message/case/document
  - Download a verification certificate (PDF) for any entry
  - Verify chain integrity via client-side re-hash (confirm no tampering)

**Why not actual blockchain:** Gas costs, latency, regulatory uncertainty, and
infrastructure complexity. A centralized hash chain with periodic anchoring
provides audit-grade immutability and provability at zero marginal cost.

---

#### P26 `CAP-VAULT`: Document Vault (enhanced) — **YES (evolve existing)**

The document vault already exists (N8: `supplierUploadDocument()`,
`supplierListDocuments()`, `supplierVerifyDocumentIntegrity()` with SHA-256
checksums). What's missing for enterprise:

| Gap                    | Enhancement                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| No version history     | Add `version` column + `previousVersionId` FK. Show version timeline.                               |
| No dual-party signing  | Digital signature workflow: supplier uploads → buyer counter-signs → both parties get signed copy   |
| No retention policy UI | Expose document retention periods to supplier. Auto-archive after retention expires.                |
| No contract lifecycle  | Documents have flat categories — add lifecycle (DRAFT → ACTIVE → EXPIRED → RENEWED)                 |
| No shared workspace    | Buyer can't upload docs to the portal for the supplier                                              |
| Limited categories     | Add: `INVOICE_BACKUP`, `DELIVERY_NOTE`, `QUALITY_CERTIFICATE`, `BANK_GUARANTEE`, `PERFORMANCE_BOND` |

**Integration:** Document vault becomes the attachment backend for messaging
(`CAP-MSG`), cases (`CAP-CASE`), breakglass (`CAP-SOS`), and compliance
(`CAP-COMPL`). **All uploads/downloads feed the unified case timeline** when
attached to a case.

---

#### P27 `CAP-APPT`: Appointment Scheduling — **GOOD TO HAVE (Phase 1 late)**

**Implementation (minimal viable):**

- New `portal_meeting_request` table: `requestedBy` (supplier), `requestedWith`
  (buyer contact from directory P23), `proposedTimes` (JSONB array of 3 time
  slots), `status` (`REQUESTED → CONFIRMED → COMPLETED → CANCELLED`),
  `meetingType` (`VIRTUAL` | `IN_PERSON`), `agenda`, `location`
- Portal page `/portal/appointments` — supplier proposes times, buyer confirms
  via ERP-side notification. iCal export.
- Links from case (`CAP-CASE`) and breakglass (`CAP-SOS`): "Schedule a call with
  your assigned manager"

**NOT building:** Full calendar view, recurring meetings, room booking,
integration with Google/Outlook Calendar (post-Phase 1).

---

### 2.4 Unified Case Timeline — Hard Requirement

Every case has **one canonical timeline** showing all activity in chronological
order. Cases are the backbone of portal interaction — messages, documents,
escalations, and payment events are _not_ separate silos.

**Timeline entry types (single `Activity` stream):**

| Entry type            | Source                                          | Example                                                   |
| --------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| **Status transition** | Case status change                              | "Status changed: SUBMITTED → ASSIGNED"                    |
| **Message**           | Messaging hub (P5/`CAP-MSG`)                    | "Message from J.Smith (AP Manager): Please provide…"      |
| **Attachment**        | Document vault (P26/`CAP-VAULT`)                | "Document uploaded: invoice-backup-2026-03.pdf"           |
| **Escalation**        | Breakglass (P19/`CAP-SOS`)                      | "Escalated to Level 2 — assigned to M.Chen (Finance Dir)" |
| **SLA breach**        | SLA timer                                       | "⚠ SLA response deadline breached (was 48h)"              |
| **Payment fact**      | Payment tracking (P2/`CAP-PAY-ETA`) when linked | "Payment status: PROCESSING → SENT (Bank ref: TRF-00421)" |
| **Match update**      | Resolution screen (P21/`CAP-MATCH`)             | "AP column: amount discrepancy resolved by J.Smith"       |
| **System event**      | Auto-triggered                                  | "Case auto-created: compliance item expired"              |

**UI:** Single "Activity" stream with filter chips (messages only / status only
/ all), **not** separate widgets. Each entry shows: timestamp, actor (name +
role badge), action text, proof-chain hash (linkable to verification page).

**Data model:** `supplier_case_timeline` table (or JSONB array on case — prefer
table for queryability):

| Column       | Type        | Purpose                                                                     |
| ------------ | ----------- | --------------------------------------------------------------------------- |
| `id`         | UUID PK     | —                                                                           |
| `case_id`    | UUID FK     | —                                                                           |
| `tenant_id`  | UUID        | RLS                                                                         |
| `entry_type` | enum        | status, message, attachment, escalation, sla_breach, payment, match, system |
| `actor_id`   | UUID        | —                                                                           |
| `actor_type` | enum        | SUPPLIER, BUYER, SYSTEM                                                     |
| `content`    | JSONB       | Type-specific payload                                                       |
| `proof_hash` | varchar(64) | Link to proof chain entry                                                   |
| `created_at` | timestamptz | Immutable                                                                   |

**Invariant:** Messaging hub (P5) threads **anchor to cases**. A message without
a case context creates an implicit "general inquiry" case. This means P5 and P20
share a timeline from day one — no divergence, no rework.

---

### 2.5 Summary by Phase

**Phase 1 — AP-Anchored (13 weeks):**

| Category          | Features                                                                                                                                                                                                                                        | Count |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| **SILENT KILLER** | P2 `CAP-PAY-ETA`, P3 `CAP-SCF`, P18 `CAP-API`, P25 `CAP-PROOF`                                                                                                                                                                                  | 4     |
| **ESSENTIAL**     | P1 `CAP-ONB`, P5 `CAP-MSG`, P8 `CAP-COMPL`, P11 `CAP-PWA`, P13 `CAP-BULK`, P14 `CAP-AUDIT`, P15 `CAP-CRDB`, P16 `CAP-SEARCH`, P19 `CAP-SOS`, P20 `CAP-CASE`, P21 `CAP-MATCH`, P22 `CAP-LOC`, P23 `CAP-DIR`, P24 `CAP-ANNOUNCE`, P26 `CAP-VAULT` | 15    |
| **GOOD TO HAVE**  | P9 `CAP-MULTI`, P12 `CAP-BRAND`, P27 `CAP-APPT`                                                                                                                                                                                                 | 3     |

**Phase 2 — Procurement-Anchored (after procurement ships):**

| Category         | Features                                                   | Count |
| ---------------- | ---------------------------------------------------------- | ----- |
| **ESSENTIAL**    | P6 `CAP-POFLIP`, P7 `CAP-3WAY`, P21 `CAP-MATCH` (complete) | 3     |
| **GOOD TO HAVE** | P4 `CAP-SCORE`, P10 `CAP-CATALOG`, P17 `CAP-PERSONA`       | 3     |

---

## 3. Portal Kernel (Phase 0, gated)

> **Gate rule:** No feature work merges without Phase 0 gates green. The kernel
> is not "nice to have" — it is a **hard prerequisite**.

Every Portal 2.0 feature depends on a shared kernel. Without it,
`CAP-ONB`/`CAP-MSG`/`CAP-BULK`/`CAP-AUDIT`/`CAP-SOS`/`CAP-CASE` will implement
inconsistent identity, logging, and notification logic.

### 3.1 Package Structure Decision

**Chose: dedicated `packages/supplier-kernel/`**

Over: embedding in `packages/modules/finance/src/slices/ap/kernel/`.

| Concern               | Embedding in AP slice                              | Dedicated package                                  |
| --------------------- | -------------------------------------------------- | -------------------------------------------------- |
| Import boundary       | Portal kernel becomes AP-coupled                   | Clean `@afenda/supplier-kernel` import             |
| Reuse by Phase 2      | Phase 2 (procurement) would cross-import AP slice  | Phase 2 imports `@afenda/supplier-kernel` directly |
| `arch-guard`          | Would need exceptions for cross-slice imports      | Clean boundary — no exceptions                     |
| Domain purity         | Mixes AP business logic with portal infrastructure | Portal infrastructure is domain-agnostic           |
| Read/write separation | Harder to enforce                                  | Package exports are explicitly structured          |

**Package layout (`packages/supplier-kernel/`):**

```
packages/supplier-kernel/
├── package.json           # @afenda/supplier-kernel
├── tsconfig.json
├── tsup.config.ts
├── src/
│   ├── index.ts           # Public API
│   ├── portal-registry.ts # SP-* tracking registry (§0.2)
│   │
│   ├── identity/          # SP-1001: Portal identity & tenancy
│   │   ├── resolve-portal-identity.ts     # READ
│   │   └── portal-identity.types.ts       # Types
│   │
│   ├── permissions/       # SP-1002: Roles, permissions, SoD
│   │   ├── portal-permissions.ts          # READ (constants, enums)
│   │   ├── portal-sod-rules.ts            # READ (pure data)
│   │   └── check-portal-permission.ts     # READ (pure function)
│   │
│   ├── status/            # SP-1003: Status Dictionary
│   │   └── portal-status-dictionary.ts    # READ
│   │
│   ├── notifications/     # SP-1004: Notification dispatcher
│   │   ├── portal-notification-dispatcher.ts  # WRITE (outbox → worker)
│   │   └── notification.types.ts              # Types
│   │
│   ├── audit/             # SP-1005: Audit hook
│   │   └── portal-audit-hook.ts           # WRITE (Fastify hook → audit.audit_log)
│   │
│   ├── proof/             # SP-1006: Tamper-evident proof chain
│   │   ├── proof-chain-writer.ts          # WRITE
│   │   ├── proof-chain-verifier.ts        # READ (pure)
│   │   ├── proof-chain-anchoring.ts       # WRITE (daily digest)
│   │   └── proof.types.ts                 # Types
│   │
│   ├── attachments/       # SP-1007: Attachment policy
│   │   └── portal-attachment-policy.ts    # READ+WRITE (validation + checksum)
│   │
│   ├── case-id/           # SP-1008: Case ID generator
│   │   └── portal-case-id.ts             # WRITE (sequence)
│   │
│   ├── idempotency/       # SP-1009: Idempotency standard
│   │   └── portal-idempotency.ts          # READ+WRITE (reuses IIdempotencyStore)
│   │
│   ├── context/           # SP-1010: PortalRequestContext
│   │   └── portal-request-context.ts      # READ (type + factory)
│   │
│   └── domain/            # SP-4000+: Pure domain logic
│       ├── case-state-machine.ts          # INQUIRY (pure)
│       ├── payment-stage-machine.ts       # INQUIRY (pure)
│       └── sla-calculator.ts             # INQUIRY (pure)
```

**Read / Write / Inquiry classification:**

| Classification | Meaning                                         | Examples                                             |
| -------------- | ----------------------------------------------- | ---------------------------------------------------- |
| **READ**       | Pure data access, no side effects, no mutations | Identity resolution, permission check, status lookup |
| **WRITE**      | Mutates state (DB, outbox, audit log)           | Proof chain entry, notification dispatch, audit log  |
| **INQUIRY**    | Pure computation, no I/O, deterministic         | State machine transitions, SLA calculations          |

Dependencies: `@afenda/supplier-kernel` depends on `@afenda/contracts`,
`@afenda/authz`, `@afenda/db` (for port interfaces only — not implementations).
Drizzle repo implementations live in
`packages/modules/finance/src/slices/ap/repos/` as today.

### 3.2 Why this is critical (codebase evidence)

- `supplierPortal` resource defined in `erpStatements` (`permissions.ts:L82`)
  but **not assigned to any of the 6 roles** — routes use `'supplier:read'` as
  workaround.
- `resolveSupplierIdentity()` returns flat profile but **no role/permission
  concept** for supplier users.
- Full notification infrastructure exists (`platform.notifications`) but **zero
  portal features use it**.
- `audit.audit_log` table exists but **no portal middleware** writes to it.
- `TamperResistantOutboxWriter` exists (SHA-256 hash chain) but only covers
  outbox events — not portal communications.
- `IIdempotencyStore` port exists with `claimOrGet()` pattern — portal must
  reuse this for all mutation endpoints.

### 3.3 Kernel Components

| SP#         | Component                 | Purpose                                                                                                 | Classification |
| ----------- | ------------------------- | ------------------------------------------------------------------------------------------------------- | -------------- |
| **SP-1001** | **Identity & tenancy**    | `portalUserId` + `supplierId` + `tenantId` + `entityIds[]`. Extend `resolveSupplierIdentity()`          | READ           |
| **SP-1002** | **Permissions model**     | Supplier-side + buyer-side roles. SoD rules. Granular permissions.                                      | READ           |
| **SP-1003** | **Status Dictionary**     | Single source of truth for all supplier-visible statuses: label + severity + help text                  | READ           |
| **SP-1004** | **Notification backbone** | Outbox → worker → email + in-app via `platform.notifications`. One dispatcher for all services          | WRITE          |
| **SP-1005** | **Audit log middleware**  | Fastify hook logging every portal mutation to `audit.audit_log`                                         | WRITE          |
| **SP-1006** | **Proof chain writer**    | Extend `TamperResistantOutboxWriter` for portal communication events. Legal-grade hash semantics (§7.5) | WRITE          |
| **SP-1007** | **Attachment policy**     | File size/type limits + checksum + immutable audit. Reuse document vault service                        | READ+WRITE     |
| **SP-1008** | **Case ID generator**     | Auto-generate `CASE-{TENANT}-{YYYY}-{SEQ}` ticket numbers                                               | WRITE          |
| **SP-1009** | **Idempotency standard**  | `Idempotency-Key` header support on all mutation endpoints. Reuses `IIdempotencyStore` port             | READ+WRITE     |
| **SP-1010** | **PortalRequestContext**  | Immutable request envelope — the **only** way services get identity                                     | READ           |

### 3.4 Roles, Permissions & SoD

**Two distinct role families** — supplier-side and buyer-side:

#### Supplier org roles (inside supplier company)

| Role                | Permissions                                                                                                 | SoD constraints                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `PORTAL_OWNER`      | All permissions. Manages users + API keys.                                                                  | API key creation requires **owner approval** (2-person control via case workflow). |
| `PORTAL_FINANCE`    | `INVOICE_SUBMIT`, `CASE_CREATE`, `MSG_SEND`, `DOCUMENT_UPLOAD`, `ESCALATE`, `BANK_ACCOUNT_MANAGE` (propose) | Bank account changes require **owner approval** (2-person control).                |
| `PORTAL_OPERATIONS` | `CASE_CREATE`, `MSG_SEND`, `DOCUMENT_UPLOAD`                                                                | Cannot submit invoices or manage bank accounts.                                    |
| `PORTAL_READONLY`   | Read-only access to all portal data                                                                         | Cannot create cases, send messages, upload docs, or **escalate** (P19).            |

#### Buyer-side portal roles (internal staff handling portal cases/messages)

| Role                          | Scope                                                                            | Assigned via                                 |
| ----------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------- |
| `PORTAL_AGENT`                | Handle assigned cases, send messages, request documents                          | ERP-side user management                     |
| `PORTAL_MANAGER`              | All agent permissions + reassign cases + set SLA overrides                       | ERP-side user management                     |
| `PORTAL_EXECUTIVE_ESCALATION` | Breakglass (P19) target. Receives escalated cases. Full case + supplier context. | `portal_directory_entry.isEscalationContact` |

#### SoD policy points (pure data — extends `FINANCE_SOD_RULES` pattern)

```typescript
export const PORTAL_SOD_RULES: readonly PortalSoDRule[] = [
  {
    entityType: 'bankAccount',
    action: 'bank_account:propose',
    conflictsWith: 'bank_account:approve',
    description: 'Proposer of bank account change cannot approve it',
  },
  {
    entityType: 'apiKey',
    action: 'api_key:create',
    conflictsWith: 'api_key:activate',
    description: 'API key creator cannot activate it (2-person control)',
  },
  {
    entityType: 'case',
    action: 'case:resolve',
    conflictsWith: 'case:reopen',
    description: 'Resolver cannot reopen same case',
  },
];
```

### 3.5 PortalRequestContext Invariants (SP-1010)

Every portal service receives identity through **one and only one** envelope:

```typescript
export interface PortalRequestContext {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly portalUserId: string;
  readonly entityIds: readonly string[]; // for multi-entity (P9)
  readonly portalRole: PortalRole; // OWNER | FINANCE | OPS | READONLY
  readonly permissions: readonly PortalPermission[];
  readonly actorFingerprint: string; // IP + UA hash — for rate limiting / abuse detection
  readonly idempotencyKey?: string; // from Idempotency-Key header
}
```

**Construction:** Built once in the Fastify `preHandler` hook from
`resolveSupplierIdentity()` + `Idempotency-Key` header + request metadata.
Services **never** construct their own identity — they receive
`PortalRequestContext` as a dependency.

### 3.6 Idempotency Standard (SP-1009)

Portal is internet-facing; retries happen. Every mutation endpoint must support:

- `Idempotency-Key` HTTP header (client-generated UUID)
- Server calls `IIdempotencyStore.claimOrGet()` before executing command
- If claimed → execute and `recordOutcome()`
- If already processed → return cached result (HTTP 200, not 409)
- Key TTL: 24 hours (configurable)

**Applies to:** invoice submit, bulk upload, message send, case create,
escalation trigger, document upload, bank account change, API key creation.

### 3.7 Portal Shell UX Contexts

The sidebar organizes around 4 contexts:

| Context             | Routes                                                                                   | Key Actions                                                             |
| ------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **My Company**      | profile, bank-accounts, compliance, locations, directory, team/users, settings, activity | Edit profile, manage accounts, upload certificates, view buyer contacts |
| **My Documents**    | invoices, credit-notes, documents (vault), wht, bulk-upload                              | Submit invoice, upload docs, download remittance                        |
| **My Transactions** | payments, cases (was disputes), messages, reconciliation, appointments                   | Track payments, create cases, message buyer, schedule meetings          |
| **Support**         | breakglass, escalation history, verification (proof chain)                               | SOS escalation, verify communication records                            |

Every list/detail page shows: **status** + **next action** + **support channel**
(case thread link / SOS button).

---

## 4. End-to-End Definition of Done

Every feature must complete **all 12 layers/gates** (8 core + 4 enterprise).

### 4.1 Core Layers (8)

| #   | Layer              | Criteria                                                                                                                                                               | Evidence                                                    |
| --- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | **Contracts**      | Zod schema in `@afenda/contracts`. Uses `ListResponseSchema<T>` for lists                                                                                              | Schema file, `pnpm build --filter @afenda/contracts` passes |
| 2   | **DB Schema**      | Drizzle table with RLS, `tenant_id`, migration, seeder                                                                                                                 | `gate-db-module.mjs` passes                                 |
| 3   | **Domain**         | Pure logic in `domain/` — zero DB/HTTP imports                                                                                                                         | No forbidden imports                                        |
| 4   | **Application**    | Service with ports. Transaction boundaries. Outbox event. Kernel notification dispatcher. **Proof-chain entry for supplier-facing events.** `Idempotency-Key` support. | Event in `events.ts`, idempotency assertion in test         |
| 5   | **Infrastructure** | Fastify route with auth, Zod, `Idempotency-Key`, audit hook                                                                                                            | `gate-web-module.mjs` passes                                |
| 6   | **Frontend**       | Page + `loading/error/not-found.tsx`. `PortalDataTable` for lists. Per-domain query file. Empty state                                                                  | TypeScript compiles                                         |
| 7   | **Tests**          | Unit (vitest), route-level auth tests, property-based invariants, E2E (Playwright)                                                                                     | Coverage ≥ 80%                                              |
| 8   | **Documentation**  | Portal README, OpenAPI spec, AIS benchmark, WCAG 2.2 AA audit. **SP-# annotation in code/commits.**                                                                    | `pnpm arch:guard` passes                                    |

### 4.2 Enterprise Gates (4)

| #   | Gate                             | Criteria                                                                                                                                                                                                                      |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9   | **Supplier-visible correctness** | Every status from Status Dictionary (`SP-1003`) — no ad-hoc strings                                                                                                                                                           |
| 10  | **PII + document handling**      | Classification + retention + access log. Downloads auth-checked + audit-logged                                                                                                                                                |
| 11  | **Rate limiting + abuse**        | Per-user on mutations (keyed by `actorFingerprint`). Per-API-key for `CAP-API`. Burst protection on uploads                                                                                                                   |
| 12  | **Supplier-safe language**       | No internal hold reasons, error codes, or system labels leak to suppliers. All supplier-visible text must resolve through Status Dictionary (`SP-1003`). CI test (SP-8025) asserts no raw internal labels reach the frontend. |

### 4.3 Inherited CI Gates & ESLint Rules

Portal code inherits the full monorepo CI pipeline (32 gates + ESLint). Key
gates that directly affect portal development:

**Structural gates:**

- `gate-web-module.mjs`: Every `page.tsx` must have sibling `loading.tsx`
- `gate-db-module.mjs`: Every tenant table must have RLS policy + `tenant_id`
- `gate-schema-conventions.mjs`: SC-01–SC-08 (`.enableRLS()`, `tenantCol()`,
  `pkId()`, `timestamps()`, `moneyBigint()`)
- `gate-identity-sot.mjs`: No raw `x-tenant-id` / `x-user-id` header reads
- `gate-kernel-invariants.mjs`: Auth guards on settings/admin routes, kernel
  context usage (extend for `@afenda/supplier-kernel`)

**Quality gates:**

- `gate-react-cache.mjs`: Server fetchers use `cache()`
- `gate-hydration.mjs`: No `Date.now()` / `Math.random()` in render
- `gate-a11y.mjs`: Accessibility rules
- `gate-react-keys.mjs`: Stable React keys
- `gate-loading-skeleton.mjs`: Loading states have skeletons

**Finance gates (portal inherits when touching AP data):**

- `gate-money-safety.mjs`: No raw `BigInt(Math.round(x * 100))` in routes
- `gate-currency-safety.mjs`: No hardcoded `'USD'` or `?? 'USD'` in repos
- `gate-contract-drift-improved.mjs`: Contract schemas match API responses
- `gate-openapi-drift.mjs`: OpenAPI spec matches routes
- `gate-status-types.mjs`: Status fields use typed unions, not bare `string`

**ESLint enforcement (three layers):**

- `@afenda/eslint-config` (base): CIG-04 (routes can't import DB),
  `consistent-type-imports`, no `any`
- `apps/web/eslint.config.js`: RBP-03 (`.toSorted()`), RBP-CACHE (`cache()`),
  hydration selectors, a11y, `eqeqeq`, `react-hooks/rules-of-hooks`
- `packages/modules/finance/eslint.config.js`: CIG-02 (no float money math),
  CIG-03 (Zod parse not type cast), CIG-04 (tests in `__tests__/`)

**Portal-specific ESLint (added in Phase 0):**

- ESLINT-PORTAL-01: Ban `resolveSupplierIdentity()` outside preHandler
- ESLINT-PORTAL-02: Ban internal status labels in `(supplier-portal)` files
- ESLINT-PORTAL-03: Ban `@afenda/modules/*` imports in kernel

**Portal-specific CI gates (added in Phase 0):**

- `gate-portal-supplier-safe.mjs` (GATE-PORTAL-01, SP-8025)
- `gate-portal-identity.mjs` (GATE-PORTAL-02)
- `gate-portal-idempotency.mjs` (GATE-PORTAL-03)
- `gate-portal-timeline-tx.mjs` (GATE-PORTAL-04)
- `gate-portal-proof-chain.mjs` (GATE-PORTAL-05, SP-8022)
- `gate-portal-sod.mjs` (GATE-PORTAL-07, SP-8020)
- `gate-portal-rate-limit.mjs` (GATE-PORTAL-08)

Full gate + ESLint reference: `.cursor/rules/portal-ci-gates.mdc`

CI: TypeScript strict, ESLint, Prettier, all tests green

---

## 5. Phase 1 Implementation: AP-Anchored Portal (13 Weeks)

### Phase 1.0: Foundation + Portal Kernel (Week 1–2)

**Goal:** Establish kernel, fix existing gaps, build reusable infrastructure.
**No feature work merges until Phase 0 exit criteria are green.**

#### Exit criteria

- [ ] `@afenda/supplier-kernel` package created, builds, exports public API
- [ ] SP-1001 through SP-1010: all kernel components operational
- [ ] SP-1003 (Status Dictionary) live — **first kernel component, not last**
- [ ] SP-1009 (Idempotency) wired to all existing portal mutation endpoints
- [ ] SP-1010 (PortalRequestContext) is the only identity source for all routes
- [ ] Shared contracts: `PortalRequestContext`, `ListResponseSchema<T>`, error
      shapes in `@afenda/contracts`
- [ ] Query file split into per-domain files
- [ ] All portal sub-routes have: `loading.tsx`, `error.tsx`, `not-found.tsx`
- [ ] P16 `CAP-SEARCH` implemented via `PortalDataTable` (not per-page custom)
- [ ] Dashboard endpoint registered + dashboard upgraded to attention-first
- [ ] Rate limiting middleware on all portal mutation routes
- [ ] Statement reconciliation bugs fixed (G1–G5 from prior audit)
- [ ] `portal-registry.ts` seeded with all SP-1000 series items

#### Steps

**0.1 Status Dictionary + Permissions + Identity** (SP-1003, SP-1002, SP-1001) —
Status Dictionary **first** (prevents inconsistent UX strings across everything
built after). Then permissions model (roles, SoD rules, granular permissions).
Then identity resolver extending `resolveSupplierIdentity()` to return
`PortalRequestContext`.

**0.2 PortalRequestContext + Idempotency** (SP-1010, SP-1009) — Build the
immutable request envelope. Wire `Idempotency-Key` header support to all
existing portal mutation endpoints using `IIdempotencyStore.claimOrGet()`.

**0.3 Audit + Notifications + Proof Chain** (SP-1005, SP-1004, SP-1006) —
Fastify audit hook on all portal routes. Notification dispatcher wiring to
outbox + `platform.notifications`. Proof chain writer with legal-grade hash
semantics (§7.5). Daily anchoring job (proof chain → `audit.audit_log` digest).

**0.4 Attachment policy + Case ID generator** (SP-1007, SP-1008)

**0.5 Shared contracts** — Add `packages/contracts/src/portal/` with
`PortalRequestContext`, `ListResponseSchema<T>`, portal error envelope.

**0.6 Dashboard endpoint** — Register missing
`GET /portal/suppliers/:id/dashboard` in `supplier-portal-routes.ts`.

**0.7 Query file split** — Split `portal.queries.ts` (423 lines) into per-domain
files.

**0.8 Segment error boundaries** — Add `error.tsx` + `not-found.tsx` for each
portal sub-route.

**0.9 PortalDataTable + CAP-SEARCH** — Build wrapper with: pagination, filter
chips, saved views, CSV export, bulk actions, empty state CTA. Apply across all
lists.

**0.10 Dashboard upgrade** — Adopt `DomainDashboardShell` pattern: KPI deck,
feature grid, attention items, quick actions. **Add announcement banner slot**
(P24 content comes in Phase 1.2).

**0.11 Fix statement reconciliation** — G1 (response shape mapping), G2 (4-tab
results), G3 (totals display), G4 (date tolerance slider), G5 (proper CSV parser
with column mapping).

**0.12 Enhance statement reconciliation** — G6 (session persistence +
`/portal/reconciliation/history`), G8 (worker consumer for
`SUPPLIER_STATEMENT_UPLOADED`).

**0.13 Rate limiting** — Per-portal-user on mutations (keyed by
`actorFingerprint`). Burst protection on uploads.

---

### Phase 1.1: Cases as Backbone (Week 2–5) — CAP-CASE, CAP-ONB, CAP-COMPL, CAP-AUDIT, CAP-LOC, CAP-DIR

**Goal:** Case management is the **backbone** — messaging (P5) starts as "case
comments" before becoming first-class in Phase 1.2. This prevents timeline
divergence.

**Hard sequencing rule:** Ship **Case + Timeline first** (1.1.1) before any
other 1.1.x item. No other feature in this sub-phase may merge until
`supplier_case` + `supplier_case_timeline` tables are live, the timeline API
returns entries, and at least one E2E test (SP-8011) passes end-to-end.

**Sequencing rationale:** Building cases first means messaging, escalation, and
document vault all anchor to the case timeline from day one. Avoids rework when
P5/P20/P26 would otherwise diverge.

**1.1.1 Case Management (P20 `CAP-CASE`)** — New `supplier_case` table +
`supplier_case_timeline` table (§2.4). Auto-generated ticket numbers
(`CASE-{TENANT}-{YYYY}-{SEQ}` via SP-1008). 8-status lifecycle. Extensible
category taxonomy. SLA timers per category + priority. Resolution includes root
cause + corrective action (training data). Linked to any portal entity. Migrate
existing `supplier_dispute` rows. **Every status change → timeline entry → proof
chain entry.** Messages on a case are timeline entries (type: `message`) — this
is the initial messaging surface before P5 goes first-class.

**1.1.2 Onboarding Wizard (P1 `CAP-ONB`)** — Multi-step form at
`portal/onboarding/`: Company info → Bank details → KYC document upload → Tax
registration → Review & Submit. Maps to `supplierOnboardingStatusEnum`. KYC
uploads via SP-1007 (attachment policy). Notifications via SP-1004. **If
onboarding stalls, supplier can create a case.**

> **DEFERRED — First-Login Product Tour:** A lightweight draggable-tooltip
> walkthrough (4-5 steps: Dashboard → Cases → Documents → Profile → Help) will
> be added as a post-onboarding discovery layer. Triggers once after buyer
> approves the supplier (`hasSeenTour` flag). Non-blocking, dismissible.
> **Deferred until pre-deployment phase** — not needed during scaffold/dev
> iterations. ~0.5 day frontend effort when activated.

**1.1.3 Compliance Expiry Alerts (P8 `CAP-COMPL`)** — Cron worker scans
`supplier_compliance_item` for 30/14/7-day expiry → notification. Portal shows
expiry timeline with renewal upload. Expired items auto-create a case.

**1.1.4 Audit Trail (P14 `CAP-AUDIT`)** — SP-1005 (audit hook) writes to
`audit.audit_log`. Add supplier-facing filtered view at `/portal/activity` with
timeline UI.

**1.1.5 Company Location Directory (P22 `CAP-LOC`)** — Portal page
`/portal/company/locations`. Buyer's addresses exposed.

**1.1.6 Senior Management Directory (P23 `CAP-DIR`)** — New
`portal_directory_entry` table. `isEscalationContact` flag powers P19.

**1.1.7 Invitation Flow** — Buyer sends invite email → magic link → onboarding
wizard.

---

### Phase 1.2: Communication & Documents (Week 5–8) — CAP-MSG, CAP-SOS, CAP-ANNOUNCE, CAP-PROOF, CAP-VAULT, CAP-APPT

**Goal:** Messaging becomes first-class (no longer just case comments),
escalation, announcements, proof-of-record verification UI.

**1.2.1 Messaging Hub (P5 `CAP-MSG`)** — Tables: `supplier_message_thread`,
`supplier_message`. **Every message thread anchors to a case** (new or
existing). A message without explicit case context creates an implicit "general
inquiry" case — ensuring unified timeline is never broken.

**Storage-level invariant:** Messages are stored in `supplier_message` (source
entity) and a corresponding `supplier_case_timeline` entry (type: `message`,
`ref_id` → `supplier_message.id`) is appended in the **same transaction**. The
timeline table is the read path for case activity; `supplier_message` holds the
full message body. This is "case comments/threads at the storage level" —
messaging is not a parallel concept, it is a timeline entry type with a richer
source table.

SSE polling (not WebSocket — per PROJECT.md). Attachments via document vault.
Read receipts. Every message → proof chain entry. Required `MSG_SEND`
permission. Idempotency-Key on send.

**1.2.2 Breakglass Escalation (P19 `CAP-SOS`)** — SOS button in portal header

- on any case/invoice/payment detail page. Auto-assign from
  `portal_directory_entry WHERE isEscalationContact = true` (round-robin). New
  `portal_escalation` table. SLA countdown visible to both parties. Breach →
  auto-escalate to next level. **Requires `ESCALATE` permission —
  `PORTAL_READONLY` cannot trigger.** Creates immutable proof-chain entry.

**1.2.3 Dashboard Announcements (P24 `CAP-ANNOUNCE`)** — New
`portal_announcement` table. Dashboard renders above KPI deck. Pinned =
persistent banner across all pages. Buyer admin creates via ERP-side UI.

**1.2.4 Tamper-Evident Verification UI (P25 `CAP-PROOF`)** — Portal page
`/portal/verification`. Supplier can: view hash chain, download verification
certificate (PDF), verify chain integrity via client-side re-hash. (The proof
chain _writer_ was built in Phase 0 as SP-1006 — this is the _reader/verifier
UI_.)

**1.2.5 Document Vault Enhanced (P26 `CAP-VAULT`)** — Extend existing vault:
version history, contract lifecycle, buyer-to-supplier sharing, additional
categories, retention policy UI. **All uploads/downloads → case timeline entry
(when attached to case) + proof chain entry.**

**1.2.6 Appointment Scheduling (P27 `CAP-APPT`)** — Lightweight meeting request.
Links from case and breakglass.

---

### Phase 1.3: Invoice Operations (Week 8–10) — CAP-BULK, CAP-CRDB, CAP-MATCH

**Goal:** Enterprise invoice lifecycle + match resolution.

**1.3.1 Bulk Invoice Upload (P13 `CAP-BULK`)** — Portal
`/portal/invoices/bulk-upload`. CSV/Excel parser (PapaParse + column mapping).
Backend batch endpoint with **idempotency + dedupe**:

| Concern                 | Behavior                                                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Batch ID**            | Each file upload produces a unique `batch_id` (UUID)                                                                                                        |
| **Row fingerprint**     | `SHA-256(supplier_id + invoice_number + invoice_date + amount + currency + vendor_reference)` — deterministic per row                                       |
| **Duplicate detection** | Fingerprint match against existing invoices → policy selection                                                                                              |
| **Dedupe policy**       | Explicit per-upload: `SKIP_DUPLICATES` (default) / `UPDATE_DRAFT` (only if target is DRAFT status) / `REJECT_CONFLICTS` (fail batch if any duplicate found) |
| **Error handling**      | Error report with row-level status. Fix & retry only failed rows within same `batch_id`.                                                                    |
| **Idempotency**         | `Idempotency-Key` on the upload request (whole-file level). Re-upload same key → return existing batch result.                                              |

**1.3.2 Credit/Debit Note Submission (P15 `CAP-CRDB`)** — Extend invoice submit
for `documentType: 'CREDIT_NOTE' | 'DEBIT_NOTE'`. Reuse `buildEInvoice()`.
Exceptions → auto-create case.

**1.3.3 3-Way Match Resolution Screen — AP Side (P21 `CAP-MATCH`)** — Portal
`/portal/invoices/[id]/resolution` shows multi-column workspace:

| Column               | Phase 1                                              | Phase 2                       |
| -------------------- | ---------------------------------------------------- | ----------------------------- |
| **Invoice (AP)**     | Live — AP clerk resolves amount/tax/duplicate issues | —                             |
| **Supplier**         | Live — supplier sees status, provides missing docs   | —                             |
| **GR (Warehouse)**   | Placeholder — "Awaiting warehouse GR data"           | Filled when procurement ships |
| **PO (Procurement)** | Placeholder — "Awaiting PO confirmation"             | Filled when procurement ships |

Case (`CAP-CASE`) is the umbrella. All resolution actions → unified case
timeline. Multi-role assignment: supplier sees who in each department is
handling their case + status per column.

---

### Phase 1.4: Payment Intelligence (Week 10–12) — CAP-PAY-ETA, CAP-SCF

**Goal:** Silent killer features — payment tracking and supply chain finance.

**1.4.1 Real-Time Payment Tracking (P2 `CAP-PAY-ETA`)** — Append-only
`supplier_payment_status_fact` table (§7.2).

**Stage state machine** (no impossible jumps):

```
SCHEDULED → APPROVED → PROCESSING → SENT → CLEARED
     ↓          ↓           ↓         ↓
  ON_HOLD    ON_HOLD     ON_HOLD   REJECTED
     ↓          ↓           ↓
  (back to previous stage when hold lifts)
```

**Source precedence:** `BANK_FILE` > `ERP` > `MANUAL_OVERRIDE` — a bank file
stage update overrides ERP scheduled stage.

**Hold reason taxonomy** (supplier-safe labels):

| Internal label              | Supplier-visible label          | Next action                        |
| --------------------------- | ------------------------------- | ---------------------------------- |
| `APPROVAL_PENDING`          | "Awaiting internal approval"    | Case link + wait                   |
| `COMPLIANCE_EXPIRED`        | "Compliance document expired"   | Upload renewal → compliance page   |
| `MISMATCH_3WAY`             | "Invoice under review"          | View match resolution screen       |
| `BANK_REJECTED`             | "Bank processing issue"         | Contact case + reference           |
| `TAX_VALIDATION_FAILED`     | "Tax registration issue"        | Upload updated tax docs            |
| `PAYMENT_RUN_NOT_SCHEDULED` | "Not yet scheduled for payment" | Wait / message buyer               |
| `MANUAL_HOLD`               | "Under review"                  | Create case if >N days             |
| `FRAUD_SUSPICION`           | **"Verification pending"**      | ⚠ Never expose "fraud" to supplier |

**"Why am I not paid?" panel** — maps each hold to: supplier-visible label +
next action (case link + message thread + required document upload).

**Auto-escalation:** Payment on hold >N days (configurable per tenant) →
auto-create case → if case SLA breached → breakglass (`CAP-SOS`).

When a payment fact is linked to a case, the fact event appears in the **unified
case timeline** (§2.4).

**1.4.2 Early Payment / Dynamic Discounting (P3 `CAP-SCF`)** — Tables:
`early_payment_offer`, `discount_schedule`. Hard-bounded v1:

- Match-clean invoices only
- Deterministic pricing (APR or flat %)
- Immutable agreement records
- GL impact configurable per tenant
- Backend: `supplier-portal-scf.ts`

---

### Phase 1.5: API, Polish & Production (Week 12–13) — CAP-API, CAP-MULTI, CAP-PWA, CAP-BRAND

**Goal:** API access, mobile, branding, multi-entity.

**1.5.1 Supplier API / Webhooks (P18 `CAP-API`)** — Stripe-like DX: scoped API
keys, HMAC-SHA256 webhook signing, versioned events, per-key rate limiting,
OpenAPI spec for supplier-facing API. **API key creation requires 2-person
control** (SoD: `api_key:create` conflicts with `api_key:activate` — owner must
approve).

**1.5.2 Multi-Entity View (P9 `CAP-MULTI`)** — Extend portal identity
`entityIds[]`. Dashboard aggregates across entities. Entity switcher in shell
header.

**1.5.3 Mobile PWA (P11 `CAP-PWA`)** — Responsive shell (sidebar → bottom nav on
mobile). PWA manifest + service worker for shell caching.

**Mobile UX deliverables** (not just "touch-friendly tables"):

| Desktop                        | Mobile                                                          |
| ------------------------------ | --------------------------------------------------------------- |
| `PortalDataTable` with columns | **Card list** with key fields (status badge, amount, date)      |
| Inline status + actions        | **Sticky status bar** + next action CTA                         |
| Side-by-side panels            | **Detail drawer** (bottom sheet)                                |
| Full match resolution columns  | **Tabbed columns** (swipe between Invoice / Supplier / GR / PO) |

Only keep true tables on desktop. Mobile is card-first.

**1.5.4 White-Label Branding (P12 `CAP-BRAND`)** — Tenant config: logo, primary
color, favicon. CSS variables. Scoped for v1.

---

## 6. Phase 2 Preview: Procurement-Anchored Portal

> **Prerequisite:** Procurement module must ship first. These features cannot be
> built on projections.

| Step | CAP           | Feature                             | Detail                                                                                                                                                   |
| ---- | ------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | `CAP-POFLIP`  | **PO Flip (P6)**                    | Supplier receives PO from procurement domain → confirms/rejects → creates invoice from PO lines. Now backed by real procurement tables, not projections. |
| 2.2  | `CAP-3WAY`    | **GR Integration (P7)**             | Warehouse GR data flows into the 3-way match resolution screen (P21). GR column goes live.                                                               |
| 2.3  | `CAP-MATCH`   | **Match Resolution Complete (P21)** | All 4 columns live: Invoice (AP) + Supplier + GR (Warehouse) + PO (Procurement). Full multi-persona workspace.                                           |
| 2.4  | `CAP-SCORE`   | **Performance Scorecard (P4)**      | Procurement-defined evaluation criteria → portal charts. On-time delivery, quality, responsiveness.                                                      |
| 2.5  | `CAP-CATALOG` | **Catalog Management (P10)**        | Supplier maintains product/service catalog with prices, lead times. Linked to procurement sourcing.                                                      |
| 2.6  | `CAP-PERSONA` | **Contractor/Lease Variants (P17)** | Extended portal personas: contractor (timesheet/expense), leasee (lease schedule/payment).                                                               |

---

## 7. Data Model Principles

### 7.1 PO Tables Are Projections (Phase 1) → Real Tables (Phase 2)

In Phase 1, if any PO visibility is needed (for the AP-side match resolution
screen `CAP-MATCH`), use read-only projections:

- `portal_po_snapshot` with `sourceDocId` + `sourceDocType`
- Portal reads only — never mutates PO lifecycle
- When procurement module ships (Phase 2), these become views over real tables

### 7.2 Payment Status Fact Table (Append-Only)

**Table: `supplier_payment_status_fact`** (immutable, SOX-safe)

| Column                   | Type               | Purpose                                                     |
| ------------------------ | ------------------ | ----------------------------------------------------------- |
| `id`                     | UUID PK            | —                                                           |
| `tenant_id`              | UUID               | RLS scope                                                   |
| `payment_id`             | UUID FK            | Payment run/line                                            |
| `invoice_id`             | UUID FK (nullable) | Specific invoice                                            |
| `event_at`               | timestamptz        | When status changed                                         |
| `stage`                  | enum               | SCHEDULED/APPROVED/PROCESSING/SENT/CLEARED/REJECTED/ON_HOLD |
| `previous_stage`         | enum (nullable)    | For state machine validation                                |
| `source`                 | enum               | ERP/BANK_FILE/MANUAL_OVERRIDE                               |
| `source_precedence`      | smallint           | 1=BANK_FILE (highest), 2=ERP, 3=MANUAL                      |
| `reference`              | varchar            | Bank trace / file ref                                       |
| `hold_reason`            | enum (nullable)    | From taxonomy (§5 Phase 1.4)                                |
| `supplier_visible_label` | varchar            | From Status Dictionary — never raw hold_reason              |
| `next_action_href`       | varchar (nullable) | Deep link to case/doc/page for "what do I do?"              |
| `note`                   | text (nullable)    | Human-readable                                              |
| `created_by`             | UUID               | Actor                                                       |

### 7.3 Case Table (replaces disputes)

**Table: `supplier_case`** (replaces `supplier_dispute`)

| Column               | Type                   | Purpose                                              |
| -------------------- | ---------------------- | ---------------------------------------------------- |
| `id`                 | UUID PK                | —                                                    |
| `tenant_id`          | UUID                   | RLS scope                                            |
| `ticket_number`      | varchar(30)            | `CASE-{TENANT}-{YYYY}-{SEQ}`                         |
| `supplier_id`        | UUID FK                | —                                                    |
| `category`           | enum                   | Extended taxonomy                                    |
| `priority`           | enum                   | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`                  |
| `subject`            | varchar(255)           | —                                                    |
| `description`        | text                   | —                                                    |
| `status`             | enum                   | 8-status lifecycle (state machine in SP-4000)        |
| `assigned_to`        | UUID FK (nullable)     | Buyer-side resolver                                  |
| `co_assignees`       | UUID[]                 | Additional resolvers (warehouse, procurement)        |
| `linked_entity_id`   | UUID (nullable)        | Any portal entity                                    |
| `linked_entity_type` | enum (nullable)        | `INVOICE`, `PAYMENT`, `DOCUMENT`, `COMPLIANCE`, `PO` |
| `sla_deadline`       | timestamptz (nullable) | SLA timer                                            |
| `resolution`         | text (nullable)        | —                                                    |
| `root_cause`         | text (nullable)        | Training/audit data                                  |
| `corrective_action`  | text (nullable)        | For knowledge base                                   |
| `resolved_by`        | UUID (nullable)        | —                                                    |
| `resolved_at`        | timestamptz (nullable) | —                                                    |
| `escalation_id`      | UUID FK (nullable)     | Link to breakglass if escalated                      |
| `proof_chain_head`   | varchar(64) (nullable) | Latest hash in proof chain                           |
| `created_by`         | UUID                   | —                                                    |
| `...timestamps()`    | —                      | —                                                    |

### 7.4 Case Timeline Table (unified activity stream — single storage truth)

`supplier_case_timeline` is the **canonical append-only stream** for all portal
activity. It is the single source of truth for "what happened, in what order."

**No dual-writing rule:** Source-entity tables (`supplier_message`,
`supplier_document`, `portal_escalation`, etc.) store their own domain data
(message body, file metadata, SLA config). The timeline table **references**
them via `ref_id` + `ref_type` — it does not duplicate their content. This
means:

- Reading a case timeline = query `supplier_case_timeline ORDER BY created_at`
- Reading message details = join to `supplier_message` via `ref_id`
- No divergence risk: timeline is append-only, source tables are mutable (e.g.,
  message edits update `supplier_message`, not the timeline entry)

**Table: `supplier_case_timeline`** (§2.4)

| Column       | Type        | Purpose                                                                                                           |
| ------------ | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `id`         | UUID PK     | —                                                                                                                 |
| `case_id`    | UUID FK     | —                                                                                                                 |
| `tenant_id`  | UUID        | RLS                                                                                                               |
| `entry_type` | enum        | `status`, `message`, `attachment`, `escalation`, `sla_breach`, `payment`, `match`, `system`                       |
| `ref_id`     | UUID        | FK to source entity (message, document, escalation, payment fact, etc.) — nullable for pure status/system entries |
| `ref_type`   | varchar     | Source table name (`supplier_message`, `supplier_document`, `portal_escalation`, `supplier_payment_status_fact`)  |
| `actor_id`   | UUID        | —                                                                                                                 |
| `actor_type` | enum        | `SUPPLIER`, `BUYER`, `SYSTEM`                                                                                     |
| `content`    | JSONB       | Lightweight summary payload (status from/to, one-line description) — **not** full source data                     |
| `proof_hash` | varchar(64) | Link to proof chain entry                                                                                         |
| `created_at` | timestamptz | Immutable                                                                                                         |

### 7.5 Tamper-Evident Proof Chain (legal-grade spec)

**Table: `portal_communication_proof`**

| Column              | Type        | Purpose                                                                                       |
| ------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `id`                | UUID PK     | `event_id` in hash input                                                                      |
| `tenant_id`         | UUID        | RLS scope + chain scope                                                                       |
| `chain_position`    | bigint      | Sequence in chain (per tenant)                                                                |
| `event_type`        | varchar     | message_sent, case_status_changed, document_uploaded, escalation_triggered, payment_confirmed |
| `entity_id`         | UUID        | What this entry is about                                                                      |
| `entity_type`       | varchar     | case, message, document, payment                                                              |
| `actor_id`          | UUID        | Who triggered                                                                                 |
| `actor_type`        | enum        | `SUPPLIER`, `BUYER`, `SYSTEM`                                                                 |
| `event_at`          | timestamptz | Server UTC — part of hash input                                                               |
| `payload_canonical` | JSONB       | Canonical JSON (keys sorted) — part of hash input                                             |
| `content_hash`      | varchar(64) | SHA-256 hash (see formula below)                                                              |
| `previous_hash`     | varchar(64) | Link to prior entry in chain                                                                  |
| `payload_summary`   | text        | Human-readable action description                                                             |
| `created_at`        | timestamptz | DB insert time (may differ from event_at)                                                     |

**Hash formula:**

```
content_hash = SHA-256(
  id                          // event_id
  + event_type
  + entity_type
  + entity_id
  + actor_type
  + actor_id
  + event_at (ISO 8601 UTC)
  + JSON.stringify(payload_canonical, Object.keys(payload_canonical).sort())
  + previous_hash
)
```

**Chain scope:** One chain per `tenant_id` (default, locked). All portal events
for a tenant form a single linear chain. Cross-supplier entries are interleaved
(chain position is a global sequence within the tenant), which also prevents
selective omission across suppliers.

> **Tradeoff note:** Per-tenant means verification queries can span thousands of
> entries. Per-case or per-supplier would be lighter to verify but harder to
> prove "global ordering" (an attacker could omit entire cases). Tenant-wide is
> the right default for audit-grade proof; scoped queries use indexed filters.
>
> **Indexing strategy:** Composite index on
> `(tenant_id, entity_type, entity_id)` for scoped verification ("show me the
> chain segment for case X"). Additional index on `(tenant_id, chain_position)`
> for full-chain integrity checks. Both indexes make the per-tenant scope
> practical at scale.

**Periodic anchoring:** Daily cron job computes
`SHA-256(last_chain_position + head_hash + date)` and writes an anchor record to
`audit.audit_log` with `action = 'PORTAL_PROOF_DAILY_ANCHOR'`. This provides a
cross-referencing point for external auditors without requiring blockchain.
Optional future enhancement: submit anchor hash to RFC 3161 timestamping
authority.

**Verification workflow:**

1. Client requests chain segment for an entity (e.g., all entries for case X)
2. Client re-computes hashes from `chain_position[0]` to `chain_position[N]`
3. If any re-computed hash ≠ stored hash → **tampering detected**
4. Client can cross-check daily anchor against `audit.audit_log` entry

---

## 8. UX Patterns

### 8.1 PortalDataTable — Enterprise Hygiene Bundle

Built once in Phase 0, reused everywhere. Wraps existing `DataTable`.

| Capability             | Implementation                               |
| ---------------------- | -------------------------------------------- |
| Server-side pagination | `ListResponseSchema<T>` contract, URL params |
| Filter chips           | Client-side, synced to query params          |
| Saved views            | `localStorage`                               |
| Export CSV             | Client-side from filtered dataset            |
| Bulk actions           | Toolbar on row selection                     |
| Empty state            | Next-step CTA per context                    |

**Mobile mode:** Switches to card list (§5 Phase 1.5.3). No attempt to render
wide tables on small screens.

### 8.2 Unified Case Timeline

Every case detail page shows a single "Activity" stream:

```
┌──────────────────────────────────────────────────────────┐
│  CASE-AFD-2026-00142  │  Priority: HIGH  │  SLA: 23h    │
├──────────────────────────────────────────────────────────┤
│  Activity  [All ▼]  [Messages] [Status] [Docs] [System] │
│                                                          │
│  03/02 11:00  J.Smith (AP Manager)        [proof: a3f…]  │
│    💬 "Please provide the delivery note for INV-2026-031" │
│                                                          │
│  03/02 09:15  System                      [proof: b7e…]  │
│    🔄 Assigned to J.Smith (AP Manager)                    │
│                                                          │
│  03/01 14:31  System                      [proof: c2d…]  │
│    📋 Case auto-created: amount mismatch on INV-2026-031  │
│                                                          │
│  03/01 14:30  System                      [proof: d1a…]  │
│    ⚡ Amount mismatch flagged (system auto-check)          │
│                                                          │
│  03/01 10:00  Supplier (Portal)           [proof: e9f…]  │
│    📄 Invoice submitted: INV-2026-031                     │
└──────────────────────────────────────────────────────────┘
```

Each entry links to its proof-chain hash — clicking opens the verification page
for that specific entry.

### 8.3 Case Resolution Workspace (CAP-MATCH)

The multi-persona resolution screen (P21) uses a column layout:

```
┌──────────────────────────────────────────────────────────┐
│  CASE-AFD-2026-00142  │  Priority: HIGH  │  SLA: 23h    │
├──────────┬──────────┬──────────┬───────────────────────────┤
│ Invoice  │ Supplier │   GR     │    PO                     │
│  (AP)    │ (Portal) │ (Whse)   │ (Procure)                 │
│          │          │          │                           │
│ ✓ Amount │ ⟳ Docs   │ ◌ Ph.2   │ ◌ Ph.2                    │
│ ✓ Tax    │   needed │          │                           │
│ ✗ Ref    │          │          │                           │
│          │          │          │                           │
│ Assigned:│ Contact: │ Pending  │ Pending                   │
│ J.Smith  │ Supplier │          │                           │
└──────────┴──────────┴──────────┴───────────────────────────┘
│ Unified Timeline (§8.2) ─────────────────────────────────│
└──────────────────────────────────────────────────────────┘
```

**Mobile (CAP-PWA):** Columns become swipeable tabs — one per persona. Sticky
status bar shows overall case status + SLA countdown. Detail drawer for actions.

### 8.4 Breakglass UX (CAP-SOS)

SOS button appears:

1. In portal header (always accessible — requires `ESCALATE` permission)
2. On any case detail that is past SLA
3. On any payment detail showing `ON_HOLD` for >N days

Flow: Click SOS → system auto-creates/escalates case → assigns senior manager
from directory → supplier sees assigned manager + SLA countdown → proof-chain
entry created → case timeline entry: "⚠ Escalated to Level 1".

### 8.5 Mobile Card Layout (CAP-PWA)

Desktop `PortalDataTable` is replaced on mobile with:

| Element      | Desktop                     | Mobile                                                      |
| ------------ | --------------------------- | ----------------------------------------------------------- |
| List view    | Table with sortable columns | **Card stack** (status badge + amount + date + next action) |
| Status       | Inline column               | **Sticky status bar** at card top                           |
| Actions      | Row action menu             | **Bottom CTA button** ("View" / "Respond" / "Upload")       |
| Detail       | Navigate to detail page     | **Bottom drawer** (swipe up for full detail)                |
| Bulk actions | Toolbar on row select       | **Not available** on mobile (force desktop for bulk ops)    |
| Filters      | Filter chips above table    | **Collapsible filter drawer**                               |

---

## 9. Verification

| Check                        | Command / Method                                                       | SP#      |
| ---------------------------- | ---------------------------------------------------------------------- | -------- |
| TypeScript compilation       | `pnpm typecheck`                                                       | —        |
| Unit + integration tests     | `pnpm test`                                                            | SP-8000+ |
| Architecture drift           | `pnpm arch:guard`                                                      | —        |
| CI gates                     | `gate-web-module.mjs`, `gate-db-module.mjs`                            | —        |
| E2E: onboarding              | invite → wizard → approval                                             | SP-8010  |
| E2E: case lifecycle          | create → assign → resolve → close (via unified timeline)               | SP-8011  |
| E2E: breakglass              | SOS → auto-assign → SLA countdown → resolution                         | SP-8012  |
| E2E: payment tracking        | invoice → payment run → status timeline → cleared                      | SP-8013  |
| E2E: proof chain             | message sent → verify hash → download certificate                      | SP-8014  |
| E2E: recon session           | upload → results → save → history → revisit                            | SP-8015  |
| E2E: compliance              | expiring → reminder → upload → cleared                                 | SP-8016  |
| E2E: bulk upload             | 200 rows → dedupe → errors → fix & retry failed                        | SP-8017  |
| E2E: announcement            | buyer posts → supplier sees banner                                     | SP-8018  |
| E2E: idempotency             | duplicate submit → same result, no double-create                       | SP-8019  |
| E2E: SoD enforcement         | bank account propose → different user approves                         | SP-8020  |
| E2E: case ↔ message timeline | message on case → appears in unified timeline with proof hash          | SP-8021  |
| Accessibility                | axe-core, WCAG 2.2 AA                                                  | SP-9010  |
| Performance                  | Lighthouse ≥ 90 on portal dashboard                                    | SP-9011  |
| OpenAPI                      | All endpoints in generated spec                                        | SP-9012  |
| Load test                    | k6: 500 concurrent sessions                                            | SP-9013  |
| Rate limit                   | k6 burst test on mutations (keyed by `actorFingerprint`)               | SP-9014  |
| Proof chain integrity        | Property test: hash chain is continuous, no gaps, daily anchor matches | SP-8022  |
| Document access              | `audit.audit_log` entries per download                                 | SP-8023  |
| Payment state machine        | Property test: no impossible stage transitions                         | SP-8024  |
| Hold reason safety           | No `FRAUD_SUSPICION` or internal-only labels exposed to supplier       | SP-8025  |
| Dedupe fingerprint           | Same invoice re-uploaded → deterministic fingerprint match             | SP-8026  |

---

## 10. Decisions Log

| #   | Decision                                               | Chose                                                                                                                                    | Over                                     | Why                                                                                                                                                                                           |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Two-phase split**                                    | Phase 1 (AP) then Phase 2 (Procurement)                                                                                                  | Single 12-week plan with PO Flip         | AP module is fully built; procurement domain doesn't exist. Building PO features on projections creates throwaway code.                                                                       |
| D2  | **Portal Kernel as dedicated package**                 | `packages/supplier-kernel/` (`@afenda/supplier-kernel`)                                                                                  | Embedding in `slices/ap/kernel/`         | Clean import boundary, no `arch-guard` exceptions, reusable by Phase 2 procurement without cross-slice imports. Follows `@afenda/core`, `@afenda/platform` pattern.                           |
| D3  | **Kernel gated — no feature merges before P0**         | Phase 0 as hard gate                                                                                                                     | Feature-led start                        | Prevents identity/audit/notification inconsistency. Codebase confirms gaps (unassigned roles, unused notification infra, no audit hook).                                                      |
| D4  | **Status Dictionary first (SP-1003 before SP-1001)**   | First kernel component                                                                                                                   | Last step (was 0.11)                     | Prevents inconsistent UX strings across everything built after. Dictionary must exist before any feature renders statuses.                                                                    |
| D5  | **Cases replace disputes**                             | `supplier_case` with tickets/SLA/assignment                                                                                              | Keep `supplier_dispute` as-is            | Enterprise needs structured tickets, SLA tracking, knowledge base training data. Current 4-status dispute model is too thin.                                                                  |
| D6  | **Case as backbone (P20 before P5)**                   | Cases first, messaging as case comments initially                                                                                        | Messaging and cases in parallel          | Prevents timeline divergence between P5/P20/P26. Messages anchor to cases from day one.                                                                                                       |
| D7  | **Unified case timeline**                              | Single "Activity" stream per case                                                                                                        | Separate message/status/doc widgets      | If timelines diverge, user trust collapses. Single stream with filters, not separate widgets.                                                                                                 |
| D8  | **Breakglass escalation**                              | Built-in SOS + auto-assignment + SLA                                                                                                     | Rely on email escalation                 | No mid-market ERP has this. `PORTAL_READONLY` cannot trigger (SoD). Uses existing directory/notification infrastructure.                                                                      |
| D9  | **Tamper-evident: hash chain (not Merkle/blockchain)** | Linear SHA-256 hash chain + daily anchoring                                                                                              | Actual blockchain / Merkle tree          | Gas costs, latency, regulatory uncertainty. "Audit-grade immutability and provability" (not "same legal weight" without signature semantics). Linear chain, not branching tree.               |
| D10 | **Proof chain legal-grade spec**                       | Deterministic hash input (event_id + type + entity + actor + timestamp + canonical JSON + prev_hash) + daily anchor to `audit.audit_log` | Loose "blockchain-style" claim           | Auditors will ask what's hashed, how authorship is proven, how re-ordering is prevented. Spec answers all three.                                                                              |
| D11 | **3-way match as phased columns**                      | AP + Supplier columns in Phase 1; GR + PO in Phase 2                                                                                     | Wait for procurement to build full match | Delivers immediate value (AP-side resolution) without depending on unbuilt domain.                                                                                                            |
| D12 | **Payment status as facts**                            | Append-only `supplier_payment_status_fact` with state machine + source precedence                                                        | Status column on payment run             | SOX-safe, multi-source (BANK_FILE > ERP > MANUAL), trivial timeline UI. No impossible stage transitions.                                                                                      |
| D13 | **Hold reason taxonomy: supplier-safe**                | "Verification pending" instead of "Fraud suspicion"                                                                                      | Expose raw internal labels               | Never expose "fraud" to supplier. Each hold maps to: visible label + next action.                                                                                                             |
| D14 | **Dynamic discounting bounds**                         | Match-clean invoices only, immutable agreements, GL rules upfront                                                                        | Unrestricted offers                      | Prevents accounting debates and audit exposure.                                                                                                                                               |
| D15 | **Supplier API model**                                 | Scoped keys + HMAC webhooks + versioned events + 2-person control (SoD)                                                                  | Basic API key                            | Enterprise-grade. Key creation ≠ key activation (owner approval required).                                                                                                                    |
| D16 | **Messaging transport**                                | SSE polling                                                                                                                              | WebSocket                                | No Redis/WS server. "No over-engineering" — PROJECT.md.                                                                                                                                       |
| D17 | **Mobile**                                             | PWA + card-first lists (not tables) + detail drawer                                                                                      | Full offline or native                   | True offline is disproportionately hard. Card layout is the real deliverable, not "touch-friendly tables".                                                                                    |
| D18 | **Appointments**                                       | Lightweight meeting request (propose 3 slots)                                                                                            | Full calendar system                     | No calendar infrastructure exists. Meeting requests are sufficient for Phase 1.                                                                                                               |
| D19 | **Directory scope**                                    | Curated `portal_directory_entry` (buyer-maintained)                                                                                      | Auto-generated org chart from HR         | No HR/org-chart domain exists. Curated directory is privacy-safe and immediately useful.                                                                                                      |
| D20 | **Document vault evolution**                           | Add versioning + lifecycle + reverse sharing to existing vault                                                                           | Build new document system                | Vault already has SHA-256 integrity, categories, upload/list/verify. Extend, don't replace.                                                                                                   |
| D21 | **Announcement model**                                 | `portal_announcement` table + persistent banner                                                                                          | Reuse Boardroom announcements            | Boardroom is internal. Portal announcements are supplier-facing, tenant-scoped, with `validFrom`/`validUntil`. Different lifecycle.                                                           |
| D22 | **Rate limiting from day one**                         | Per-user (keyed by `actorFingerprint`) + per-API-key                                                                                     | Add later                                | Internet-facing, free portal — security can't be bolted on.                                                                                                                                   |
| D23 | **Query file split**                                   | Per-domain files                                                                                                                         | Single monolith                          | Matches finance pattern. Scales to 60+ queries.                                                                                                                                               |
| D24 | **Status Dictionary**                                  | Single source of truth                                                                                                                   | Ad-hoc strings                           | Prevents contradicting labels across pages.                                                                                                                                                   |
| D25 | **SoD: two role families**                             | Supplier-side (OWNER/FINANCE/OPS/READONLY) + buyer-side (AGENT/MANAGER/EXECUTIVE_ESCALATION)                                             | Single flat role model                   | Portal will be shared inside supplier orgs + buyer staff handle cases. Bank accounts and API keys require 2-person control. Extends existing `FINANCE_SOD_RULES` pattern from `sod-rules.ts`. |
| D26 | **Idempotency from day one**                           | `Idempotency-Key` on all mutation endpoints, reusing `IIdempotencyStore.claimOrGet()`                                                    | Add later                                | Portal is internet-facing; retries happen. Idempotency store and claim/get port already exist in codebase (`packages/core/src/ports/idempotency-store.ts`).                                   |
| D27 | **Bulk upload dedupe**                                 | Deterministic row fingerprint + explicit policy (skip/update/reject)                                                                     | Silent overwrite or reject-all           | Enterprise suppliers re-upload the same file. Fingerprint makes dedupe deterministic. Policy is explicit per upload — no surprises.                                                           |
| D28 | **Tracking annotation (SP-\*)**                        | Stable numeric work-item codes per file/component with layer series + extension + revision. SP codes track files, not minor changes.     | Free-form ticket names                   | Human-scannable, machine-parseable, works across tickets/commits/code comments/visual review. Registry in `portal-registry.ts` makes status queryable.                                        |
| D29 | **Supplier-safe language gate**                        | Formal DoD gate (#12): no internal labels/hold reasons/error codes reach supplier UI. SP-8025 CI test enforces.                          | Risk-register-only warning               | Leakage of "FRAUD_SUSPICION" or similar would erode supplier trust and create legal exposure. Promoting to gate makes it enforceable.                                                         |

---

## 11. Risk Register

| Risk                               | Impact                                                 | Mitigation                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **P5/P20/P26 timeline divergence** | Rework when meshing messages, cases, and docs          | D6/D7: Cases as backbone, unified timeline from day one. Messages are always anchored to a case.                                              |
| **13-week scope creep**            | Phase 1 slips, Phase 2 never starts                    | Capability codes (`CAP-*`) + SP-\* tracking + weekly burn-down against registry. Each capability has clear DoD (§4).                          |
| **Supplier account sharing**       | Audit trail is meaningless if 5 people share one login | SP-1002 roles + per-user identity + `actorFingerprint` on each `PortalRequestContext`. Encourage OWNER to invite team members via onboarding. |
| **Rate limiting bypass**           | Abuse of free portal                                   | `actorFingerprint` (IP + UA hash) as secondary key even if user rotates API keys. k6 burst tests in CI.                                       |
| **Proof chain gap (missed event)** | Chain integrity broken — auditors reject               | SP-1006 writer must be called in the same DB transaction as the event it proves. Property test (SP-8022) verifies continuity.                 |
| **Payment hold label leakage**     | Internal "fraud suspicion" shown to supplier           | SP-1003 Status Dictionary is the only source of supplier-visible labels. Tests (SP-8025) assert no raw hold reasons reach the frontend.       |
| **Bulk upload partial failure**    | 200 rows, 12 fail — supplier confused about state      | Batch ID + row-level status + retry-only-failed within same batch. Clear UI: green rows done, red rows need attention.                        |
| **Mobile UX regression**           | "Touch-friendly tables" ships as a scaled-down desktop | D17: Card-first mobile is a separate deliverable. E2E test runs on mobile viewport.                                                           |

---

## 12. Implementation Progress

> Last updated: **2026-03-03** | Build status: **? `@afenda/finance` � 0
> TypeScript errors**
>
> Legend: ? Done � ?? Partial � ? Not started � ?? Blocked

### 12.1 Phase 0 � Kernel

| SP#     | Component             | Status | Notes |
| ------- | --------------------- | ------ | ----- |
| SP-1001 | Portal Identity       | ?      | �     |
| SP-1002 | Permissions Model     | ?      | �     |
| SP-1003 | Status Dictionary     | ?      | �     |
| SP-1004 | Notification Backbone | ?      | �     |
| SP-1005 | Audit Log Middleware  | ?      | �     |
| SP-1006 | Proof Chain Writer    | ?      | �     |
| SP-1007 | Attachment Policy     | ?      | �     |
| SP-1008 | Case ID Generator     | ?      | �     |
| SP-1009 | Idempotency Standard  | ?      | �     |
| SP-1010 | PortalRequestContext  | ?      | �     |

### 12.2 Phase 1.3 � Invoice Operations (CAP-BULK, CAP-CRDB, CAP-MATCH)

| SP#     | CAP       | Layer          | Status | Notes                                                                                                                                           |
| ------- | --------- | -------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| SP-2013 | CAP-BULK  | Contracts      | ?      | `BulkUploadBatch`, `BulkUploadRow`, `DedupePolicy`, `BulkUploadRowResult` Zod schemas                                                           |
| SP-5015 | CAP-BULK  | Service        | ?      | `processBulkUpload()` � SHA-256 row fingerprint, per-row validation, SKIP / UPDATE_DRAFT / REJECT_CONFLICTS dedup policies                      |
| SP-6013 | CAP-BULK  | Route+Frontend | ?      | `POST /portal/suppliers/:id/invoices/bulk-upload`; `portal-bulk-upload-form.tsx` (CSV template, row preview, dedup selector)                    |
| SP-2014 | CAP-CRDB  | Contracts      | ?      | `CreditDebitDocumentTypeSchema`, `SubmitCreditDebitNoteSchema`, `CreditDebitNoteResponseSchema`                                                 |
| SP-5016 | CAP-CRDB  | Service        | ?      | `submitCreditDebitNote()` � signed amount logic, supplier active + currency + original-invoice guards                                           |
| SP-6011 | CAP-CRDB  | Route+Frontend | ?      | `POST /portal/suppliers/:id/invoices/credit-debit-note`; `portal-credit-debit-note-form.tsx`; `/portal/invoices/credit-debit-note/new/page.tsx` |
| SP-6012 | CAP-MATCH | Frontend       | ?      | `/portal/invoices/[id]/resolution/page.tsx` � 4-column AP-side workspace; GR + PO are Phase 2 placeholders                                      |

### 12.3 Phase 1.4 � Payment Intelligence (CAP-PAY-ETA, CAP-SCF)

| SP#     | CAP         | Layer     | Status | Notes                                                                                          |
| ------- | ----------- | --------- | ------ | ---------------------------------------------------------------------------------------------- |
| SP-2011 | CAP-PAY-ETA | Contracts | ?      | Payment stage contracts                                                                        |
| SP-3008 | CAP-PAY-ETA | DB        | ?      | `supplier_payment_status_fact` append-only table                                               |
| SP-5011 | CAP-PAY-ETA | Service   | ?      | Payment ETA service                                                                            |
| SP-5012 | CAP-PAY-ETA | Service   | ?      | Payment stage state machine (no impossible transitions)                                        |
| SP-5013 | CAP-PAY-ETA | Service   | ?      | Hold reason ? supplier-safe label mapper                                                       |
| SP-7011 | CAP-PAY-ETA | Frontend  | ?      | Payment ETA portal page                                                                        |
| SP-5014 | CAP-SCF     | Service   | ?      | `supplier-portal-scf.ts` � early payment offer CRUD; all 5 SCF routes via `runtime.withTenant` |

### 12.4 DB Schema Changes (CAP-CRDB)

| Table         | Change                                                                                 | Status |
| ------------- | -------------------------------------------------------------------------------------- | ------ |
| `ap_invoices` | Added `apInvoiceTypeEnum` pg enum (`STANDARD / DEBIT_MEMO / CREDIT_MEMO / PREPAYMENT`) | ?      |
| `ap_invoices` | Added `invoice_type` column (not null, default `STANDARD`)                             | ?      |
| `ap_invoices` | Added `original_invoice_id` UUID self-FK (nullable, `AnyPgColumn` to break TS cycle)   | ?      |

### 12.5 Bug Fixes Applied

| File                               | Bug                                                                        | Fix                                                               |
| ---------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `drizzle-early-payment-offer-repo` | `this.tx.db.*` � `TenantTx` is `PgTransaction`, has no `.db` sub-property  | Replaced 8� with direct `this.tx.*`                               |
| `supplier-portal-routes.ts`        | 5 SCF routes used undefined `deps` (from stale `deps.withTx()` pattern)    | Rewrote to `runtime.withTenant({ tenantId, userId }, ...)`        |
| `supplier-portal-routes.ts`        | `'users:manage'` not a valid `FinancePermission`                           | Changed to `'USER_MANAGE'`                                        |
| `error-mapper.ts`                  | `mapErrorToStatus` required `AppError`; `ScfError` is a plain object union | Widened param to `AppError \| { code: string }`                   |
| `db/schema/erp.ts`                 | Self-referential `apInvoices.id` FK caused implicit `any` TS cycle         | Added `: AnyPgColumn` return annotation to `.references()` lambda |
| `drizzle-early-payment-offer-repo` | `create()` insert was missing required `tenantId` column                   | Added `tenantId` to method signature and insert values            |
| `supplier-portal-bulk-upload.ts`   | `rowsToSubmit` typed via conditional infer � resolves to `never`           | Replaced with explicit `BulkUploadRow` type                       |

### 12.6 Build Health

| Package             | Status     | Last verified |
| ------------------- | ---------- | ------------- |
| `@afenda/contracts` | ? 0 errors | 2026-03-03    |
| `@afenda/db`        | ? 0 errors | 2026-03-03    |
| `@afenda/finance`   | ? 0 errors | 2026-03-03    |

### 12.7 Next Up

- [ ] Phase 0 kernel: scaffold `@afenda/supplier-kernel` package + SP-1001
      through SP-1010
- [ ] Phase 1.1: CAP-CASE � `supplier_case` + `supplier_case_timeline` tables,
      8-status lifecycle, auto-generated ticket numbers
- [ ] Phase 1.1: CAP-ONB � onboarding wizard multi-step form
- [ ] Web app TS check: `pnpm --filter apps/web tsc --noEmit` � verify
      resolution page supplier field types
- [ ] Portal registry: add SP-1001�SP-1010 kernel entries to
      `portal-registry.ts`
