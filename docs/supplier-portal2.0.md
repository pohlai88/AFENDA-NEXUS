## 1. Vision & Strategic Context

### 1.1 What exists today (Portal v1)

| Layer      | Inventory                                                                  |
| ---------- | -------------------------------------------------------------------------- |
| Backend    | 11 services (N1–N11), 17+ Fastify endpoints, all with `requirePermission` |
| DB         | 24 supplier tables with RLS, full MDM model                                |
| Frontend   | 38 pages (19 unique + `loading.tsx` pairs), 23 feature files               |
| Contracts  | ~20 portal-specific + ~15 MDM Zod schemas                                  |
| Tests      | 2 files (1,796 lines), N1–N11 unit tests with mock repos                   |
| Shell      | Dedicated `(supplier-portal)` route group, own sidebar/topbar              |
| Events     | 11 domain events (`SUPPLIER_*`) registered in `events.ts`                  |
| Navigation | 8 sidebar items: Dashboard–Settings                                        |

### 1.2 The two-phase rationale

The codebase has a **fully built AP module** but **no procurement domain**. Building procurement-dependent features (PO Flip, Catalog, Sourcing) on top of a missing domain creates projection tables, lifecycle mismatches, and throwaway code. Therefore:

| Phase | Name | Depends on | Timeline | Description |
| --- | --- | --- | --- | --- |
| **Phase 1** | **AP-Anchored Portal** | Existing AP module (fully dev) | 13 weeks | Everything a supplier needs to interact with Accounts Payable: invoices, payments, reconciliation, cases, messaging, compliance, document vault, onboarding, audit trail, API access |
| **Phase 2** | **Procurement-Anchored Portal** | Procurement module (not started) | After procurement module ships | PO Flip, Catalog Management, Sourcing, Goods Receipt visibility, Supplier Evaluation Scorecard, Contractor/Lease variants |

Phase 1 delivers a **complete, production-ready** portal grounded in finance truth. Phase 2 extends it with procurement capabilities when the domain exists.

### 1.3 Where we're going

**Trade & payment communication platform** — serving suppliers, contractors,
and leasers as internal and external partners. Free for suppliers, driving AP
module stickiness. Benchmarking against SAP Ariba, Coupa, Tipalti, Bill.com,
Taulia, and C2FO.

---

## 2. Feature Classification

### 2.1 Phase 1: AP-Anchored (13 weeks after kickoff)

| # | Feature | Class | Rationale |
| --- | --- | --- | --- |
| **P1** | Supplier Onboarding Wizard (self-registration, KYC upload, approval) | **ESSENTIAL** | DB has `supplierOnboardingStatusEnum` but zero UI. Coupa/Ariba's #1 value prop. |
| **P2** | Real-Time Payment Tracking & ETA | **SILENT KILLER** | Suppliers' #1 complaint. Tipalti/Bill.com differentiate here. Currently static payment-run list. |
| **P3** | Early Payment / Dynamic Discounting | **SILENT KILLER** | Taulia/C2FO's model. No mid-market ERP offers this integrated. Genuine moat. |
| **P5** | Messaging Hub (two-way communication) | **ESSENTIAL** | Roadmap mentions "communication hub." Currently disputes are the only channel. |
| **P8** | Compliance & Certificate Management (expiry alerts) | **ESSENTIAL** | DB has `supplier_compliance_item` with statuses. Missing: automated reminders, renewal workflow. |
| **P9** | Multi-Entity / Multi-Company Portal View | **GOOD TO HAVE** | Supplier trades with 3 entities → unified view. Currently single-scope. |
| **P11** | Mobile-Responsive PWA | **ESSENTIAL** | 40%+ supplier users on mobile. Desktop-first layout today. |
| **P12** | White-Label Portal Branding | **GOOD TO HAVE** | Buyer's logo/colors on portal. Low effort with CSS variables. |
| **P13** | Bulk Invoice Upload (CSV/Excel/E-Invoice) | **ESSENTIAL** | Current submit is single. Enterprise suppliers send hundreds/month. |
| **P14** | Audit Trail / Activity Log (self-service) | **ESSENTIAL** | Required for SOX/ISAE. Finance has activity feed — portal has nothing. |
| **P15** | Credit Note / Debit Note Submission | **ESSENTIAL** | Backend e-invoice builder already supports credit/debit notes. |
| **P16** | Advanced Search, Filtering, Pagination | **ESSENTIAL** | Portal queries accept params but UI doesn't wire them. |
| **P18** | Webhook / API Access for Suppliers | **SILENT KILLER** | Enterprise suppliers want API, not portal clicks. |
| **P19** | Breakglass Escalation (SOS button) | **ESSENTIAL** | See §2.3 — supplier's lifeline when standard channels fail. |
| **P20** | Case Management (upgrade from "disputes") | **ESSENTIAL** | See §2.3 — structured ticket system replacing simple disputes. |
| **P21** | 3-Way Match Resolution Screen (AP-side) | **ESSENTIAL** | See §2.3 — multi-persona resolution workspace. |
| **P22** | Company Location / Address Directory | **ESSENTIAL** | See §2.3 — supplier needs buyer's delivery/billing addresses. |
| **P23** | Senior Management Directory (org chart contacts) | **ESSENTIAL** | See §2.3 — government-body inspired contact directory. |
| **P24** | Dashboard Announcements / Pinned Messages | **ESSENTIAL** | See §2.3 — company banner, service closures, policy changes. |
| **P25** | Tamper-Evident Communication Log | **SILENT KILLER** | See §2.3 — blockchain-style proof of record for all portal comms. |
| **P26** | Document Vault (enhanced) | **ESSENTIAL** | See §2.3 — contract lifecycle, version history, dual-party sharing. |
| **P27** | Appointment Scheduling | **GOOD TO HAVE** | See §2.3 — meeting booking with buyer-side contacts. |

### 2.2 Phase 2: Procurement-Anchored (after procurement module ships)

