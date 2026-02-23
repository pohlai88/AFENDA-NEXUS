Got it. The problem with the prior doc is that “evidence pointers” accidentally lock you into **a specific implementation** (Drizzle/Fastify/file paths), which can become wrong the moment the stack or layout changes. What you want is a **stack-agnostic, structure-driven AIS benchmark**: auditors + architects can read it, and engineers can implement it in *any* tech.
Below is a **verbose verdict** AIS benchmark for GL + Finance spine that is **100% non-tech-stack** and **does not map to files, frameworks, or libraries**. It focuses on: **capability, invariant, controls, data boundaries, audit evidence, and test expectations**.

If you want, I can replace the canvas doc with this exact version.

---

## AIS Benchmark Verdict — Finance Spine (General Ledger First, Stack-Agnostic)

### Verdict standard (how “pass” is determined)

A capability is considered **enterprise-grade** only if all five are true:

1. **Control objective is explicit** (what risk it prevents).
2. **Invariant is enforceable** (cannot be bypassed under concurrency).
3. **Evidence is auditable** (who/what/when/why; tamper-evident).
4. **Scope is correct** (tenant/company/ledger/period/currency boundaries are unambiguous).
5. **Failure modes are defined** (how it fails safely and how it recovers).

This avoids “it exists in code” and forces “it is correct as a system.”

---

# A) Foundation Controls (INF-xx) — Required for every finance capability

### INF-01 Tenant isolation (mandatory)

* **Objective:** prevent cross-tenant data access.
* **Invariant:** every read/write is bound to exactly one tenant scope.
* **Evidence:** audit logs show tenant scope on every transaction; penetration tests show no leakage.
* **Test expectations:** cross-tenant read/write attempts must fail deterministically.

### INF-02 Company boundary (mandatory)

* **Objective:** prevent mixing legal entities.
* **Invariant:** postings are always attributed to exactly one company; cross-company is only via explicit intercompany constructs.
* **Evidence:** all journals carry company attribution; reports reconcile by company.
* **Test expectations:** a journal cannot contain lines belonging to different companies.

### INF-03 Ledger boundary (mandatory)

* **Objective:** prevent posting into the wrong ledger set (different accounting bases).
* **Invariant:** every journal posts into exactly one ledger; ledger determines base currency + reporting rules.
* **Evidence:** ledger is included in every posted fact and report artifact.
* **Test expectations:** cannot post if ledger is ambiguous or missing.

### INF-04 Fiscal period governance (mandatory)

* **Objective:** prevent backdating or violating close.
* **Invariant:** every posting date maps to exactly one allowed period; closed/locked periods reject postings.
* **Evidence:** close/lock events are recorded with actor + timestamp + reason.
* **Test expectations:** posting into CLOSED/LOCKED must fail; reopen constraints must hold.

### INF-05 Idempotency & exactly-once command behavior (mandatory)

* **Objective:** prevent duplicate postings from retries/timeouts.
* **Invariant:** duplicate command submissions result in the same outcome (or a deterministic conflict).
* **Evidence:** idempotency ledger shows key → outcome reference.
* **Test expectations:** concurrency tests show no double posting.

### INF-06 Audit trail completeness (mandatory)

* **Objective:** enable forensic reconstruction.
* **Invariant:** every state change is logged with actor, time, reason, before/after summary.
* **Evidence:** immutable audit event stream with correlation IDs.
* **Test expectations:** no mutation without an audit record.

### INF-07 Immutability of posted facts (mandatory)

* **Objective:** prevent silent ledger tampering.
* **Invariant:** posted journals/lines cannot be edited or deleted; corrections are additive (reversal/adjustment).
* **Evidence:** attempt to modify posted facts is rejected and logged.
* **Test expectations:** mutation attempts fail even under race conditions.

---

# B) Core GL (GL-xx) — AIS Benchmark Verdict

## GL-01 Chart of Accounts hierarchy

* **Objective:** consistent account structure for reporting/compliance.
* **Invariant:** COA is a valid tree/DAG per policy; cycles forbidden; parent references valid.
* **Controls:** approval workflow for COA changes; effective dating if needed.
* **Evidence:** COA version history; who changed what and why.
* **Tests:** cycle detection; subtree rollups stable; historical reporting not broken.

## GL-02 Journal entry creation (draft fact capture)

