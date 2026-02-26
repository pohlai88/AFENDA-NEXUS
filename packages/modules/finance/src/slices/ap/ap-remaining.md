
# AP Enterprise Spec vs. Actual Codebase — Gap Audit

Here's the comprehensive audit of all 85 claimed capabilities against what actually exists in the codebase.

---

## Category 1: Fully Implemented (service + repo + runtime wiring + DB table + route)

These capabilities have end-to-end code: entity, Drizzle repo, runtime wiring, DB schema, routes, and tests.

**A1–A4** (Supplier) ✅ — `Supplier` entity, `DrizzleSupplierRepo`, `supplier-routes.ts`, `suppliers` DB table
**B1** (Manual entry) ✅ — `POST /ap/invoices`, `DrizzleApInvoiceRepo`
**B5** (Credit memo) ✅ — [create-credit-memo.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/services/create-credit-memo.ts:0:0-0:0) service
**C1–C8** (Matching/Holds) ✅ — `DrizzleApHoldRepo`, `ap-hold-routes.ts`, calculators
**D1–D5** (Approvals) ✅ — Shared approval service, wired in runtime
**E1–E17** (Payments) ✅ — `DrizzleApPaymentRunRepo`, payment routes, calculators, payment file builders
**F1, F3** (WHT calc/auto) ✅ — [wht-calculator.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/calculators/wht-calculator.ts:0:0-0:0) wired into payment execution
**G1–G4** (FX) ✅ — Shared FX slice
**H1–H7** (GL) ✅ — [post-ap-invoice.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/services/post-ap-invoice.ts:0:0-0:0), [compute-period-accruals.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/services/compute-period-accruals.ts:0:0-0:0), period guards
**I1–I3** (Period Close) ✅ — [ap-period-close-checklist.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/services/ap-period-close-checklist.ts:0:0-0:0)
**J1–J5** (Reports) ✅ — aging, payment run report, hold report, WHT report, recon route
**K1–K3** (Audit) ✅ — timeline, hold evidence, SoD log
**L1–L4** (Integration) ✅ — batch import, bank rejection, outbox events, RBAC
**M1–M3** (Quality) ✅ — error codes, pagination, transaction scope

---

## Category 2: Real Gaps — Missing Runtime Wiring or DB Tables

These have service code and port interfaces but **no Drizzle repo, no DB table, and no runtime wiring**, meaning they can only run in tests with mock/in-memory repos.