| # | Feature | Class | Rationale |
| --- | --- | --- | --- |
| **P6** | PO Flip / Order Confirmation | **ESSENTIAL** | Requires procurement PO domain — projections are fragile without it. |
| **P7** | Goods Receipt / 3-Way Match (procurement-side GR) | **GOOD TO HAVE** | GR data comes from procurement/warehouse domain. |
| **P4** | Supplier Performance Scorecard & Analytics | **GOOD TO HAVE** | DB tables exist but evaluation criteria are procurement-defined. |
| **P10** | Catalog / Price List Management | **GOOD TO HAVE** | Requires procurement sourcing domain. |
| **P17** | Contractor & Lease Portal Variants | **GOOD TO HAVE** | Persona explosion risk — validate Phase 1 first. |

### 2.3 Ad-Hoc Ideas — Evaluation

#### P19: Breakglass Escalation (SOS Button) — **STRONG YES**

> *"Supplier's SOS button to find next level or top management if dispute,
> payment, anything didn't get response. A dedicated senior manager assigned,
> similar to Relationship Manager."*

**Verdict: ESSENTIAL.** This is a genuine differentiator. No mid-market ERP
portal has this. It transforms the portal from a "submit and hope" window into a
**guaranteed resolution channel**. Think of it as SWIFT's complaint escalation or
FCA's "final response" mechanism.

**Implementation model:**

| Concept | Detail |
| --- | --- |
| **Trigger** | Supplier clicks "Escalate" on any case/invoice/payment that has been unresolved for >N days (configurable SLA). Also available as a manual SOS button in the portal header. |
| **Auto-assignment** | System assigns a senior manager from the buyer's escalation roster (`portal_escalation_contact` table — a subset of the management directory P23). Round-robin or least-loaded. |
| **SLA clock** | Escalated case gets a hard SLA (e.g., 48h response, 5-day resolution). Countdown visible to both parties. Breach → auto-notify next level up. |
| **Visibility** | Supplier sees: assigned manager's name/title/email, SLA countdown, case timeline. Manager sees: all case history, supplier's full context (recent invoices, payments, compliance). |
| **Audit** | Every escalation creates an immutable tamper-evident record (reusing K4 hash-chain from tamper-resistant outbox). |

**Why it works in this codebase:** The tamper-resistant outbox (`K4`) already has SHA-256 hash-chain integrity. The `supplier_contact` table already has `role` enum including `EXECUTIVE`. The notification backbone (kernel P0) delivers to the right people. This is infrastructure-ready — the gap is the workflow + UI.

---

#### P20: Case Management (replacing "disputes") — **STRONG YES**

> *"Replace or upgrade 'dispute' to 'usecase' or 'case' with specific ticket
> number, that such case can serve for training or upgrading purpose in the
> future."*

**Verdict: ESSENTIAL.** The current dispute model (`OPEN → IN_REVIEW → RESOLVED → REJECTED`, 7 categories) is too limited for enterprise. Renaming to "Case" and adding a ticket number system transforms it into:

| Current (dispute) | Upgraded (case) |
| --- | --- |
| 4 statuses | 8 statuses: `DRAFT → SUBMITTED → ASSIGNED → IN_PROGRESS → AWAITING_INFO → RESOLVED → CLOSED → REOPENED` |
| 7 hardcoded categories | Extensible category taxonomy: payment, invoice, compliance, delivery, quality, onboarding, general, **escalation** (from P19) |
| No ticket number | Auto-generated ticket: `CASE-{TENANT_SHORT}-{YYYY}-{SEQ}` (e.g., `CASE-AFD-2026-00142`) |
| No assignment | Assigned resolver (buyer-side), optional co-assignees |
| No SLA | SLA per category + priority. Timer visible to supplier. |
| Single resolution text | Resolution + root cause + corrective action fields (training/audit data) |
| No knowledge base | Closed cases (anonymized) can be tagged for FAQ/knowledge base extraction |
| Links to invoice/payment only | Links to any portal entity: invoice, payment, PO, document, compliance item |

**Migration:** The existing `supplier_dispute` table (19 columns, 2 indexes) is small. Add new `supplier_case` table alongside, migrate existing disputes as cases, deprecate dispute endpoints with 301 redirects. Keep the dispute Zod schemas as aliases during transition.

---

#### P21: 3-Way Match Resolution Screen — **STRONG YES (reimagined)**

> *"3-way matching will involve 3 internal + external. Internal: warehouse GRN,
> procurement PO, invoice finance/account. Hence dedicated persona assigned to
> resolve dispute or follow up status in the same screen."*

**Verdict: ESSENTIAL — but must be Phase 1 AP-side first, Phase 2 completes
procurement side.**

This is more sophisticated than simple "match visibility" (old P7). It's a
**multi-persona resolution workspace** where each party (warehouse, procurement,
AP) has a dedicated column and the supplier sees overall status. In Phase 1
(AP-only), we build the **AP invoice column + supplier column** with placeholder
for GR/PO columns. In Phase 2, we fill them in when procurement domain ships.

| Column | Phase | Persona | What they resolve |
| --- | --- | --- | --- |
| **Invoice (AP)** | 1 | AP clerk / AP manager | Amount discrepancies, duplicate invoices, tax issues |
| **Supplier** | 1 | Supplier (portal user) | Missing docs, incorrect references, amount confirmation |
| **GR (Warehouse)** | 2 | Warehouse/receiving | Quantity received vs ordered, quality issues, damage |
| **PO (Procurement)** | 2 | Procurement officer | PO terms, pricing, delivery schedule |

**Key design:** Each column shows its own status + actions. The case (P20) is
the umbrella. The resolution screen is a case detail view with dedicated columns
per persona. Multi-role assignment allows the supplier to see exactly who in
each department is handling their case.

---

#### P22: Company Location / Address Directory — **YES**

> *"Facilitate supplier easier references to company location addresses."*