* **Objective:** capture accounting intent before posting.
* **Invariant:** journal has identity, attribution (tenant/company/ledger), posting date intent, and lines.
* **Controls:** validation of required fields; defaulting rules; permission checks.
* **Evidence:** draft lifecycle events and approvals (if enabled).
* **Tests:** rejects invalid line shapes; rejects missing attribution fields.

## GL-03 Double-entry balancing (core accounting invariant)

* **Objective:** prevent out-of-balance ledger.
* **Invariant:** sum(debits) == sum(credits) **in base accounting unit** (precision rules defined).
* **Controls:** balance check at commit boundary; rounding rules consistent.
* **Evidence:** posting record shows computed totals and rounding decisions.
* **Tests:** randomized journals cannot bypass balancing; precision edge cases covered.

## GL-04 Minimum double-entry structure

* **Objective:** prevent single-line “fake” entries.
* **Invariant:** minimum 2 lines (or equivalent debit/credit representation).
* **Controls:** enforce at entry and at post.
* **Evidence:** posting record includes line count + classification.
* **Tests:** single-line attempts fail.

## GL-05 Posting workflow (draft → posted)

* **Objective:** ensure posted facts are finalized and traceable.
* **Invariant:** posting is atomic: status transition + balances impact + audit event + downstream notification.
* **Controls:** authorization; idempotency; period validation; concurrency safety.
* **Evidence:** a single posting record links journal, period, ledger, actor, timestamp, and outcome.
* **Tests:** retry-safe; race-safe; partial failure cannot leave half-posted state.

## GL-06 Reversal (posted correction)

* **Objective:** correct errors without altering posted facts.
* **Invariant:** reversal creates a new journal that offsets the original; original is marked reversed with linkage.
* **Controls:** reversal authorization; reason required; period rules (same/open period policy).
* **Evidence:** original ↔ reversal trace link; audit shows reason.
* **Tests:** reversal preserves trial balance integrity; cannot reverse a draft.

## GL-07 Void / cancel (draft-only cancellation)

* **Objective:** cancel unposted intents without ledger impact.
* **Invariant:** only unposted states can be voided; voided items remain traceable.
* **Controls:** void requires reason; cannot delete.
* **Evidence:** void event in audit trail.
* **Tests:** cannot void posted; voided drafts excluded from posting pipeline.

## GL-08 Trial balance generation

* **Objective:** verify ledger integrity for a period and reporting.
* **Invariant:** TB totals match ledger activity; debits==credits.
* **Controls:** deterministic computation; stable filters (company/ledger/period/currency rules).
* **Evidence:** TB report artifact saved with parameters + generation timestamp.
* **Tests:** TB matches known fixtures; reconciliation tests with posted journals.

## GL-09 Account classification (reporting)

* **Objective:** consistent financial statement mapping.
* **Invariant:** every account maps to a statement category under the chosen reporting standard.
* **Controls:** classification rules versioned; overrides tracked.
* **Evidence:** mapping table/version history.
* **Tests:** category coverage complete; no orphan accounts.

## GL-10 Period close controls (operational accounting control)

* **Objective:** prevent late postings and enable clean close.
* **Invariant:** close blocks posting; lock blocks reopen; reopen allowed only per policy.
* **Controls:** close checklist; approvals; close sequencing across companies if required.
* **Evidence:** close/lock event logs; checklist evidence attachments (optional).
* **Tests:** attempts to post into closed/locked fail.

## GL-11 Budget baseline + budget vs actual

* **Objective:** planning and variance control.
* **Invariant:** budgets are scoped (tenant/company/ledger/period/dimension) and versioned.
* **Controls:** approval for budget revisions; variance thresholds and alerts.
* **Evidence:** budget versions + variance reports saved.
* **Tests:** variance calculation is stable; dimension filters correct.

## GL-12 Audit-grade lifecycle trail

* **Objective:** SOX-style auditability.
* **Invariant:** every lifecycle transition is recorded and immutable.
* **Controls:** actor identity required for writes; system actor for automated actions.
* **Evidence:** lifecycle timeline per journal (created → posted → reversed/voided).
* **Tests:** no transition without audit record; correlation IDs preserved.

---

# C) Foreign Exchange (FX-xx) — AIS Verdict (stack-agnostic)

## FX-01 Multi-currency line support

* **Objective:** allow transaction currency while maintaining base reporting.
* **Invariant:** each line has transaction currency amount; base currency amount is deterministically derived.
* **Controls:** currency code validation; precision rules per currency.
* **Evidence:** stored transaction + base + rate reference metadata.
* **Tests:** same-currency pass-through; foreign conversion correct.