### Gap 1: `IMatchToleranceRepo` — no Drizzle repo, not wired
- **Spec claims**: C5 (V4) — tolerance rules per org/company/site
- **What exists**: [match-tolerance.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/entities/match-tolerance.ts:0:0-0:0) entity, [match-tolerance-repo.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/ports/match-tolerance-repo.ts:0:0-0:0) port, `resolveMatchTolerance()` calculator
- **Missing**: No `drizzle-match-tolerance-repo.ts`, no `match_tolerance` DB table, `matchToleranceRepo` is optional in [ApDeps](cci:2://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/ports/ap-deps.ts:11:0-22:1) and **not instantiated** in [runtime.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/runtime.ts:0:0-0:0)
- **Impact**: Tolerance matching works in tests with mocks but **cannot work in production**

### Gap 2: `IApPrepaymentRepo` — no Drizzle repo, not wired
- **Spec claims**: B6 (V3) — prepayment invoices
- **What exists**: [prepayment.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/entities/prepayment.ts:0:0-0:0) entity, [prepayment-repo.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/ports/prepayment-repo.ts:0:0-0:0) port, [apply-prepayment.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/services/apply-prepayment.ts:0:0-0:0) service
- **Missing**: No `drizzle-prepayment-repo.ts`, no `ap_prepayment` DB table, repo **not in** [ApDeps](cci:2://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/ports/ap-deps.ts:11:0-22:1) or [runtime.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/runtime.ts:0:0-0:0)
- **Impact**: `applyPrepayment()` service works in tests with mocks but **cannot work in production**

### Gap 3: AP `IWhtCertificateRepo` — entity-only, relies on tax slice
- **Spec claims**: F4 (V3) — WHT certificate/exemption
- **What exists**: [wht-certificate.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/entities/wht-certificate.ts:0:0-0:0) entity + [wht-certificate-repo.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/ports/wht-certificate-repo.ts:0:0-0:0) port in AP slice. **Tax slice** has `DrizzleWhtCertificateRepo` + `wht_certificate` DB table, wired in runtime
- **Status**: Partially OK — the tax slice repo is wired, but the AP port defines a **different interface** (`IWhtCertificateRepo` in AP) that isn't what's instantiated. Portal WHT services call `supplierRepo` not `whtCertificateRepo`
- **Impact**: Tax WHT works; AP-specific WHT certificate management is **interface-only**

### Gap 4: `IInvoiceAttachmentRepo` — no Drizzle repo
- **Spec claims**: B7 (V3) — attachments + change audit
- **What exists**: [invoice-attachment.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/entities/invoice-attachment.ts:0:0-0:0) entity, port inline in that file
- **Missing**: No Drizzle repo, no DB table, not in [ApDeps](cci:2://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/ports/ap-deps.ts:11:0-22:1), not wired
- **Impact**: **Interface-only** — no production path

### Gap 5: Portal repos — 4 repos not wired
- **Spec claims**: N8 (document vault), N9 (disputes), N10 (notifications), N11 (compliance)
- **What exists**: Full service code with real validation logic. Port interfaces defined inline in service files. Listed as **optional** in [ApDeps](cci:2://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/ports/ap-deps.ts:11:0-22:1).
- **Missing**: No Drizzle repos, no DB tables for:
  - [ISupplierDocumentRepo](cci:2://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/services/supplier-portal-document-vault.ts:67:0-74:1) — no `supplier_document` table
  - `ISupplierDisputeRepo` — no `supplier_dispute` table
  - `ISupplierNotificationPrefRepo` — no `supplier_notification_pref` table
  - `ISupplierComplianceRepo` — no `supplier_compliance` table
  - **None are instantiated** in [runtime.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/runtime.ts:0:0-0:0)
- **Impact**: Portal routes for N8/N9/N10/N11 will fail at runtime with missing dependency errors. Tests pass because they use in-memory mocks.

---

## Category 3: Spec Claims That Need Clarification

| # | Claim | Issue |
|---|-------|-------|
| **B2** | Triage queue V3 | Service exists ([ap-triage-queue.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/services/ap-triage-queue.ts:0:0-0:0)), but `INCOMPLETE` status isn't in the DB `apInvoiceStatusEnum`. Needs migration. |
| **B3** | OCR pipeline V3 | Service exists ([ap-ocr-pipeline.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/services/ap-ocr-pipeline.ts:0:0-0:0)), but no external webhook endpoint registered in `build-app.ts`. |
| **F2** | WHT line classification V4 | Spec says `whtIncomeType` on `ApInvoiceLine` — need to verify DB column exists. |
| **K4** | Tamper-resistant logging V5 | `TamperResistantOutboxWriter` exists but is **not the default** outbox writer in [runtime.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/runtime.ts:0:0-0:0) — uses regular `DrizzleOutboxWriter`. |
| **"1226 tests"** | Test count | The spec claims 1226 AP tests. The actual test files have ~53 portal tests + existing AP tests. This number likely counts all module tests, not just AP. |

Confirmed — `INCOMPLETE` status is **not** in the DB enum. Let me also quickly check for the WHT income type on invoice lines:

Now let me also check the `build-app.ts` to see which route files are actually registered:

Good — all routes are registered in [build-app.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/apps/api/src/build-app.ts:0:0-0:0), including `registerSupplierPortalRoutes`. Now I have the complete picture. Here's the definitive audit:

---

# AP Enterprise Spec vs. Actual Codebase — Definitive Gap Report

## Summary

The spec claims **85/85 capabilities at V3+** with **"ALL GAPS CLOSED"**. The actual codebase tells a different story. While the core AP invoice-to-payment pipeline is solid, several capabilities have **no DB tables, no Drizzle repos, and no runtime wiring** — they exist only as service code + port interfaces that pass unit tests with in-memory mocks but **cannot run in production**.

---

## Real Gaps (Would Fail in Production)

| # | Capability | Claimed | Actual | What's Missing |
|---|-----------|---------|--------|----------------|
| **B2** | Triage queue | V3 | **V2** | `INCOMPLETE` status not in DB enum `ap_invoice_status`. Service logic exists but DB rejects the status value. Needs migration to add enum value. |
| **B6** | Prepayment invoices | V3 | **V2** | No `ap_prepayment` DB table, no `drizzle-prepayment-repo.ts`, repo not in [ApDeps](cci:2://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/ports/ap-deps.ts:11:0-22:1) or [runtime.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/runtime.ts:0:0-0:0). Service + entity exist but can't persist. |
| **B7** | Attachments | V3 | **V1** | No Drizzle repo for `IInvoiceAttachmentRepo`, no DB table, not wired. Entity + port interface only. |
| **C5** | Tolerance rules | V4 | **V2** | No `match_tolerance` DB table, no `drizzle-match-tolerance-repo.ts`. `matchToleranceRepo` is optional in [ApDeps](cci:2://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/ports/ap-deps.ts:11:0-22:1) and **not instantiated** in [runtime.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/runtime.ts:0:0-0:0). Calculator logic exists but can't load rules from DB. |
| **F2** | WHT line classification | V4 | **V1** | No `wht_income_type` column on `ap_invoice_line` in DB schema. Type exists in entity code only. |
| **F4** | WHT certificate/exemption (AP) | V3 | **V2** | AP's `IWhtCertificateRepo` port is separate from tax slice's `DrizzleWhtCertificateRepo`. AP port not wired. Tax slice WHT works, AP-specific cert management doesn't. |
| **K4** | Tamper-resistant logging | V5 | **V2** | `TamperResistantOutboxWriter` exists but runtime uses regular `DrizzleOutboxWriter`. Hash-chain is never activated. |
| **N8** | Supplier document vault | V3 | **V2** | No `supplier_document` DB table, no Drizzle repo. [ISupplierDocumentRepo](cci:2://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/services/supplier-portal-document-vault.ts:67:0-74:1) defined inline, not wired in runtime. Service has real SHA-256 logic but can't persist. |
| **N9** | Supplier disputes | V3 | **V2** | No `supplier_dispute` DB table, no Drizzle repo. `ISupplierDisputeRepo` defined inline, not wired. |
| **N10** | Supplier notification prefs | V3 | **V2** | No `supplier_notification_pref` DB table, no Drizzle repo. `ISupplierNotificationPrefRepo` defined inline, not wired. |
| **N11** | Supplier compliance tracking | V3 | **V2** | No `supplier_compliance` DB table, no Drizzle repo. `ISupplierComplianceRepo` defined inline, not wired. |

---

## Borderline (Route Registered but Endpoint May Crash)

| # | Capability | Issue |
|---|-----------|-------|
| **B3** | OCR pipeline | Service exists ([ap-ocr-pipeline.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/services/ap-ocr-pipeline.ts:0:0-0:0)), route file exists — but the OCR webhook endpoint isn't in any registered route file. The service is called from the triage service, which itself has the DB enum gap. |
| **N1–N7** | Portal core routes | Routes registered via `registerSupplierPortalRoutes`. These call `supplierRepo` (wired) so they should work. However, portal routes for N8/N9/N10/N11 will crash because their optional deps are `undefined`. |

---

## Actually Solid (65 of 85)

The remaining **65 capabilities** (A1–A4, B1, B4–B5, C1–C4/C6–C8, D1–D5, E1–E17, F1/F3, G1–G4, H1–H7, I1–I3, J1–J5, K1–K3, L1–L4, M1–M3, N1–N7) have complete end-to-end paths: entity → Drizzle repo → runtime wiring → DB table → registered route → tests.

---

## Corrected Scorecard

| Metric | Spec Claims | Actual |
|--------|------------|--------|
| V3+ capabilities | 85/85 (100%) | **65/85 (76%)** |
| V2 (test-only, no prod path) | 0 | **9** |
| V1 (interface-only) | 0 | **2** |
| Missing DB tables | 0 | **5** (`ap_prepayment`, `match_tolerance`, `supplier_document`, `supplier_dispute`, `supplier_notification_pref`) |
| Missing DB columns/enums | 0 | **2** (`INCOMPLETE` enum value, `wht_income_type` column) |
| Missing Drizzle repos | 0 | **5** (prepayment, match-tolerance, supplier-document, supplier-dispute, supplier-notification-pref) |
| Unwired in runtime | 0 | **6** repos (above 5 + invoice-attachment) |

---

## Recommended Fix Priority

1. **High — DB migrations needed** (unblocks 5 capabilities):
   - Add `INCOMPLETE` to `ap_invoice_status` enum
   - Create `ap_prepayment` table + Drizzle repo
   - Create `match_tolerance` table + Drizzle repo
   - Add `wht_income_type` column to `ap_invoice_line`

2. **Medium — Portal persistence** (unblocks N8–N11):
   - Create `supplier_document`, `supplier_dispute`, `supplier_notification_pref`, `supplier_compliance` tables
   - Create Drizzle repos for each
   - Wire all into [runtime.ts](cci:7://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/runtime.ts:0:0-0:0) → [ApDeps](cci:2://file:///c:/AI-BOS/NEXUSCANON-AFENDA/packages/modules/finance/src/slices/ap/ports/ap-deps.ts:11:0-22:1)

3. **Low — Activation only** (code exists, just needs wiring):
   - Switch `TamperResistantOutboxWriter` as default (or opt-in per tenant)
   - Wire `IInvoiceAttachmentRepo` via document slice adapter

Would you like me to start implementing these fixes?