**Verdict: ESSENTIAL.** Surprisingly absent from the portal. Supplier needs to
know: where to ship, where to send invoices, which entity address for tax
documents. The `supplier_site` table already has address fields (`addressLine1`,
`city`, `country`, `postalCode`) — but that's the *supplier's* addresses. We
need the buyer's addresses exposed to the supplier.

**Implementation:**
- New `portal_company_location` projection table (or read from existing `entity`
  table if entity addresses exist)
- Portal page `/portal/company/locations` — map view + list with address cards
- Each location shows: type (HQ, warehouse, billing), primary contact, business
  hours
- Links from invoice/case screens: "View delivery address" → location card

---

#### P23: Senior Management Directory — **YES (with guard rails)**

> *"Dedicated senior management team in the org chart or directory for
> contacting purposes, inspiration from government bodies."*

**Verdict: ESSENTIAL.** Government procurement portals (UK GOV.UK, Singapore
GeBiz) publish a directory of authorized contacts per department. This builds
supplier trust and enables the breakglass escalation (P19).

**Implementation:**
- **NOT a full org chart** — that's HR domain scope, doesn't exist. Instead: a
  curated `portal_directory_entry` table with: `name`, `title`, `department`
  (enum: `ACCOUNTS_PAYABLE`, `PROCUREMENT`, `COMPLIANCE`, `FINANCE_MANAGEMENT`,
  `EXECUTIVE`), `email` (masked: `j.smith@...`), `availability` (working
  hours), `isEscalationContact` (for P19 breakglass)
- Portal page `/portal/company/directory` — department-grouped cards,
  government-style layout
- Each entry is **buyer-curated** (not auto-generated from HR data). Buyer
  admin maintains the directory via ERP-side settings
- Privacy guard: no direct phone numbers unless buyer opts in. Email sends via
  portal messaging (P5), not raw exposure

---

#### P24: Dashboard Announcements / Pinned Messages — **YES**

> *"Dashboard may render company banner message, or pin message announcement
> such as closure of services."*

**Verdict: ESSENTIAL.** The codebase has `/boardroom/announcements` for internal
use but no supplier-facing equivalent. Suppliers need to see: holiday closures,
payment run schedule changes, policy updates, system maintenance windows.

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

#### P25: Tamper-Evident Communication Log — **STRONG YES**

> *"Blockchain or similar services for verification of communication as proof
> of record."*

**Verdict: SILENT KILLER.** The codebase already has the infrastructure:
`TamperResistantOutboxWriter` in
`packages/modules/finance/src/shared/services/tamper-resistant-outbox.ts`
implements a **SHA-256 hash chain** — each entry's `contentHash` includes the
previous entry's hash, creating a Merkle-like chain. This is more practical than
blockchain (no gas fees, no consensus delays, no third-party dependency) and
achieves the same goal: **provable immutability of communication records**.

**Implementation:**
- Extend the tamper-resistant outbox to cover all portal communication events:
  messages sent/received, case status changes, documents uploaded, payments
  confirmed, escalations triggered
- New `portal_communication_proof` table storing: `eventType`, `contentHash`,
  `previousHash`, `chainPosition`, `timestamp`, `actorId`, `actorType`
  (`SUPPLIER` | `BUYER`)
- Portal page `/portal/verification` — supplier can:
  - View the hash chain for any message/case/document
  - Download a verification certificate (PDF) for any entry
  - Verify chain integrity via client-side re-hash (confirm no tampering)
- Use cases: regulatory disputes, payment proof for auditors, legal evidence
  that a communication was sent/received on a specific date

**Why not actual blockchain:** Gas costs, latency, regulatory uncertainty, and
infrastructure complexity make on-chain storage impractical for a B2B ERP.
A centralized hash chain with optional third-party timestamping service
(RFC 3161) provides the same legal weight at zero marginal cost.

---

#### P26: Document Vault (enhanced) — **YES (evolve existing)**

> *"Document vault."*

The document vault already exists (N8: `supplierUploadDocument()`,
`supplierListDocuments()`, `supplierVerifyDocumentIntegrity()` with SHA-256
checksums). What's missing for enterprise:

| Gap | Enhancement |
| --- | --- |
| No version history | Add `version` column + `previousVersionId` FK. Show version timeline. |
| No dual-party signing | Digital signature workflow: supplier uploads → buyer counter-signs → both parties get signed copy |
| No retention policy UI | Expose document retention periods to supplier. Auto-archive after retention expires. |
| No contract lifecycle | Documents have flat categories (`CONTRACT`, `TAX_NOTICE`, etc.) but no lifecycle (DRAFT → ACTIVE → EXPIRED → RENEWED) |
| No shared workspace | Buyer can't upload docs to the portal for the supplier (e.g., purchase orders, policy documents) |
| Limited categories | Add: `INVOICE_BACKUP`, `DELIVERY_NOTE`, `QUALITY_CERTIFICATE`, `BANK_GUARANTEE`, `PERFORMANCE_BOND` |

**Integration:** Document vault becomes the attachment backend for messaging (P5),
cases (P20), breakglass (P19), and compliance (P8).

---

#### P27: Appointment Scheduling — **GOOD TO HAVE (Phase 1 late)**

> *"Appointment scheduling."*

**Verdict: GOOD TO HAVE.** No scheduling infrastructure exists in the codebase.
Building a full calendar system is out of scope, but a **lightweight meeting
request** feature is achievable:

**Implementation (minimal viable):**
- New `portal_meeting_request` table: `requestedBy` (supplier), `requestedWith`
  (buyer contact from directory P23), `proposedTimes` (JSONB array of 3 time
  slots), `status` (`REQUESTED → CONFIRMED → COMPLETED → CANCELLED`),
  `meetingType` (`VIRTUAL` | `IN_PERSON`), `agenda`, `location`
- Portal page `/portal/appointments` — supplier proposes times, buyer confirms
  via ERP-side notification
- Integration with calendar (iCal export) — no full calendar UI, just `.ics`
  file generation
- Links from case (P20) and breakglass (P19): "Schedule a call with your
  assigned manager"