## FX-02 Rate sourcing & effective dating

* **Objective:** correct rate selection.
* **Invariant:** rate used must be traceable and effective for the date/time rule.
* **Controls:** rate source hierarchy (official/provider/manual) and approvals.
* **Evidence:** rate audit record includes source, timestamp, spread/quality flags.
* **Tests:** missing rate fails; stale rate triggers policy-defined behavior.

## FX-03 Triangulation / cross rates

* **Objective:** compute rates when direct pair missing.
* **Invariant:** triangulation method is deterministic and traceable.
* **Controls:** allowed triangulation currencies; tolerance thresholds.
* **Evidence:** shows path used (A→X→B) and components.
* **Tests:** triangulation matches expected results.

## FX-04 Revaluation & unrealized gain/loss

* **Objective:** accurate period-end valuation.
* **Invariant:** revaluation entries are reproducible given rates and positions.
* **Controls:** revaluation run is versioned and reversible.
* **Evidence:** run artifact (inputs/outputs) saved.
* **Tests:** position-based calculations correct.

## FX-05 Translation & CTA

* **Objective:** consolidate across functional currencies.
* **Invariant:** translation rules per standard are explicit; CTA computed consistently.
* **Controls:** translation method locked per entity/ledger policy.
* **Evidence:** translation run artifact with CTA breakout.
* **Tests:** CTA matches fixtures.

---

# D) Intercompany (IC-xx) — AIS Verdict (structure-first)

## IC-01 Agreement governance

* **Objective:** prevent informal cross-entity posting.
* **Invariant:** intercompany requires an agreement (active, dated, policy-defined).
* **Controls:** approval; effective dating; termination.
* **Evidence:** agreement history and applied policy per transaction.
* **Tests:** no agreement → reject.

## IC-02 Paired entries (mirror journals)

* **Objective:** maintain symmetry across entities.
* **Invariant:** every IC transaction creates paired journals with trace linkage.
* **Controls:** imbalance detection; currency policy; tax policy link.
* **Evidence:** transaction record links both legs and agreement.
* **Tests:** paired integrity holds under retries and partial failures.

## IC-03 Elimination readiness

* **Objective:** enable consolidation elimination.
* **Invariant:** IC postings are tagged for elimination categories.
* **Controls:** elimination mapping; reconciliation reports.
* **Evidence:** elimination workpapers artifacts.
* **Tests:** elimination calculation fixtures.

## IC-04 Settlement tracking

* **Objective:** track open IC balances and settle correctly.
* **Invariant:** settlement changes outstanding positions deterministically; partial settlement supported.
* **Controls:** settlement approvals; FX differences policy.
* **Evidence:** open-items aging and settlement ledger.
* **Tests:** open-items reduce correctly; cannot over-settle.

---

# E) Accounting Hub (AH-xx) — AIS Verdict (structure-first)

## AH-01 Derivation rules (subledger → GL)

* **Objective:** consistent posting derivation from business events.
* **Invariant:** given the same source event, derived posting is deterministic and versioned.
* **Controls:** rule versioning; approvals; simulation mode.
* **Evidence:** derivation record stores rule version and inputs.
* **Tests:** golden tests per rule set.

## AH-02 Allocation engine

* **Objective:** allocate costs/revenue fairly and traceably.
* **Invariant:** allocation sums preserved; rounding policy deterministic.
* **Controls:** driver governance; audit trail; reversal support.
* **Evidence:** allocation run artifact.
* **Tests:** sums preserved; rounding stable.

## AH-03 Accrual engine

* **Objective:** recognize revenue/expense in correct period.
* **Invariant:** schedules generate postings deterministically; modifications produce auditable adjustments.
* **Controls:** schedule approvals; modification rules.
* **Evidence:** schedule + posting roll-forward.
* **Tests:** roll-forward fixtures.

## AH-04 Revenue recognition schedules

* **Objective:** compliance with rev-rec standards (principles-level).
* **Invariant:** recognized vs deferred tracked; contract mods handled.
* **Controls:** contract change approvals; catch-up logic policy.
* **Evidence:** deferred revenue roll-forward artifact.
* **Tests:** known scenarios.

---

# D-bis) Recurring & Automated Entries (RE-xx) — AIS Verdict (structure-first)

## RE-01 Recurring journal templates

* **Objective:** automate repetitive postings (rent, depreciation, accruals).
* **Invariant:** a template produces identical journal structure on each run; schedule is deterministic.
* **Controls:** template approval; frequency governance; effective/expiry dating; disable without delete.
* **Evidence:** template version history; each generated journal links back to its template + run ID.
* **Tests:** generated journals match template shape; expired templates do not fire; frequency boundaries respected.

