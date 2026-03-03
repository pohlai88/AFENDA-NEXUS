# Reconciliation Plan — Supplier Portal v2.5
**Date:** 2026-03-03  
**Status:** Official Implementation Plan  
**Session Completion:** 6/28 work items (21%)

---

## Executive Summary

This plan resolves SP code registry conflicts, updates tracking documents, and establishes priority order for remaining work to achieve production readiness.

**Critical Issues:**
- ✅ 6 work items completed but registry/planning docs out of sync
- ⚠️ SP codes 8014-8019 conflict (planning vs registry)
- 🎯 12-16 days remaining work (8 test suites + 5 quality gates)

---

## Phase 1: Registry & Documentation Reconciliation (Immediate)

### 1.1 Portal Registry Updates

**File:** `packages/supplier-kernel/src/portal-registry.ts`

**Changes Required:**

```typescript
// Update completed items from 'planned' → 'done'
'SP-8011': { status: 'done' }, // Case E2E Tests - 19 tests
'SP-8020': { status: 'done' }, // SoD Gate Script - 4/4 checks PASS
'SP-8022': { status: 'done' }, // Proof Chain Property Tests - 24/24 passing
'SP-8025': { status: 'done' }, // Language Gate - 4/4 checks PASS

// Mint new codes for unregistered completed work
'SP-8027': {
  cap: 'CAP-SOS',
  title: 'Escalation E2E Tests (Complete Lifecycle)',
  status: 'done',
  phase: '1.2',
},
'SP-8028': {
  cap: 'CAP-RECON',
  title: 'Statement Reconciliation E2E Tests',
  status: 'done',
  phase: '1.2',
},

// Mint new codes for remaining E2E test work (to avoid conflicts)
'SP-8029': {
  cap: 'CAP-COMPL',
  title: 'Compliance Workflow E2E Tests',
  status: 'planned',
  phase: '1.1',
},
'SP-8030': {
  cap: 'CAP-BULK',
  title: 'Bulk Upload E2E Tests',
  status: 'planned',
  phase: '1.3',
},
'SP-8031': {
  cap: 'CAP-ANNOUNCE',
  title: 'Dashboard Announcement E2E Tests',
  status: 'planned',
  phase: '1.2',
},
'SP-8032': {
  cap: 'CAP-IDEMPOTENCY',
  title: 'Idempotency E2E Tests',
  status: 'planned',
  phase: '1.0',
},
'SP-8033': {
  cap: 'CAP-CASE',
  title: 'Case-Message Timeline Integration E2E',
  status: 'planned',
  phase: '1.1',
},
'SP-8034': {
  cap: 'CAP-DOC',
  title: 'Document Access Audit E2E Tests',
  status: 'planned',
  phase: '1.1',
},
'SP-8035': {
  cap: 'CAP-PAY-ETA',
  title: 'Payment State Machine Property Tests',
  status: 'planned',
  phase: '1.4',
},
'SP-8036': {
  cap: 'CAP-BULK',
  title: 'Invoice Deduplication Fingerprint Tests',
  status: 'planned',
  phase: '1.3',
},
```

**Evidence Links:**
- SP-8011: `apps/e2e/tests/finance/supplier-portal-cases.spec.ts` (19 tests)
- SP-8020: `tools/scripts/sod-gate-check.mjs` (4/4 checks)
- SP-8022: `packages/supplier-kernel/src/__tests__/proof-chain-properties.test.ts` (24/24)
- SP-8025: `tools/scripts/language-gate-check.mjs` (4/4 checks)
- SP-8027: `apps/e2e/tests/finance/supplier-portal-escalations.spec.ts` (25 tests)
- SP-8028: `apps/e2e/tests/finance/supplier-portal-reconciliation.spec.ts` (32 tests)

### 1.2 Planning Document Updates

**File:** `docs/supplier-portal2.0-V2.md`

**Section 9.5 - Remaining Work Summary (Line ~1804):**

Replace conflicting SP codes with corrected assignments:

| Priority  | SP Code | Item                          | Type          | Status      | Effort |
|-----------|---------|-------------------------------|---------------|-------------|--------|
| 🔴 High   | SP-8011 | Case E2E Tests                | E2E           | ✅ Done     | 2-3d   |
| 🔴 High   | SP-8020 | SoD Gate Script               | Governance    | ✅ Done     | 1d     |
| 🔴 High   | SP-8022 | Proof Chain Property Tests    | Property Test | ✅ Done     | 2d     |
| 🟡 Medium | SP-8025 | Supplier-Safe Language Gate   | Governance    | ✅ Done     | 1d     |
| 🟡 Medium | SP-8027 | Escalation E2E Tests          | E2E           | ✅ Done     | 1d     |
| 🟡 Medium | SP-8028 | Reconciliation E2E Tests      | E2E           | ✅ Done     | 1-2d   |
| 🟡 Medium | SP-8029 | Compliance E2E Tests          | E2E           | 🔲 Pending  | 1d     |
| 🟡 Medium | SP-8030 | Bulk Upload E2E Tests         | E2E           | 🔲 Pending  | 2d     |
| 🟢 Low    | SP-8031 | Announcement E2E Tests        | E2E           | 🔲 Pending  | 0.5d   |
| 🟢 Low    | SP-8032 | Idempotency E2E Tests         | E2E           | 🔲 Pending  | 1d     |
| 🟢 Low    | SP-8033 | Case ↔ Message Timeline Tests | E2E           | 🔲 Pending  | 1d     |
| 🟢 Low    | SP-8034 | Document Access Audit Tests   | Audit         | 🔲 Pending  | 0.5d   |
| 🟢 Low    | SP-8035 | Payment State Machine Tests   | Property Test | 🔲 Pending  | 1d     |
| 🟢 Low    | SP-8036 | Dedupe Fingerprint Tests      | Unit          | 🔲 Pending  | 0.5d   |

**Section 9.5 - Pre-Production Checklist (Line ~1882):**

```markdown
1. ✅ Complete High Priority tests (SP-8011, SP-8020, SP-8022, SP-8025) — DONE 2026-03-03
2. ✅ Complete Medium Priority E2E tests (SP-8027, SP-8028) — DONE 2026-03-03
3. ⚠️ Run accessibility audit (SP-9010)
4. ⚠️ Establish performance baseline (SP-9011)
5. ⚠️ Complete OpenAPI spec (SP-9012)
6. ⚠️ Run load tests (SP-9013, SP-9014)
7. ⚠️ Security review (penetration testing, OWASP Top 10)
8. ⚠️ User acceptance testing with pilot supplier
```

**New Section: Session Progress Summary (Insert after 9.5):**

```markdown
### 9.6 Session Progress — 2026-03-03

**Completed This Session (6 work items, 100 tests):**

| SP Code | Item | Evidence | Tests | Commit |
|---------|------|----------|-------|--------|
| SP-8020 | SoD Gate | `tools/scripts/sod-gate-check.mjs` | 4/4 checks | b15ce41 |
| SP-8025 | Language Gate | `tools/scripts/language-gate-check.mjs` | 4/4 checks | b15ce41, 5a51685 |
| SP-8011 | Case E2E Tests | `apps/e2e/tests/finance/supplier-portal-cases.spec.ts` | 19 tests | 3caa09c |
| SP-8022 | Proof Chain Property | `packages/supplier-kernel/src/__tests__/proof-chain-properties.test.ts` | 24/24 pass | 9f08611 |
| SP-8027 | Escalation E2E Tests | `apps/e2e/tests/finance/supplier-portal-escalations.spec.ts` | 25 tests | be99a78 |
| SP-8028 | Reconciliation E2E Tests | `apps/e2e/tests/finance/supplier-portal-reconciliation.spec.ts` | 32 tests | 317caf7 |

**Build Health:**
- TypeScript: 0 errors
- CI Gates: 102/102 passing
- Unit Tests: 225/225 passing (supplier-kernel)
- E2E Tests Created: 76 (19 + 25 + 32)
- Property Tests: 24/24 passing

**Progress Metrics:**
- Completed: 6 items (6-7 days of 21-27 day plan)
- High Priority: 4/4 complete (100%)
- Medium Priority E2E: 4/6 complete (67%)
- Remaining: 12-16 days estimated
```

---

## Phase 2: Remaining Test Implementation (Priority Order)

### 2.1 Medium Priority (Next 2 Items)

#### SP-8029: Compliance Workflow E2E Tests (1 day)

**Scope:**
- Certificate expiry detection
- Reminder notification triggered
- Upload replacement document
- Compliance status cleared
- Validation: file types, expiry dates, required fields