**NOT building:** Full calendar view, recurring meetings, room booking,
integration with Google/Outlook Calendar (post-Phase 1).

---

### 2.4 Summary by Phase

**Phase 1 — AP-Anchored (13 weeks):**

| Category | Features | Count |
| --- | --- | --- |
| **SILENT KILLER** | P2 Payment Tracking, P3 Dynamic Discounting, P18 API/Webhooks, P25 Tamper-Evident Log | 4 |
| **ESSENTIAL** | P1 Onboarding, P5 Messaging, P8 Compliance, P11 Mobile, P13 Bulk Upload, P14 Audit, P15 Credit Notes, P16 Search/Pagination, P19 Breakglass, P20 Case Mgmt, P21 Match Resolution (AP-side), P22 Locations, P23 Directory, P24 Announcements, P26 Document Vault | 15 |
| **GOOD TO HAVE** | P9 Multi-Entity, P12 Branding, P27 Appointments | 3 |

**Phase 2 — Procurement-Anchored (after procurement ships):**

| Category | Features | Count |
| --- | --- | --- |
| **ESSENTIAL** | P6 PO Flip, P7 3-Way Match (full), P21 Match Resolution (complete) | 3 |
| **GOOD TO HAVE** | P4 Performance Scorecard, P10 Catalog, P17 Contractor/Lease | 3 |

---

## 3. Portal Kernel (prerequisite — must exist before both phases)

Every Portal 2.0 feature depends on a shared kernel. Without it,
P1/P5/P13/P14/P19/P20 will implement inconsistent identity, logging, and
notification logic.

### 3.1 Why this is critical (codebase evidence)

- `supplierPortal` resource defined in `erpStatements` (`permissions.ts:L82`)
  but **not assigned to any of the 6 roles** — routes use `'supplier:read'` as
  workaround.
- `resolveSupplierIdentity()` returns flat profile but **no role/permission
  concept** for supplier users.
- Full notification infrastructure exists (`platform.notifications`) but
  **zero portal features use it**.
- `audit.audit_log` table exists but **no portal middleware** writes to it.
- `TamperResistantOutboxWriter` exists (SHA-256 hash chain) but only covers
  outbox events — not portal communications.

### 3.2 Kernel Components

| Component | Purpose | Location |
| --- | --- | --- |
| **Identity & tenancy** | `portalUserId` + `supplierId` + `tenantId` + `entityIds[]`. Extend `resolveSupplierIdentity()` | `slices/ap/kernel/portal-identity.ts` |
| **Permissions model** | Roles: `PORTAL_OWNER`, `PORTAL_FINANCE`, `PORTAL_OPERATIONS`, `PORTAL_READONLY`. Granular permissions: `INVOICE_SUBMIT`, `CASE_CREATE`, `MSG_SEND`, `API_KEYS_MANAGE`, `BANK_ACCOUNT_MANAGE`, `DOCUMENT_UPLOAD`, `ESCALATE` | `packages/authz/src/portal-permissions.ts` |
| **Notification backbone** | Outbox → worker → email + in-app via `platform.notifications`. One dispatcher for all services | `slices/ap/kernel/portal-notifications.ts` |
| **Audit log middleware** | Fastify hook logging every portal mutation to `audit.audit_log` | `slices/ap/kernel/portal-audit-hook.ts` |
| **Tamper-evident log** | Extend `TamperResistantOutboxWriter` to cover all portal communication events. Every message, case update, document upload, escalation gets a hash-chain entry | `slices/ap/kernel/portal-proof-chain.ts` |
| **Attachment policy** | File size/type limits + checksum + immutable audit. Reuse document vault service | `slices/ap/kernel/portal-attachment-policy.ts` |
| **Status Dictionary** | Single source of truth for all supplier-visible statuses: label + severity + help text | `slices/ap/kernel/portal-status-dictionary.ts` |
| **Case ID generator** | Auto-generate `CASE-{TENANT}-{YYYY}-{SEQ}` ticket numbers | `slices/ap/kernel/portal-case-id.ts` |
| **Shared contracts** | `PortalRequestContext`, `ListResponseSchema<T>`, portal error shapes | `packages/contracts/src/portal/` |
| **Frontend primitives** | `PortalDataTable`, `PortalAnnouncementBanner`, shared query/empty-state helpers | `portal/_kernel/` |

### 3.3 Portal Shell UX Contexts

The sidebar organizes around 4 contexts:

| Context | Routes | Key Actions |
| --- | --- | --- |
| **My Company** | profile, bank-accounts, compliance, locations, directory, team/users, settings, activity | Edit profile, manage accounts, upload certificates, view buyer contacts |
| **My Documents** | invoices, credit-notes, documents (vault), wht, bulk-upload | Submit invoice, upload docs, download remittance |
| **My Transactions** | payments, cases (was disputes), messages, reconciliation, appointments | Track payments, create cases, message buyer, schedule meetings |
| **Support** | breakglass, escalation history, verification (proof chain) | SOS escalation, verify communication records |

Every list/detail page shows: **status** + **next action** + **support
channel** (message thread / case / breakglass).

---

## 4. End-to-End Definition of Done

Every feature must complete **all 11 layers/gates**.

### 4.1 Core Layers (8)

| # | Layer | Criteria | Evidence |
| --- | --- | --- | --- |
| 1 | **Contracts** | Zod schema in `@afenda/contracts`. Uses `ListResponseSchema<T>` for lists | Schema file, `pnpm build --filter @afenda/contracts` passes |
| 2 | **DB Schema** | Drizzle table with RLS, `tenant_id`, migration, seeder | `gate-db-module.mjs` passes |
| 3 | **Domain** | Pure logic in `slices/*/domain/` — zero DB/HTTP imports | No forbidden imports |
| 4 | **Application** | Service with ports. Transaction boundaries. Outbox event. Kernel notification dispatcher. **Tamper-evident log entry for supplier-facing events.** | Event in `events.ts` |
| 5 | **Infrastructure** | Fastify route with auth, Zod, idempotency, audit hook | `gate-web-module.mjs` passes |
| 6 | **Frontend** | Page + `loading/error/not-found.tsx`. `PortalDataTable` for lists. Per-domain query file. Empty state | TypeScript compiles |
| 7 | **Tests** | Unit (vitest), route-level auth tests, property-based invariants, E2E (Playwright) | Coverage ≥ 80% |
| 8 | **Documentation** | Portal README, OpenAPI spec, AIS benchmark, WCAG 2.2 AA audit | `pnpm arch:guard` passes |