## RE-02 Idempotent batch execution

* **Objective:** prevent duplicate postings from retries or overlapping cron runs.
* **Invariant:** a (template, period) pair produces at most one journal per scheduled run.
* **Controls:** idempotency key derived from template ID + period ID + run date; claim-or-get pattern.
* **Evidence:** idempotency ledger shows key → outcome reference for each run.
* **Tests:** concurrent batch runs do not double-post; partial failures leave clean state.

## RE-03 Recurring schedule audit trail

* **Objective:** trace every automated action for SOX compliance.
* **Invariant:** every template execution (success or skip) is logged with actor (system or user), timestamp, and outcome.
* **Controls:** system actor identity for automated runs; manual override requires reason.
* **Evidence:** batch run log with template ID, period, outcome (posted/skipped/failed), and correlation ID.
* **Tests:** no template execution without audit record; skipped templates logged with reason.

---

# E-bis) Financial Reporting (FR-xx) — AIS Verdict (structure-first)

## FR-01 Balance Sheet generation

* **Objective:** produce a classified statement of financial position.
* **Invariant:** assets = liabilities + equity; totals reconcile to trial balance.
* **Controls:** account classification mapping (GL-09); period boundary enforcement; comparative period alignment.
* **Evidence:** report artifact with parameters (company/ledger/period/currency), generation timestamp, and classification version.
* **Tests:** totals match TB; reclassifications reflected; comparative periods stable.

## FR-02 Income Statement generation

* **Objective:** produce a classified statement of profit or loss for a period.
* **Invariant:** revenue − expenses = net income; totals reconcile to TB activity accounts.
* **Controls:** account classification mapping; period boundary; revenue/expense account type filtering.
* **Evidence:** report artifact with parameters, generation timestamp, and classification version.
* **Tests:** totals match TB activity; multi-period comparisons stable; account type filtering correct.

## FR-03 Cash Flow Statement generation

* **Objective:** classify cash movements by operating/investing/financing activities.
* **Invariant:** net cash change reconciles to balance sheet cash movement between periods.
* **Controls:** cash flow classification rules (direct/indirect method); account mapping to activity categories.
* **Evidence:** report artifact with method, parameters, and classification version.
* **Tests:** net cash change matches BS cash delta; activity totals sum to net change; indirect method adjustments correct.

## FR-04 Report parameterization & scoping

* **Objective:** ensure reports respect tenant/company/ledger/period/currency boundaries.
* **Invariant:** every report is scoped to exactly one combination of boundaries; cross-scope aggregation is explicit consolidation.
* **Controls:** parameter validation; missing parameter rejection; default rules documented.
* **Evidence:** report metadata includes all scope parameters.
* **Tests:** missing required parameters rejected; cross-company reports only via consolidation path.

## FR-05 Comparative period support

* **Objective:** enable period-over-period analysis.
* **Invariant:** comparative figures use the same classification rules and scope as the primary period.
* **Controls:** classification version pinning; period alignment rules.
* **Evidence:** comparative report shows both periods with consistent classification.
* **Tests:** reclassification in current period does not retroactively change comparatives unless policy allows.

## FR-06 Budget variance reporting

* **Objective:** compare actual results against budget baselines.
* **Invariant:** variance = actual − budget; percentage variance computed consistently.
* **Controls:** budget version selection; dimension alignment (account/period/company).
* **Evidence:** variance report artifact with budget version, actual source, and computation parameters.
* **Tests:** variance calculations match known fixtures; zero-budget edge cases handled; dimension mismatches rejected.

---

# F) What this benchmark *explicitly refuses* (to avoid wrong mapping)

* No mention of frameworks, ORMs, routes, repos, filenames, folders.
* No “done/partial/planned” markers.
* No coupling to a single posting engine design pattern beyond the **principle**: orchestration vs enforcement.
* No implied implementation: only **system requirements** and **audit evidence expectations**.

---

## Final verdict

This is the **correct direction**: AIS benchmark should describe **truth requirements**, not the **current code shape**.
When you later want automation, you generate mappings **from your codebase** into this benchmark—not the other way around.

If you want, paste your preferred category set (GL/AR/AP/FA/TAX/TREASURY/CONSOL/STAT/REVREC) and I’ll expand this into the full ~280 AIS benchmark in the same style, still stack-agnostic.