**Deliverables:**
1. `apps/e2e/pages/SupplierPortalCompliancePage.ts` (POM ~250 lines)
2. `apps/e2e/tests/finance/supplier-portal-compliance.spec.ts` (~20 tests)
3. Update `portal-registry.ts` status → `done`

**Acceptance:**
- All tests passing with built app
- TypeScript compilation clean
- Committed to master

#### SP-8030: Bulk Upload E2E Tests (2 days)

**Scope:**
- CSV upload validation (200+ rows)
- Deduplication policies (SKIP / UPDATE_DRAFT / REJECT_CONFLICTS)
- Row-level error reporting
- Retry failed rows only
- Batch status tracking

**Deliverables:**
1. `apps/e2e/pages/SupplierPortalBulkUploadPage.ts` (POM ~300 lines)
2. `apps/e2e/tests/finance/supplier-portal-bulk-upload.spec.ts` (~25 tests)
3. Test CSV fixtures (valid, duplicates, errors)
4. Update `portal-registry.ts` status → `done`

**Acceptance:**
- Large file handling (100+ invoices)
- Fingerprint deduplication verified
- All policies tested
- TypeScript clean, committed

### 2.2 Low Priority (Remaining 6 Items - 5.5 days)

**Order of Execution:**

1. **SP-8031: Announcement E2E** (0.5d)
   - Buyer posts announcement → Supplier sees banner
   - Dismissal + persistence
   - Time-based visibility (`validFrom`/`validUntil`)

2. **SP-8032: Idempotency E2E** (1d)
   - Duplicate invoice submission → same ID returned
   - Case creation with same `Idempotency-Key` → 409 or original
   - Payment initiation retry → no double-post

3. **SP-8033: Case-Message Timeline Integration** (1d)
   - Message on case → appears in unified timeline
   - Proof chain entry created for both events
   - Timeline ordering (chronological)

4. **SP-8034: Document Access Audit** (0.5d)
   - Download document → `audit_log` entry created
   - Actor fingerprint captured
   - Access history visible to OWNER

5. **SP-8035: Payment State Machine Property Tests** (1d)
   - No impossible stage transitions
   - Source precedence (BANK_FILE > ERP > MANUAL)
   - Append-only fact table integrity

6. **SP-8036: Dedupe Fingerprint Tests** (0.5d)
   - Same invoice data → deterministic fingerprint
   - Minor whitespace changes → same fingerprint
   - Different amounts → different fingerprint

**Total Remaining Test Effort:** 3-3.5 days (SP-8029 + SP-8030) + 5.5 days (Low) = **8.5-9 days**

---

## Phase 3: Quality Gates (9000 Series - 7-9 days)

### 3.1 Accessibility Audit (SP-9010) - 2-3 days

**Tools:**
- axe-core DevTools
- WAVE accessibility checker
- Manual keyboard navigation testing

**Scope:**
- All 38 portal pages
- WCAG 2.2 AA compliance
- Focus indicators, ARIA labels
- Screen reader compatibility (NVDA/JAWS)

**Deliverables:**
- Accessibility audit report
- Remediation tickets for failures
- Re-test after fixes

### 3.2 Performance Baseline (SP-9011) - 1 day

**Target:** Lighthouse score ≥90

**Pages to Benchmark:**
- Portal dashboard
- Invoice list (100+ items)
- Case detail view
- Payment tracking

**Metrics:**
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Total Blocking Time (TBT) < 200ms
- Cumulative Layout Shift (CLS) < 0.1

**Deliverables:**
- Baseline Lighthouse report
- Performance optimization plan (if needed)

### 3.3 OpenAPI Completeness (SP-9012) - 1-2 days

**Validation:**
- All 60+ portal endpoints documented
- Request/response schemas accurate
- Authentication flows documented
- Error codes cataloged

**Deliverables:**
- Updated `docs/openapi.json`
- Validation against running API
- Published to developer portal

### 3.4 Load Testing (SP-9013) - 2 days

**Tool:** k6

**Scenarios:**
- 500 concurrent sessions
- Invoice submission burst (50 req/s)
- Document download spike (100 req/s)
- Case creation sustained load (10 req/s for 10min)

**Success Criteria:**
- p95 latency < 500ms
- Error rate < 0.1%
- No database connection pool exhaustion

**Deliverables:**
- k6 test scripts (`tools/k6/portal-load-test.js`)
- Load test report
- Auto-scaling recommendations