### 4.2 Enterprise Gates (3)

| # | Gate | Criteria |
| --- | --- | --- |
| 9 | **Supplier-visible correctness** | Every status from Status Dictionary — no ad-hoc strings |
| 10 | **PII + document handling** | Classification + retention + access log. Downloads auth-checked + audit-logged |
| 11 | **Rate limiting + abuse** | Per-user on mutations. Per-API-key for P18. Burst protection on uploads |

### 4.3 Inherited CI Gates

- `gate-web-module.mjs`: Every `page.tsx` must have sibling `loading.tsx`
- `gate-db-module.mjs`: Every tenant table must have RLS policy
- `arch-guard`: Import boundaries respected
- CI: TypeScript strict, ESLint, Prettier, all tests green

---

## 5. Phase 1 Implementation: AP-Anchored Portal (13 Weeks)

### Phase 1.0: Foundation + Portal Kernel (Week 1–2)

**Goal:** Establish kernel, fix existing gaps, build reusable infrastructure.

#### Exit criteria

- [ ] Portal Kernel: identity, permissions, audit hook, notification backbone,
      tamper-evident log, attachment policy, case ID generator
- [ ] Shared contracts: `PortalRequestContext`, `ListResponseSchema<T>`, error
      shapes
- [ ] Query file split into per-domain files
- [ ] All portal sub-routes have: `loading.tsx`, `error.tsx`, `not-found.tsx`
- [ ] P16 implemented via `PortalDataTable` (not per-page custom)
- [ ] Dashboard endpoint registered + dashboard upgraded to attention-first
- [ ] Rate limiting middleware on all portal mutation routes
- [ ] Status Dictionary live
- [ ] Statement reconciliation bugs fixed (G1–G5 from prior audit)

#### Steps

**0.1 Portal Kernel** — Build all kernel components (§3.2). Wire
`resolveSupplierIdentity()` to return portal role + permissions. Register
portal-side permission model in `@afenda/authz`. Attach audit hook to all
portal routes. Wire notification dispatcher to outbox +
`platform.notifications`. Extend tamper-resistant outbox to cover portal events.

**0.2 Shared contracts** — Add `packages/contracts/src/portal/` with
`PortalRequestContext`, `ListResponseSchema<T>`, portal error envelope.

**0.3 Dashboard endpoint** — Register missing
`GET /portal/suppliers/:id/dashboard` in `supplier-portal-routes.ts`.

**0.4 Query file split** — Split `portal.queries.ts` (423 lines) into
per-domain files.

**0.5 Segment error boundaries** — Add `error.tsx` + `not-found.tsx` for each
portal sub-route.

**0.6 PortalDataTable + P16** — Build wrapper with: pagination, filter chips,
saved views, CSV export, bulk actions, empty state CTA. Apply across all lists.

**0.7 Dashboard upgrade** — Adopt `DomainDashboardShell` pattern: KPI deck,
feature grid, attention items, quick actions. **Add announcement banner slot**
(P24 content comes in Phase 1.2).

**0.8 Fix statement reconciliation** — G1 (response shape mapping), G2 (4-tab
results), G3 (totals display), G4 (date tolerance slider), G5 (proper CSV
parser with column mapping).

**0.9 Enhance statement reconciliation** — G6 (session persistence +
`/portal/reconciliation/history`), G8 (worker consumer for
`SUPPLIER_STATEMENT_UPLOADED`).

**0.10 Rate limiting** — Per-portal-user on mutations. Burst protection on
uploads.

**0.11 Status Dictionary** — Deterministic mappings for all existing statuses.

---

### Phase 1.1: Onboarding, Cases & Compliance (Week 2–5) — P1, P20, P8, P14, P22, P23

**Goal:** Supplier lifecycle + case management + buyer-side context.

**1.1.1 Case Management (P20)** — New `supplier_case` table replacing disputes.
Auto-generated ticket numbers (`CASE-{TENANT}-{YYYY}-{SEQ}`). 8-status
lifecycle: `DRAFT → SUBMITTED → ASSIGNED → IN_PROGRESS → AWAITING_INFO →
RESOLVED → CLOSED → REOPENED`. Extensible category taxonomy. SLA timers per
category + priority. Resolution includes root cause + corrective action
(training data). Linked to any portal entity. Migrate existing
`supplier_dispute` rows. **Every case status change logged to proof chain.**

**1.1.2 Onboarding Wizard (P1)** — Multi-step form at `portal/onboarding/`:
Company info → Bank details → KYC document upload → Tax registration → Review &
Submit. Maps to `supplierOnboardingStatusEnum`. KYC uploads via kernel
attachment policy. Notifications via kernel dispatcher. **If onboarding stalls,
supplier can create a case (P20) or escalate (P19 — built next sub-phase).**

**1.1.3 Compliance Expiry Alerts (P8)** — Cron worker scans
`supplier_compliance_item` for 30/14/7-day expiry → notification. Portal shows
expiry timeline with renewal upload. Expired items auto-create a case.

**1.1.4 Audit Trail (P14)** — Kernel audit hook writes to `audit.audit_log`.
Add supplier-facing filtered view at `/portal/activity` with timeline UI.

**1.1.5 Company Location Directory (P22)** — Portal page
`/portal/company/locations`. Buyer's addresses exposed: HQ, warehouses, billing
offices. Map view + list with address cards. Links from invoice/case screens.

**1.1.6 Senior Management Directory (P23)** — New `portal_directory_entry`
table. Department-grouped cards at `/portal/company/directory`. Buyer-curated
(not auto-generated). Privacy guard: masked emails, contact via portal messaging
only. `isEscalationContact` flag for P19.

**1.1.7 Invitation Flow** — Buyer sends invite email → magic link → onboarding
wizard.

---

### Phase 1.2: Communication & Documents (Week 5–8) — P5, P19, P24, P25, P26, P27

**Goal:** Two-way communication, escalation, announcements, proof of record.

**1.2.1 Messaging Hub (P5)** — Tables: `supplier_message_thread`,
`supplier_message`. Threaded per invoice/case/compliance item. Portal
`/portal/messages`. SSE polling (not WebSocket — per PROJECT.md). Attachments
via document vault. Read receipts. Every message logged to tamper-evident proof
chain (P25). Required `MSG_SEND` permission.

**1.2.2 Breakglass Escalation (P19)** — SOS button in portal header + on any
case/invoice/payment detail page. Escalation logic: auto-assign from
`portal_directory_entry WHERE isEscalationContact = true` (round-robin). New
`portal_escalation` table: `caseId`, `assignedTo`, `slaDeadline`,
`escalationLevel` (1–3), `status`. SLA countdown visible to both parties.
Breach → auto-escalate to next level. Creates immutable proof-chain entry.

**1.2.3 Dashboard Announcements (P24)** — New `portal_announcement` table.
Dashboard renders above KPI deck. Pinned announcements show as persistent
banner across all pages (using the slot created in §0.7). Buyer admin creates
via ERP-side UI.

**1.2.4 Tamper-Evident Communication Log (P25)** — Extend kernel proof chain.
Portal page `/portal/verification`. Supplier can: view hash chain for any
message/case/document, download verification certificate (PDF), verify chain
integrity via client-side re-hash. **This is the proof-of-record system.**

**1.2.5 Document Vault Enhanced (P26)** — Extend existing vault:
- Version history (`version` column + `previousVersionId`)
- Contract lifecycle (DRAFT → ACTIVE → EXPIRED → RENEWED)
- Buyer-to-supplier document sharing (reverse direction)
- Additional categories: `INVOICE_BACKUP`, `DELIVERY_NOTE`,
  `QUALITY_CERTIFICATE`, `BANK_GUARANTEE`, `PERFORMANCE_BOND`
- Retention policy UI: show expiry dates, auto-archive
- All uploads/downloads logged to proof chain

**1.2.6 Appointment Scheduling (P27)** — New `portal_meeting_request` table.
Supplier proposes 3 time slots, buyer confirms via notification. iCal export.
Links from case (P20) and breakglass (P19): "Schedule a call with your assigned
manager." Virtual/in-person type. No full calendar UI.

---

### Phase 1.3: Invoice Operations (Week 8–10) — P13, P15, P21

**Goal:** Enterprise invoice lifecycle + match resolution.

**1.3.1 Bulk Invoice Upload (P13)** — Portal `/portal/invoices/bulk-upload`.
CSV/Excel parser (PapaParse + column mapping). Backend batch endpoint. Error
report with row-level status. Fix & retry failed only.

**1.3.2 Credit/Debit Note Submission (P15)** — Extend invoice submit for
`documentType: 'CREDIT_NOTE' | 'DEBIT_NOTE'`. Reuse `buildEInvoice()`.
Portal `/portal/invoices/credit-note`. Messaging for exceptions.

**1.3.3 3-Way Match Resolution Screen — AP Side (P21)** — Portal
`/portal/invoices/[id]/resolution` shows multi-column workspace:

| Column | Phase 1 | Phase 2 |
| --- | --- | --- |
| **Invoice (AP)** | Live — AP clerk resolves amount/tax/duplicate issues | — |
| **Supplier** | Live — supplier sees status, provides missing docs | — |
| **GR (Warehouse)** | Placeholder — "Awaiting warehouse GR data" | Filled when procurement ships |
| **PO (Procurement)** | Placeholder — "Awaiting PO confirmation" | Filled when procurement ships |

Case (P20) is the umbrella for the resolution. Multi-role assignment: supplier
sees who in each department is handling their case + status per column.

---

### Phase 1.4: Payment Intelligence (Week 10–12) — P2, P3

**Goal:** Silent killer features — payment tracking and supply chain finance.

**1.4.1 Real-Time Payment Tracking (P2)** — Append-only
`supplier_payment_status_fact` table (§7.2). Stages:
`SCHEDULED → APPROVED → PROCESSING → SENT → CLEARED`. Timeline visualization.
"Why am I not paid?" panel with hold reasons. Per-invoice "notify me" via kernel
dispatcher. SLA-based auto-escalation to breakglass (P19) if payment is
late beyond threshold.

**1.4.2 Early Payment / Dynamic Discounting (P3)** — Tables:
`early_payment_offer`, `discount_schedule`. Hard-bounded v1:
- Match-clean invoices only
- Deterministic pricing (APR or flat %)
- Immutable agreement records
- GL impact configurable per tenant
- Backend: `supplier-portal-scf.ts`

---

### Phase 1.5: API, Polish & Production (Week 12–13) — P18, P9, P11, P12

**Goal:** API access, mobile, branding, multi-entity.

**1.5.1 Supplier API / Webhooks (P18)** — Stripe-like DX: scoped API keys,
HMAC-SHA256 webhook signing, versioned events, per-key rate limiting, OpenAPI
spec for supplier-facing API.

**1.5.2 Multi-Entity View (P9)** — Extend portal identity `entityIds[]`.
Dashboard aggregates across entities. Entity switcher in shell header.

**1.5.3 Mobile PWA (P11)** — Responsive shell (sidebar → bottom nav on mobile).
Touch-friendly tables. PWA manifest + service worker for shell caching.

**1.5.4 White-Label Branding (P12)** — Tenant config: logo, primary color,
favicon. CSS variables. Scoped for v1.