### 3.5 Rate Limit Testing (SP-9014) - 1 day

**Scope:**
- Per-user rate limits (keyed by `actorFingerprint`)
- Per-API-key rate limits
- Burst allowance vs sustained

**Test Cases:**
- 100 requests in 10s → 429 after threshold
- Different users same API key → independent limits
- Retry-After header verification

**Deliverables:**
- k6 rate limit burst script
- Rate limit verification report

**Total Quality Gate Effort:** 7-9 days

---

## Phase 4: Pre-Production (Week 5-6)

### 4.1 Security Review (2-3 days)

**Scope:**
- OWASP Top 10 assessment
- SQL injection testing (parameterized queries verified)
- XSS prevention (CSP headers, input sanitization)
- CSRF token validation
- Session management security

**Deliverables:**
- Security assessment report
- Remediation plan
- Penetration test results (if contracted)

### 4.2 User Acceptance Testing (3-5 days)

**Pilot Suppliers:** 1-3 real suppliers

**Test Scenarios:**
- Onboarding workflow (invite → activate → upload docs)
- Invoice submission → reconciliation → payment tracking
- Case creation → escalation → resolution
- Document vault usage

**Success Criteria:**
- 90%+ task completion rate
- < 3 critical bugs discovered
- Positive UX feedback (SUS score ≥70)

**Deliverables:**
- UAT test plan
- Feedback collection (surveys, interviews)
- Bug fix backlog

---

## Timeline Summary

| Phase | Work Items | Effort | Target Completion |
|-------|------------|--------|-------------------|
| **Phase 1** | Registry + Doc Updates | 0.5d | 2026-03-03 (Today) |
| **Phase 2** | Remaining Tests (8 suites) | 8.5-9d | 2026-03-14 |
| **Phase 3** | Quality Gates (5 items) | 7-9d | 2026-03-25 |
| **Phase 4** | Security + UAT | 5-8d | 2026-04-04 |

**Total Remaining:** 21-26.5 days (original estimate was 21-27 days)  
**Adjusted for Completed Work:** 15-20.5 days from today

**Production Target:** April 4, 2026 (single engineer)  
**With 2 Engineers:** March 25, 2026 (parallelizing Phase 2 + 3)

---

## Implementation Order (Next 5 Work Items)

1. ✅ **Today (0.5d):** Update registry + planning docs (this plan)
2. **Tomorrow (1d):** SP-8029 Compliance E2E Tests
3. **Day 3-4 (2d):** SP-8030 Bulk Upload E2E Tests
4. **Day 5 (0.5d):** SP-8031 Announcement E2E Tests
5. **Day 6 (1d):** SP-8032 Idempotency E2E Tests

Then proceed to quality gates starting with SP-9010 (Accessibility).

---

## Success Metrics

**Completion Criteria:**
- ✅ 102/102 CI gates passing
- ✅ 0 TypeScript errors
- ✅ All 14 remaining test suites implemented (100% test coverage)
- ✅ All 5 quality gates passed
- ✅ Security review completed
- ✅ UAT with pilot suppliers successful

**Risk Mitigation:**
- Daily progress tracking via `portal-registry.ts` status updates
- Commit-per-work-item for easy rollback
- E2E tests require built app (document in README)
- Load test in staging environment (not production)

---

## Appendix: SP Code Resolution

### Original Conflict (Planning vs Registry)

| SP Code | Planning Intent | Registry Actual | Resolution |
|---------|----------------|-----------------|------------|
| SP-8014 | Escalation E2E | Escalation Service Tests | Planning → SP-8027 |
| SP-8015 | Reconciliation E2E | Location Service Tests | Planning → SP-8028 |
| SP-8016 | Compliance E2E | Directory Service Tests | Planning → SP-8029 |
| SP-8017 | Bulk Upload E2E | Onboarding Service Tests | Planning → SP-8030 |
| SP-8018 | Announcement E2E | Compliance Service Tests | Planning → SP-8031 |
| SP-8019 | Idempotency E2E | Case Service Tests | Planning → SP-8032 |

### New Codes Minted (8027-8036)

All new E2E and property test codes use 8027+ to avoid conflicts with existing service-level tests (8014-8019).

---

**Plan Status:** Ready for Implementation  
**Next Action:** Execute Phase 1 registry updates