---

## 6. Phase 2 Preview: Procurement-Anchored Portal

> **Prerequisite:** Procurement module must ship first. These features cannot be
> built on projections.

| Step | Feature | Detail |
| --- | --- | --- |
| 2.1 | **PO Flip (P6)** | Supplier receives PO from procurement domain → confirms/rejects → creates invoice from PO lines. Now backed by real procurement tables, not projections. |
| 2.2 | **GR Integration (P7)** | Warehouse GR data flows into the 3-way match resolution screen (P21). GR column goes live. |
| 2.3 | **Match Resolution Complete (P21)** | All 4 columns live: Invoice (AP) + Supplier + GR (Warehouse) + PO (Procurement). Full multi-persona workspace. |
| 2.4 | **Performance Scorecard (P4)** | Procurement-defined evaluation criteria → portal charts. On-time delivery, quality, responsiveness. |
| 2.5 | **Catalog Management (P10)** | Supplier maintains product/service catalog with prices, lead times. Linked to procurement sourcing. |
| 2.6 | **Contractor/Lease Variants (P17)** | Extended portal personas: contractor (timesheet/expense), leasee (lease schedule/payment). |

---

## 7. Data Model Principles

### 7.1 PO Tables Are Projections (Phase 1) → Real Tables (Phase 2)

In Phase 1, if any PO visibility is needed (for the AP-side match resolution
screen P21), use read-only projections:

- `portal_po_snapshot` with `sourceDocId` + `sourceDocType`
- Portal reads only — never mutates PO lifecycle
- When procurement module ships (Phase 2), these become views over real tables

### 7.2 Payment Status Fact Table (Append-Only)

**Table: `supplier_payment_status_fact`** (immutable, SOX-safe)

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | UUID PK | — |
| `tenant_id` | UUID | RLS scope |
| `payment_id` | UUID FK | Payment run/line |
| `invoice_id` | UUID FK (nullable) | Specific invoice |
| `event_at` | timestamptz | When status changed |
| `stage` | enum | SCHEDULED/APPROVED/PROCESSING/SENT/CLEARED/REJECTED/ON_HOLD |
| `source` | enum | ERP/BANK_FILE/MANUAL_OVERRIDE |
| `reference` | varchar | Bank trace / file ref |
| `hold_reason` | enum (nullable) | From taxonomy |
| `note` | text (nullable) | Human-readable |
| `created_by` | UUID | Actor |

### 7.3 Case Table (replaces disputes)

**Table: `supplier_case`** (replaces `supplier_dispute`)

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | UUID PK | — |
| `tenant_id` | UUID | RLS scope |
| `ticket_number` | varchar(30) | `CASE-{TENANT}-{YYYY}-{SEQ}` |
| `supplier_id` | UUID FK | — |
| `category` | enum | Extended taxonomy |
| `priority` | enum | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `subject` | varchar(255) | — |
| `description` | text | — |
| `status` | enum | 8-status lifecycle |
| `assigned_to` | UUID FK (nullable) | Buyer-side resolver |
| `co_assignees` | UUID[] | Additional resolvers (warehouse, procurement) |
| `linked_entity_id` | UUID (nullable) | Any portal entity |
| `linked_entity_type` | enum (nullable) | `INVOICE`, `PAYMENT`, `DOCUMENT`, `COMPLIANCE`, `PO` |
| `sla_deadline` | timestamptz (nullable) | SLA timer |
| `resolution` | text (nullable) | — |
| `root_cause` | text (nullable) | Training/audit data |
| `corrective_action` | text (nullable) | For knowledge base |
| `resolved_by` | UUID (nullable) | — |
| `resolved_at` | timestamptz (nullable) | — |
| `escalation_id` | UUID FK (nullable) | Link to breakglass if escalated |
| `proof_chain_head` | varchar(64) (nullable) | Latest hash in tamper-evident chain |
| `created_by` | UUID | — |
| `...timestamps()` | — | — |

### 7.4 Tamper-Evident Proof Chain

**Table: `portal_communication_proof`**

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | UUID PK | — |
| `tenant_id` | UUID | RLS scope |
| `chain_position` | bigint | Sequence in chain |
| `event_type` | varchar | Message, case update, document, escalation |
| `entity_id` | UUID | What this entry is about |
| `entity_type` | varchar | case, message, document, payment |
| `content_hash` | varchar(64) | SHA-256 of payload + previous hash |
| `previous_hash` | varchar(64) | Link to prior entry |
| `actor_id` | UUID | Who triggered |
| `actor_type` | enum | `SUPPLIER`, `BUYER`, `SYSTEM` |
| `payload_summary` | text | Human-readable action description |
| `created_at` | timestamptz | Immutable timestamp |

---

## 8. UX Patterns

### 8.1 PortalDataTable — Enterprise Hygiene Bundle

Built once in Phase 0, reused everywhere. Wraps existing `DataTable`.

| Capability | Implementation |
| --- | --- |
| Server-side pagination | `ListResponseSchema<T>` contract, URL params |
| Filter chips | Client-side, synced to query params |
| Saved views | `localStorage` |
| Export CSV | Client-side from filtered dataset |
| Bulk actions | Toolbar on row selection |
| Empty state | Next-step CTA per context |

### 8.2 Case Resolution Workspace

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
│ Timeline (tamper-evident) ──────────────────────────────── │
│ 03/01 10:00  Invoice submitted (Supplier)                  │
│ 03/01 14:30  Amount mismatch flagged (System)              │
│ 03/01 14:31  Case auto-created (System) ← proof hash: a3f │
│ 03/02 09:15  Assigned to J.Smith (AP Manager)              │
│ 03/02 11:00  Additional docs requested (J.Smith)           │
└────────────────────────────────────────────────────────────┘
```

### 8.3 Breakglass UX

SOS button appears:
1. In portal header (always accessible)
2. On any case detail that is past SLA
3. On any payment detail showing `ON_HOLD` for >N days

Flow: Click SOS → system auto-creates/escalates case → assigns senior manager
from directory → supplier sees assigned manager + SLA countdown → proof-chain
entry created.

---

## 9. Verification

| Check | Command / Method |
| --- | --- |
| TypeScript compilation | `pnpm typecheck` |
| Unit + integration tests | `pnpm test` |
| Architecture drift | `pnpm arch:guard` |
| CI gates | `gate-web-module.mjs`, `gate-db-module.mjs` |
| E2E: onboarding | invite → wizard → approval |
| E2E: case lifecycle | create → assign → resolve → close |
| E2E: breakglass | SOS → auto-assign → SLA countdown → resolution |
| E2E: payment tracking | invoice → payment run → status timeline → cleared |
| E2E: proof chain | message sent → verify hash → download certificate |
| E2E: recon session | upload → results → save → history → revisit |
| E2E: compliance | expiring → reminder → upload → cleared |
| E2E: bulk upload | 200 rows → errors → fix & retry failed |
| E2E: announcement | buyer posts → supplier sees banner |
| Accessibility | axe-core, WCAG 2.2 AA |
| Performance | Lighthouse ≥ 90 on portal dashboard |
| OpenAPI | All endpoints in generated spec |
| Load test | k6: 500 concurrent sessions |
| Rate limit | k6 burst test on mutations |
| Proof chain integrity | Property test: hash chain is continuous, no gaps |
| Document access | `audit.audit_log` entries per download |

---

## 10. Decisions Log

| # | Decision | Chose | Over | Why |
| --- | --- | --- | --- | --- |
| D1 | **Two-phase split** | Phase 1 (AP) then Phase 2 (Procurement) | Single 12-week plan with PO Flip | AP module is fully built; procurement domain doesn't exist. Building PO features on projections creates throwaway code. |
| D2 | **Portal Kernel first** | Phase 0 prerequisite | Feature-led start | Prevents identity/audit/notification inconsistency. Codebase confirms gaps. |
| D3 | **Cases replace disputes** | `supplier_case` with tickets/SLA/assignment | Keep `supplier_dispute` as-is | Enterprise needs structured tickets, SLA tracking, knowledge base training data. Current 4-status dispute model is too thin. |
| D4 | **Breakglass escalation** | Built-in SOS + auto-assignment + SLA | Rely on email escalation | No mid-market ERP has this. Transforms portal from "submit and hope" to guaranteed resolution. Uses existing directory/notification infrastructure. |
| D5 | **Tamper-evident proof chain** | Extend existing `TamperResistantOutboxWriter` (SHA-256 hash chain) | Actual blockchain | Gas costs, latency, regulatory uncertainty. Centralized hash chain provides same legal weight at zero marginal cost. |
| D6 | **3-way match as phased columns** | AP + Supplier columns in Phase 1; GR + PO in Phase 2 | Wait for procurement to build full match | Delivers immediate value (AP-side resolution) without depending on unbuilt domain. |
| D7 | **Payment status as facts** | Append-only `supplier_payment_status_fact` | Status column on payment run | SOX-safe, multi-source, trivial timeline UI. |
| D8 | **Dynamic discounting bounds** | Match-clean invoices only, immutable agreements, GL rules upfront | Unrestricted offers | Prevents accounting debates and audit exposure. |
| D9 | **Supplier API model** | Scoped keys + HMAC webhooks + versioned events | Basic API key | Enterprise-grade. Aligns with outbox discipline. |
| D10 | **Messaging transport** | SSE polling | WebSocket | No Redis/WS server. "No over-engineering" — PROJECT.md. |
| D11 | **Mobile** | PWA + shell caching | Full offline or native | True offline is disproportionately hard. |
| D12 | **Appointments** | Lightweight meeting request (propose 3 slots) | Full calendar system | No calendar infrastructure exists. Meeting requests are sufficient for Phase 1. |
| D13 | **Directory scope** | Curated `portal_directory_entry` (buyer-maintained) | Auto-generated org chart from HR | No HR/org-chart domain exists. Curated directory is privacy-safe and immediately useful. |
| D14 | **Document vault evolution** | Add versioning + lifecycle + reverse sharing to existing vault | Build new document system | Vault already has SHA-256 integrity, categories, upload/list/verify. Extend, don't replace. |
| D15 | **Announcement model** | `portal_announcement` table + persistent banner | Reuse Boardroom announcements | Boardroom is internal. Portal announcements are supplier-facing, tenant-scoped, with `validFrom`/`validUntil`. Different lifecycle. |
| D16 | **Rate limiting from day one** | Per-user + per-API-key | Add later | Internet-facing, free portal — security can't be bolted on. |
| D17 | **Query file split** | Per-domain files | Single monolith | Matches finance pattern. Scales to 60+ queries. |
| D18 | **Status Dictionary** | Single source of truth | Ad-hoc strings | Prevents contradicting labels across pages. |
```

**Key changes from the previous plan:**

1. **Two-phase structure** — Phase 1 (AP-anchored, 13 weeks) vs Phase 2 (Procurement-anchored, after procurement ships). PO Flip, Catalog, Scorecard, GR all moved to Phase 2.

2. **10 ad-hoc ideas evaluated** — 9 accepted (P19–P27), all classified and integrated into Phase 1 sub-phases. Only P27 (Appointments) marked as GOOD TO HAVE; the rest are ESSENTIAL or SILENT KILLER.

3. **Feature count grew** from 18 → 27 features (P1–P27), with 22 in Phase 1 and 6 in Phase 2.

4. **New data models** — `supplier_case` (§7.3), `portal_communication_proof` (§7.4), plus tables for escalation, directory, announcements, meeting requests.

5. **Decisions log expanded** — D1–D18 (was D1–D13), adding decisions for the two-phase split, cases, breakglass, proof chain, appointments, directory, document vault, and announcements.

6. **Recon fixes integrated** — G1–G9 reconciliation gaps folded into Phase 1.0 steps 0.8–0.9.