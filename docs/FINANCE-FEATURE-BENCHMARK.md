# Finance Domain Feature Benchmark

> Consolidated feature matrix comparing 4 codebases across 28 standardized accounting/finance categories.
> Canonical reference: AFENDA-NEXUS AIS-BENCHMARK.md (280 items, IFRS/GAAP/COSO authorities).
>
> Last generated: 2026-02-24

---

## Sources

| Code | Path | Description | Tech Stack |
|------|------|-------------|------------|
| **S1** | `NEXUSCANON-AFENDA/packages/modules/finance` | Current monorepo — GL spine | TypeScript, Fastify, Drizzle, Neon PG17 |
| **S2** | `AFENDA-NEXUS/business-domain/finance` | Prior architecture — full AIS | TypeScript, Drizzle, 37 domain packages |
| **S3** | `gangof4/erpnext` | ERPNext OSS | Python, Frappe, MariaDB/Postgres |
| **S4** | `gangof4/extractions/erpnext/v3` | ERPNext → TypeScript extraction | TypeScript, Drizzle, Hono, Zod |

### Scale Comparison

| Metric | S1 | S2 | S3 | S4 |
|--------|----|----|----|----|
| Packages / Modules | 1 | 37 | 21 | 1 (monolith) |
| Entity types | 11 | ~120 | ~450 | ~450 |
| HTTP endpoints | 35 | ~200 | ~900 (CRUD) | ~900 (CRUD) |
| Test files | 24 | 167 | ~300 | ~20 |
| Tests | 245 | 1,921 | ~2,000 | — |
| Benchmark items covered | 41/41 | 280/280 | ~140/280 | same as S3 |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented with tests/evidence |
| 🔧 | Partially implemented or basic support |
| ⏳ | Not present |
| ➡️ | Same as S3 (S4 is mechanical extraction) |

---

## Summary Scorecard

| # | Category | Items | S1 | S2 | S3 | S4 |
|---|----------|-------|----|----|----|----|
| 1 | GL Structure | 10 | 8 | 10 | 7 | ➡️ |
| 2 | Double-Entry Engine | 10 | 9 | 10 | 8 | ➡️ |
| 3 | Accounts Payable | 10 | 0 | 10 | 8 | ➡️ |
| 4 | Accounts Receivable | 10 | 0 | 10 | 7 | ➡️ |
| 5 | Revenue Recognition | 10 | 4 | 10 | 3 | ➡️ |
| 6 | Fixed Assets | 10 | 0 | 10 | 8 | ➡️ |
| 7 | Lease Accounting | 10 | 0 | 10 | 0 | ➡️ |
| 8 | Tax Engine | 10 | 0 | 10 | 5 | ➡️ |
| 9 | Consolidation / IC | 10 | 5 | 10 | 3 | ➡️ |
| 10 | Treasury / Cash | 10 | 1 | 10 | 4 | ➡️ |
| 11 | FX Management | 10 | 5 | 10 | 4 | ➡️ |
| 12 | Financial Close | 10 | 7 | 10 | 5 | ➡️ |
| 13 | Budgeting | 10 | 3 | 10 | 5 | ➡️ |
| 14 | Cost Accounting | 10 | 2 | 10 | 4 | ➡️ |
| 15 | Project Accounting | 10 | 0 | 10 | 5 | ➡️ |
| 16 | Credit Management | 10 | 0 | 10 | 4 | ➡️ |
| 17 | Bank Reconciliation | 10 | 0 | 10 | 6 | ➡️ |
| 18 | Expense Management | 10 | 0 | 10 | 3 | ➡️ |
| 19 | Subscription Billing | 10 | 3 | 10 | 5 | ➡️ |
| 20 | Provisions (IAS 37) | 10 | 0 | 10 | 0 | ➡️ |
| 21 | Intangible Assets (IAS 38) | 10 | 0 | 10 | 0 | ➡️ |
| 22 | Financial Instruments (IFRS 9) | 10 | 0 | 10 | 0 | ➡️ |
| 23 | Hedge Accounting | 10 | 0 | 10 | 0 | ➡️ |
| 24 | Transfer Pricing | 10 | 1 | 10 | 0 | ➡️ |
| 25 | Internal Controls (COSO) | 10 | 7 | 10 | 4 | ➡️ |
| 26 | Data Architecture | 10 | 8 | 10 | 4 | ➡️ |
| 27 | Statutory Reporting | 10 | 4 | 10 | 3 | ➡️ |
| 28 | Subledger Architecture (SLA) | 10 | 3 | 10 | 2 | ➡️ |
| | **TOTAL** | **280** | **70** | **280** | **~112** | ➡️ |

---

## Per-Category Detail

### 1. Chart of Accounts & GL Structure

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| GL-01 | Hierarchical CoA with account groups | IAS 1, ASC 210 | ✅ `coa-hierarchy.ts` | ✅ `gl-platform` | ✅ `Account` tree doctype |
| GL-02 | Account type enforcement (debit/credit-normal) | AIS textbooks | ✅ `report-classifier.ts` | ✅ `accounting` | ✅ `Account.root_type` |
| GL-03 | Multi-ledger (IFRS, local GAAP, tax) | IAS 1 §16 | ✅ `ILedgerRepo`, ledger per entity | ✅ `gl-platform` | 🔧 `Finance Book` (parallel depreciation only) |
| GL-04 | Posting period control (open/soft-close/hard-close) | SAP FI | ✅ `closePeriod`/`lockPeriod`/`reopenPeriod` | ✅ `gl-platform` | ✅ `Accounting Period` |
| GL-05 | Document types + posting keys | SAP FI | 🔧 journal types only | ✅ `gl-platform` | ✅ `Journal Entry.voucher_type` |
| GL-06 | Number ranges per document type | SAP FI | ✅ `IDocumentNumberGenerator` | ✅ `gl-platform` | ✅ Frappe naming series |
| GL-07 | Account balance = sum of posted lines | Double-entry axiom | ✅ GL balance upsert in posting tx | ✅ `accounting` | ✅ `Account Closing Balance` |
| GL-08 | Trial balance at any point-in-time | IFRS 10 | ✅ `getTrialBalance` service | ✅ `accounting` | ✅ `Trial Balance` report |
| GL-09 | Segment / cost-center dimensions | SAP CO | ✅ `segment-dimension.ts` | ✅ `accounting-hub` | ✅ `Accounting Dimension`, `Cost Center` |
| GL-10 | IC elimination accounts | IFRS 10 §B86 | ✅ `ic-elimination.ts` | ✅ `intercompany` | ⏳ no native IC elimination |

### 2. Double-Entry Bookkeeping Engine

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| DE-01 | sum(debits) = sum(credits) enforced | Accounting axiom | ✅ `journal-balance.ts` + DB trigger | ✅ `accounting` | ✅ `GL Entry` validation |
| DE-02 | Journal header + lines (1:N) | Romney & Steinbart | ✅ `gl_journal` + `gl_journal_line` | ✅ `accounting` | ✅ `Journal Entry` + `Journal Entry Account` |
| DE-03 | Functional + transaction currency per line | IAS 21 §20 | ✅ `currencyCode` + `baseCurrencyDebit/Credit` | ✅ `accounting` | ✅ multi-currency on GL Entry |
| DE-04 | Reversal journal (mirror entry) | IAS 10 | ✅ `reverseJournal` service | ✅ `accounting` | ✅ `Journal Entry.is_opening` reversal |
| DE-05 | Posting status machine (draft→posted→reversed) | Audit requirement | ✅ `DRAFT→POSTED→REVERSED/VOIDED` | ✅ `accounting` | ✅ `docstatus` (0→1→2) |
| DE-06 | Document splitting by segment | SAP New GL | 🔧 dimension on lines, no auto-split | ✅ `accounting-hub` | 🔧 `Accounting Dimension` (manual) |
| DE-07 | Recurring journal templates | ERPNext | ✅ `IRecurringTemplateRepo` + `processRecurringJournals` | ✅ `accounting` | ✅ `Journal Entry Template` + `Process Subscription` |
| DE-08 | Batch posting with rollback | ACID | ✅ atomic `withTenant()` tx | ✅ `accounting` | ✅ Frappe `db.commit()`/`db.rollback()` |
| DE-09 | Audit trail (who, when, source) | AICPA AU-C §315 | ✅ `IJournalAuditRepo` + `IPeriodAuditRepo` | ✅ `accounting` | ✅ Frappe `_comments`, `modified_by` |
| DE-10 | Integer minor units (no floating point) | IEEE 754 risk | ✅ `bigint` money columns | ✅ `accounting` | ⏳ uses `Currency` field (float-backed `decimal`) |

### 3. Accounts Payable

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| AP-01 | 3-way match (PO → GR → Invoice) | COSO | ⏳ | ✅ `payables` | ✅ `Purchase Invoice` ↔ `Purchase Receipt` ↔ `Purchase Order` |
| AP-02 | Supplier invoice aging | ASC 210-20 | ⏳ | ✅ `payables` | ✅ `Accounts Payable` report |
| AP-03 | Payment run (batch by due date) | ERPNext | ⏳ | ✅ `payables` | ✅ `Payment Order` |
| AP-04 | Early payment discount (2/10 net 30) | ASC 310-10 | ⏳ | ✅ `payables` | ✅ `Payment Terms Template` |
| AP-05 | Supplier statement reconciliation | AICPA | ⏳ | ✅ `payables` | 🔧 `Payment Reconciliation` (general) |
| AP-06 | ISO 20022 pain.001 payment file | SWIFT/ISO | ⏳ | ✅ `payables` | ⏳ |
| AP-07 | Withholding tax at payment | Local tax law | ⏳ | ✅ `withholding-tax` | ✅ `Tax Withholding Category` |
| AP-08 | Debit memo / credit note | ERPNext | ⏳ | ✅ `payables` | ✅ `Purchase Invoice.is_return` |
| AP-09 | Duplicate invoice detection | COSO | ⏳ | ✅ `payables` | ✅ `Purchase Invoice` unique validation |
| AP-10 | Accrued liabilities for uninvoiced GRs | IAS 37 | ⏳ | ✅ `payables` | ✅ `Billed Items To Be Received` report |

### 4. Accounts Receivable

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| AR-01 | Customer invoice with line-level tax | IFRS 15 | ⏳ | ✅ `receivables` | ✅ `Sales Invoice` + `Sales Taxes and Charges` |
| AR-02 | Payment allocation (FIFO/specific) | ASC 310-10 | ⏳ | ✅ `receivables` | ✅ `Payment Reconciliation` |
| AR-03 | Customer aging report | ASC 310-10 | ⏳ | ✅ `receivables` | ✅ `Accounts Receivable` report |
| AR-04 | ECL provisioning (IFRS 9 staging) | IFRS 9 §5.5 | ⏳ | ✅ `receivables` | ⏳ |
| AR-05 | Write-off workflow with approval | AICPA | ⏳ | ✅ `receivables` | 🔧 manual JE write-off |
| AR-06 | Collection action tracking (dunning) | COSO | ⏳ | ✅ `receivables` | ✅ `Dunning` doctype |
| AR-07 | Credit note / return handling | ERPNext | ⏳ | ✅ `receivables` | ✅ `Sales Invoice.is_return` |
| AR-08 | IC receivable matching | IFRS 10 §B86 | ⏳ | ✅ `receivables` | ⏳ |
| AR-09 | Factoring / assignment of receivables | IFRS 9 §3.2 | ⏳ | ✅ `receivables` | ✅ `Invoice Discounting` |
| AR-10 | Revenue recognition integration | IFRS 15 | ⏳ | ✅ `receivables` | 🔧 `Deferred Revenue` (basic) |

### 5. Revenue Recognition (IFRS 15 / ASC 606)

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| RR-01 | 5-step model | IFRS 15 §9 | 🔧 `recognizeRevenue` service (simplified) | ✅ `revenue-recognition` | ⏳ |
| RR-02 | Performance obligation identification | IFRS 15 §22 | ⏳ | ✅ `revenue-recognition` | ⏳ |
| RR-03 | Standalone selling price allocation | IFRS 15 §74 | ⏳ | ✅ `revenue-recognition` | ⏳ |
| RR-04 | Point-in-time vs over-time criteria | IFRS 15 §35 | ⏳ | ✅ `revenue-recognition` | ⏳ |
| RR-05 | Percentage-of-completion | IFRS 15 §39 | ⏳ | ✅ `revenue-recognition` | ⏳ |
| RR-06 | Variable consideration constraint | IFRS 15 §56 | ⏳ | ✅ `revenue-recognition` | ⏳ |
| RR-07 | Contract modification accounting | IFRS 15 §20 | ⏳ | ✅ `revenue-recognition` | ⏳ |
| RR-08 | Contract asset vs contract liability | IFRS 15 §105 | ✅ `deferred-revenue.ts` roll-forward | ✅ `revenue-recognition` | 🔧 `Process Deferred Accounting` |
| RR-09 | Milestone-based recognition | IFRS 15 §B14 | ✅ `revenue-recognition.ts` milestone calc | ✅ `revenue-recognition` | ⏳ |
| RR-10 | Subscription ratable recognition | IFRS 15 §35(b) | ✅ `revenue-recognition.ts` straight-line | ✅ `subscription-billing` | 🔧 `Subscription` (basic) |

### 6. Fixed Assets (IAS 16 / ASC 360)

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| FA-01 | Asset register (cost, accum depr, NBV) | IAS 16 §30 | ⏳ | ✅ `fixed-assets` | ✅ `Asset` doctype |
| FA-02 | Depreciation methods (SL, DB, UoP) | IAS 16 §62 | ⏳ | ✅ `fixed-assets` | ✅ `Asset Depreciation Schedule` |
| FA-03 | Useful life + residual value review | IAS 16 §51 | ⏳ | ✅ `fixed-assets` | ✅ `Asset Finance Book` |
| FA-04 | Component accounting | IAS 16 §43 | ⏳ | ✅ `fixed-assets` | 🔧 via separate asset records |
| FA-05 | Revaluation model (fair value → OCI) | IAS 16 §31 | ⏳ | ✅ `fixed-assets` | ✅ `Asset Value Adjustment` |
| FA-06 | Impairment testing | IAS 36 | ⏳ | ✅ `fixed-assets` | 🔧 manual adjustment |
| FA-07 | Disposal (gain/loss = proceeds − NBV) | IAS 16 §67 | ⏳ | ✅ `fixed-assets` | ✅ `Asset` sale/scrap workflow |
| FA-08 | Bulk depreciation run | ERPNext | ⏳ | ✅ `fixed-assets` | ✅ `Asset Depreciation Schedule` auto-post |
| FA-09 | Asset transfer between companies | SAP AA | ⏳ | ✅ `fixed-assets` | ✅ `Asset Movement` |
| FA-10 | CWIP → asset capitalization | IAS 16 §7 | ⏳ | ✅ `fixed-assets` | ✅ `Asset Capitalization` |

### 7. Lease Accounting (IFRS 16 / ASC 842)

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| LA-01 | ROU asset recognition | IFRS 16 §22 | ⏳ | ✅ `lease-accounting` | ⏳ |
| LA-02 | Lease liability (PV of payments) | IFRS 16 §26 | ⏳ | ✅ `lease-accounting` | ⏳ |
| LA-03 | Amortization schedule (interest + principal) | IFRS 16 §36 | ⏳ | ✅ `lease-accounting` | ⏳ |
| LA-04 | Lease modification (remeasurement) | IFRS 16 §45 | ⏳ | ✅ `lease-accounting` | ⏳ |
| LA-05 | Lease termination (derecognition) | IFRS 16 §46 | ⏳ | ✅ `lease-accounting` | ⏳ |
| LA-06 | Short-term lease exemption (≤12 months) | IFRS 16 §B34 | ⏳ | ✅ `lease-accounting` | ⏳ |
| LA-07 | Low-value asset exemption | IFRS 16 §B3 | ⏳ | ✅ `lease-accounting` | ⏳ |
| LA-08 | Variable lease payments (index-linked) | IFRS 16 §28 | ⏳ | ✅ `lease-accounting` | ⏳ |
| LA-09 | Sale-and-leaseback | IFRS 16 §98 | ⏳ | ✅ `lease-accounting` | ⏳ |
| LA-10 | Lessor accounting (finance vs operating) | IFRS 16 §61 | ⏳ | ✅ `lease-accounting` | ⏳ |

### 8. Tax Engine

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| TX-01 | Multi-jurisdiction tax rate tables | Local tax law | ⏳ | ✅ `tax-engine` | ✅ `Tax Rule` + `Item Tax Template` |
| TX-02 | Tax code hierarchy (country→state→city) | ERPNext | ⏳ | ✅ `tax-engine` | 🔧 `Tax Category` (flat) |
| TX-03 | Input vs output tax netting (VAT/GST) | EU VAT | ⏳ | ✅ `tax-engine` | ✅ `Sales/Purchase Taxes and Charges` |
| TX-04 | Tax return aggregation by period | Local tax law | ⏳ | ✅ `tax-engine` | 🔧 regional reports |
| TX-05 | SAF-T export | OECD SAF-T | ⏳ | ✅ `tax-engine` | ⏳ |
| TX-06 | Withholding tax (WHT) per payee + treaty | OECD | ⏳ | ✅ `withholding-tax` | ✅ `Tax Withholding Category` |
| TX-07 | Deferred tax (IAS 12 temporary differences) | IAS 12 §15 | ⏳ | ✅ `deferred-tax` | ⏳ |
| TX-08 | Tax provision calculation | IAS 12 | ⏳ | ✅ `deferred-tax` | ⏳ |
| TX-09 | Country-specific formats (MY SST, SG GST, etc.) | Local regulations | ⏳ | ✅ `tax-engine` | 🔧 `Regional` module (India, UAE, SA) |
| TX-10 | Transfer pricing arm's-length validation | OECD TP | ⏳ | ✅ `transfer-pricing` | ⏳ |

### 9. Consolidation & Intercompany (IFRS 10 / ASC 810)

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| CO-01 | Group ownership hierarchy | IFRS 10 §B85 | ⏳ | ✅ `consolidation` | ⏳ |
| CO-02 | IC transaction matching | IFRS 10 §B86 | ✅ `createIcTransaction` mirror journals | ✅ `intercompany` | 🔧 `Allowed To Transact With` |
| CO-03 | IC elimination (revenue/cost, AR/AP) | IFRS 10 §B86 | ✅ `ic-elimination.ts` | ✅ `consolidation` | ⏳ |
| CO-04 | Non-controlling interest (NCI) | IFRS 10 §22 | ⏳ | ✅ `consolidation` | ⏳ |
| CO-05 | Goodwill on acquisition (IFRS 3) | IFRS 3 §32 | ⏳ | ✅ `consolidation` | ⏳ |
| CO-06 | Currency translation (IAS 21) | IAS 21 §39 | ✅ `fx-translation.ts` | ✅ `consolidation` | ⏳ |
| CO-07 | Ownership % change over time | IFRS 10 §23 | ⏳ | ✅ `consolidation` | ⏳ |
| CO-08 | Dividend elimination | IFRS 10 §B86 | ⏳ | ✅ `consolidation` | ⏳ |
| CO-09 | IC netting (offset payables/receivables) | Treasury | ✅ `ic-aging.ts` open items | ✅ `intercompany` | ⏳ |
| CO-10 | Consolidation journal auto-generation | SAP SEM-BCS | ✅ `ic-elimination.ts` `computeEliminations()` | ✅ `consolidation` | 🔧 `Consolidated Financial Statement` report |

### 10. Treasury & Cash Management

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| TR-01 | Bank account master (IBAN, SWIFT) | ERPNext | ⏳ | ✅ `treasury` | ✅ `Bank Account` |
| TR-02 | Cash flow forecast | IAS 7 | ⏳ | ✅ `treasury` | 🔧 no native forecast |
| TR-03 | Actual vs forecast variance | Treasury | ⏳ | ✅ `treasury` | ⏳ |
| TR-04 | Cash pooling / notional pooling | Treasury | ⏳ | ✅ `treasury` | ⏳ |
| TR-05 | Bank statement import (OFX, MT940, camt.053) | ISO 20022 | ⏳ | ✅ `bank-reconciliation` | ✅ `Bank Statement Import` |
| TR-06 | Covenant monitoring | IFRS 7 | ⏳ | ✅ `treasury` | ⏳ |
| TR-07 | FX exposure reporting (net open position) | IFRS 7 §33 | ⏳ | ✅ `treasury` | ⏳ |
| TR-08 | Investment portfolio tracking | IFRS 9 | ⏳ | ✅ `treasury` | ⏳ |
| TR-09 | IC loan management | IAS 24 | ⏳ | ✅ `treasury` | ⏳ |
| TR-10 | Cash flow statement (indirect method) | IAS 7 §18 | ✅ `getCashFlow` + `cash-flow-indirect.ts` | ✅ `treasury` | ✅ `Cash Flow` report |

### 11. FX Management (IAS 21 / IFRS 9)

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| FX-01 | FX rate types (spot, average, closing) | IAS 21 §21 | ✅ `IFxRateRepo` with effective dating | ✅ `fx-management` | 🔧 `Currency Exchange` (single type) |
| FX-02 | Period-end revaluation of monetary items | IAS 21 §23 | ✅ `fx-revaluation.ts` | ✅ `fx-management` | ✅ `Exchange Rate Revaluation` |
| FX-03 | OCI translation difference tracking | IAS 21 §39 | ✅ `fx-translation.ts` CTA computation | ✅ `fx-management` | ⏳ |
| FX-04 | Forward contract fair value | IFRS 9 §4.1 | ⏳ | ✅ `fx-management` | ⏳ |
| FX-05 | Hedge effectiveness testing (80–125%) | IFRS 9 §6.4.1 | ⏳ | ✅ `fx-management` | ⏳ |
| FX-06 | FX gain/loss (realized vs unrealized) | IAS 21 §28 | ✅ `fx-revaluation.ts` `computeGainLoss()` | ✅ `fx-management` | ✅ `Exchange Rate Revaluation` |
| FX-07 | Multi-currency bank reconciliation | ERPNext | ⏳ | ✅ `bank-reconciliation` | ✅ `Bank Reconciliation Tool` |
| FX-08 | Rate source audit trail | IFRS 13 | ✅ `fx-triangulation.ts` `auditRateSources()` | ✅ `fx-management` | ⏳ |
| FX-09 | Triangulation (cross-rate via USD) | Market convention | ✅ `fx-triangulation.ts` `triangulateRate()` | ✅ `fx-management` | ⏳ |
| FX-10 | Functional currency per entity | IAS 21 §9 | ⏳ | ✅ `fx-management` | 🔧 `Company.default_currency` |

### 12. Financial Close & Reporting

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| FC-01 | Period-end close checklist | AICPA AU-C §265 | ✅ `close-checklist.ts` | ✅ `financial-close` | 🔧 no formal checklist |
| FC-02 | Accrual run (auto-generate from templates) | Accrual basis | ✅ `accrual-engine.ts` | ✅ `financial-close` | 🔧 `Process Deferred Accounting` |
| FC-03 | Allocation run (overhead → cost centers) | Cost accounting | ✅ `derivation-engine.ts` `allocateByDriver()` | ✅ `financial-close` | 🔧 `Cost Center Allocation` |
| FC-04 | Reclassification journals | IFRS 1 §41 | ⏳ | ✅ `financial-close` | 🔧 manual JE |
| FC-05 | Multi-company close sequencing | SAP S/4 | ✅ `close-checklist.ts` `sequenceMultiCompanyClose()` | ✅ `financial-close` | ⏳ |
| FC-06 | Balance sheet (IAS 1 §54) | IAS 1 | ✅ `getBalanceSheet` service | ✅ `statutory-reporting` | ✅ `Balance Sheet` report |
| FC-07 | Income statement (by nature or function) | IAS 1 §99 | ✅ `getIncomeStatement` service | ✅ `statutory-reporting` | ✅ `Profit and Loss Statement` report |
| FC-08 | Cash flow statement (indirect method) | IAS 7 §18 | ✅ `getCashFlow` service | ✅ `statutory-reporting` | ✅ `Cash Flow` report |
| FC-09 | Statement of changes in equity | IAS 1 §106 | ⏳ | ✅ `statutory-reporting` | ⏳ |
| FC-10 | Notes to financial statements | IAS 1 §112 | ⏳ | ✅ `statutory-reporting` | ⏳ |

### 13. Budgeting & Planning

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| BU-01 | Budget versions (original/revised/latest) | SAP BPC | ⏳ | ✅ `budgeting` | 🔧 single version |
| BU-02 | Bottom-up entry by cost center | ERPNext | ⏳ | ✅ `budgeting` | ✅ `Budget` per cost center |
| BU-03 | Budget consolidation across companies | Group planning | ⏳ | ✅ `budgeting` | ⏳ |
| BU-04 | Rolling forecast vs static annual | FP&A | ⏳ | ✅ `budgeting` | ⏳ |
| BU-05 | Budget vs actual variance report | Management acctg | ✅ `getBudgetVariance` + `variance-alerts.ts` | ✅ `budgeting` | ✅ `Budget Variance Report` |
| BU-06 | Budget commitment (encumber on PO) | ERPNext | ⏳ | ✅ `budgeting` | ✅ `Budget` action on PO |
| BU-07 | Budget period (monthly/quarterly/annual) | Configurable | ✅ `IBudgetRepo` period-scoped | ✅ `budgeting` | ✅ `Monthly Distribution` |
| BU-08 | Workflow approval for submissions | COSO | ⏳ | ✅ `budgeting` | 🔧 Frappe workflow (generic) |
| BU-09 | Scenario planning (base/upside/downside) | FP&A | ⏳ | ✅ `budgeting` | ⏳ |
| BU-10 | Budget import from spreadsheet | ERPNext | ⏳ | ✅ `budgeting` | 🔧 Frappe data import (generic) |

### 14. Cost Accounting

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| CA-01 | Cost center hierarchy | SAP CO | ✅ `coa-hierarchy.ts` (shared tree) | ✅ `cost-accounting` | ✅ `Cost Center` tree |
| CA-02 | Cost allocation (direct, step-down, reciprocal) | CIMA | ✅ `derivation-engine.ts` `allocateByDriver()` | ✅ `cost-accounting` | 🔧 `Cost Center Allocation` (flat %) |
| CA-03 | Activity-based costing (ABC) | CIMA | ⏳ | ✅ `cost-accounting` | ⏳ |
| CA-04 | Standard costing variance analysis | CIMA | ⏳ | ✅ `cost-accounting` | 🔧 `BOM` cost vs actual |
| CA-05 | Job costing vs process costing | CIMA | ⏳ | ✅ `cost-accounting` | 🔧 `Job Card` (manufacturing) |
| CA-06 | Overhead absorption rate | CIMA | ⏳ | ✅ `cost-accounting` | ⏳ |
| CA-07 | BOM explosion (multi-level) | Manufacturing ERP | ⏳ | ✅ `cost-accounting` | ✅ `BOM` multi-level |
| CA-08 | WIP valuation → finished goods | IAS 2 | ⏳ | ✅ `cost-accounting` | ✅ `Work Order` WIP tracking |
| CA-09 | Cost rollup (raw → WIP → FG) | ERPNext | ⏳ | ✅ `cost-accounting` | ✅ `BOM Update Tool` |
| CA-10 | Profitability analysis by product/customer | SAP CO-PA | ⏳ | ✅ `cost-accounting` | ✅ `Profitability Analysis` report |

### 15. Project Accounting

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| PA-01 | Project master (budget, dates, billing type) | ERPNext | ⏳ | ✅ `project-accounting` | ✅ `Project` doctype |
| PA-02 | Cost posting to project | IFRS 15 | ⏳ | ✅ `project-accounting` | ✅ `Project` on transactions |
| PA-03 | Earned value management (EV, PV, AC) | PMI PMBOK | ⏳ | ✅ `project-accounting` | ⏳ |
| PA-04 | Percentage-of-completion revenue | IFRS 15 §39 | ⏳ | ✅ `project-accounting` | ⏳ |
| PA-05 | WIP-to-revenue transfer journal | IAS 11 | ⏳ | ✅ `project-accounting` | ⏳ |
| PA-06 | Project billing (milestone, T&M, fixed-fee) | IFRS 15 | ⏳ | ✅ `project-accounting` | ✅ `Project.billing_type` (fixed/T&M) |
| PA-07 | IC project cost recharge | IAS 24 | ⏳ | ✅ `project-accounting` | ⏳ |
| PA-08 | Project profitability report | Management acctg | ⏳ | ✅ `project-accounting` | ✅ `Project` costing summary |
| PA-09 | Resource utilization tracking | ERPNext | ⏳ | ✅ `project-accounting` | ✅ `Timesheet` + `Activity Cost` |
| PA-10 | Grant accounting (IAS 20) | IAS 20 | ⏳ | ✅ `government-grants` | ⏳ |

### 16. Credit Management

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| CM-01 | Credit limit per customer | COSO | ⏳ | ✅ `credit-management` | ✅ `Customer Credit Limit` |
| CM-02 | Credit exposure (outstanding + open orders) | ERPNext | ⏳ | ✅ `credit-management` | ✅ credit limit check on SO/SI |
| CM-03 | Credit hold / release workflow | COSO | ⏳ | ✅ `credit-management` | 🔧 bypass with role permission |
| CM-04 | Credit review scheduling | AICPA | ⏳ | ✅ `credit-management` | ⏳ |
| CM-05 | Credit scoring model | Risk management | ⏳ | ✅ `credit-management` | ⏳ |
| CM-06 | Dunning (escalating letters) | ERPNext | ⏳ | ✅ `credit-management` | ✅ `Dunning` + `Dunning Type` |
| CM-07 | Bad debt write-off workflow | AICPA | ⏳ | ✅ `credit-management` | 🔧 manual JE |
| CM-08 | Insurance / guarantee tracking | Risk management | ⏳ | ✅ `credit-management` | ⏳ |
| CM-09 | Customer payment history analysis | ERPNext | ⏳ | ✅ `credit-management` | 🔧 `Customer Ledger Summary` report |
| CM-10 | ECL integration (credit score → IFRS 9) | IFRS 9 §5.5 | ⏳ | ✅ `credit-management` | ⏳ |

### 17. Bank Reconciliation

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| BR-01 | Bank statement import (OFX, MT940, camt.053) | ISO 20022 | ⏳ | ✅ `bank-reconciliation` | ✅ `Bank Statement Import` |
| BR-02 | Auto-matching (amount + date + reference) | ERPNext | ⏳ | ✅ `bank-reconciliation` | ✅ `Bank Reconciliation Tool` auto-match |
| BR-03 | Manual match for complex transactions | ERPNext | ⏳ | ✅ `bank-reconciliation` | ✅ `Bank Transaction` manual link |
| BR-04 | Auto-post confirmed matches to GL | ERPNext | ⏳ | ✅ `bank-reconciliation` | ✅ `Bank Transaction` → GL |
| BR-05 | Unmatched item investigation workflow | AICPA | ⏳ | ✅ `bank-reconciliation` | 🔧 `Bank Transaction` status filter |
| BR-06 | Outstanding checks / deposits-in-transit | AICPA | ⏳ | ✅ `bank-reconciliation` | ✅ `Bank Clearance` |
| BR-07 | Bank charges auto-recognition | ERPNext | ⏳ | ✅ `bank-reconciliation` | 🔧 `Bank Transaction Mapping` |
| BR-08 | Multi-currency reconciliation | ERPNext | ⏳ | ✅ `bank-reconciliation` | ✅ multi-currency `Bank Account` |
| BR-09 | Reconciliation sign-off with evidence | AICPA | ⏳ | ✅ `bank-reconciliation` | ⏳ |
| BR-10 | Intraday balance monitoring | Treasury | ⏳ | ✅ `bank-reconciliation` | ⏳ |

### 18. Expense Management

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| EM-01 | Expense claim submission with receipt | COSO | ⏳ | ✅ `expense-management` | 🔧 via `Journal Entry` (no dedicated doctype in core) |
| EM-02 | Multi-level approval routing | COSO | ⏳ | ✅ `expense-management` | 🔧 Frappe workflow (generic) |
| EM-03 | Per-diem rate tables | IRS/HMRC/LHDN | ⏳ | ✅ `expense-management` | ⏳ |
| EM-04 | Mileage rate calculation | IRS/HMRC | ⏳ | ✅ `expense-management` | ⏳ |
| EM-05 | Policy enforcement (category limits) | COSO | ⏳ | ✅ `expense-management` | ⏳ |
| EM-06 | Corporate card reconciliation | ERPNext | ⏳ | ✅ `expense-management` | ⏳ |
| EM-07 | Foreign currency reimbursement | IAS 21 | ⏳ | ✅ `expense-management` | ⏳ |
| EM-08 | Project / cost center coding | Cost accounting | ⏳ | ✅ `expense-management` | 🔧 dimension on JE |
| EM-09 | Reimbursement via AP run | ERPNext | ⏳ | ✅ `expense-management` | 🔧 `Payment Entry` (manual) |
| EM-10 | Tax reclaim on business expenses | Local tax law | ⏳ | ✅ `expense-management` | 🔧 input tax on `Purchase Invoice` |

### 19. Subscription & Recurring Billing

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| SB-01 | Subscription plan master | SaaS | ✅ `IRecurringTemplateRepo` | ✅ `subscription-billing` | ✅ `Subscription Plan` |
| SB-02 | Ratable revenue recognition | IFRS 15 §35(b) | ✅ `revenue-recognition.ts` straight-line | ✅ `subscription-billing` | 🔧 `Process Deferred Accounting` |
| SB-03 | Invoice generation on billing cycle | ERPNext | ✅ `processRecurringJournals` | ✅ `subscription-billing` | ✅ `Subscription` auto-invoice |
| SB-04 | Dunning for failed renewals | SaaS | ⏳ | ✅ `subscription-billing` | 🔧 `Dunning` (general, not subscription-specific) |
| SB-05 | Upgrade / downgrade proration | SaaS | ⏳ | ✅ `subscription-billing` | 🔧 plan change (no proration calc) |
| SB-06 | Usage-based billing metering | SaaS | ⏳ | ✅ `subscription-billing` | ⏳ |
| SB-07 | Contract modification (IFRS 15 §20) | IFRS 15 | ⏳ | ✅ `subscription-billing` | ⏳ |
| SB-08 | Churn tracking / MRR/ARR reporting | SaaS metrics | ⏳ | ✅ `subscription-billing` | ⏳ |
| SB-09 | Tax calculation on recurring invoices | Local tax law | ⏳ | ✅ `subscription-billing` | ✅ tax on `Sales Invoice` |
| SB-10 | Payment gateway integration | SaaS | ⏳ | ✅ `subscription-billing` | ✅ `Payment Gateway Account` + `Payment Request` |

### 20. Provisions & Contingencies (IAS 37)

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| PR-01 | Recognition criteria (probable + reliable estimate) | IAS 37 §14 | ⏳ | ✅ `provisions` | ⏳ |
| PR-02 | Best estimate (single amount or expected value) | IAS 37 §36 | ⏳ | ✅ `provisions` | ⏳ |
| PR-03 | Discount unwind (time value of money) | IAS 37 §45 | ⏳ | ✅ `provisions` | ⏳ |
| PR-04 | Provision utilisation (actual spend vs provision) | IAS 37 §61 | ⏳ | ✅ `provisions` | ⏳ |
| PR-05 | Provision reversal (no longer probable) | IAS 37 §59 | ⏳ | ✅ `provisions` | ⏳ |
| PR-06 | Contingent liability disclosure | IAS 37 §86 | ⏳ | ✅ `provisions` | ⏳ |
| PR-07 | Onerous contract provision | IAS 37 §66 | ⏳ | ✅ `provisions` | ⏳ |
| PR-08 | Restructuring provision | IAS 37 §72 | ⏳ | ✅ `provisions` | ⏳ |
| PR-09 | Environmental / decommissioning provision | IAS 37 §14 | ⏳ | ✅ `provisions` | ⏳ |
| PR-10 | Discount rate selection | IAS 37 §47 | ⏳ | ✅ `provisions` | ⏳ |

### 21. Intangible Assets (IAS 38)

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| IA-01 | Recognition criteria (identifiable, controlled) | IAS 38 §21 | ⏳ | ✅ `intangible-assets` | ⏳ |
| IA-02 | Research phase → expense always | IAS 38 §54 | ⏳ | ✅ `intangible-assets` | ⏳ |
| IA-03 | Development phase → capitalize if criteria met | IAS 38 §57 | ⏳ | ✅ `intangible-assets` | ⏳ |
| IA-04 | Amortization (finite vs indefinite life) | IAS 38 §88 | ⏳ | ✅ `intangible-assets` | ⏳ |
| IA-05 | Impairment test for indefinite-life | IAS 36 §10 | ⏳ | ✅ `intangible-assets` | ⏳ |
| IA-06 | Internally generated goodwill prohibited | IAS 38 §48 | ⏳ | ✅ `intangible-assets` | ⏳ |
| IA-07 | Software capitalization | IAS 38 §57 | ⏳ | ✅ `intangible-assets` | ⏳ |
| IA-08 | Customer lists acquired in combination | IFRS 3 | ⏳ | ✅ `intangible-assets` | ⏳ |
| IA-09 | Revaluation model (active market) | IAS 38 §75 | ⏳ | ✅ `intangible-assets` | ⏳ |
| IA-10 | Disclosure (gross carrying, accum amortization) | IAS 38 §118 | ⏳ | ✅ `intangible-assets` | ⏳ |

### 22. Financial Instruments (IFRS 9 / IAS 32 / IFRS 7)

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| FI-01 | Classification (AC / FVOCI / FVTPL) | IFRS 9 §4.1 | ⏳ | ✅ `financial-instruments` | ⏳ |
| FI-02 | Effective interest rate (EIR) method | IFRS 9 §B5.4.1 | ⏳ | ✅ `financial-instruments` | ⏳ |
| FI-03 | Fair value hierarchy (Level 1/2/3) | IFRS 13 §72 | ⏳ | ✅ `financial-instruments` | ⏳ |
| FI-04 | Fair value change routing (OCI vs P&L) | IFRS 9 §5.7 | ⏳ | ✅ `financial-instruments` | ⏳ |
| FI-05 | ECL model (12-month vs lifetime) | IFRS 9 §5.5 | ⏳ | ✅ `financial-instruments` | ⏳ |
| FI-06 | Derecognition (transfer of risks) | IFRS 9 §3.2 | ⏳ | ✅ `financial-instruments` | ⏳ |
| FI-07 | Derivatives (FVTPL default) | IFRS 9 §4.1.4 | ⏳ | ✅ `financial-instruments` | ⏳ |
| FI-08 | Compound instruments (liability + equity) | IAS 32 §28 | ⏳ | ✅ `financial-instruments` | ⏳ |
| FI-09 | IFRS 7 disclosures (credit/liquidity/market risk) | IFRS 7 §31 | ⏳ | ✅ `financial-instruments` | ⏳ |
| FI-10 | Offsetting (legal right + intention) | IAS 32 §42 | ⏳ | ✅ `financial-instruments` | ⏳ |

### 23. Hedge Accounting (IFRS 9 §6)

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| HA-01 | Hedge designation (instrument + item + type) | IFRS 9 §6.4.1 | ⏳ | ✅ `hedge-accounting` | ⏳ |
| HA-02 | Hedge types (fair value, cash flow, net investment) | IFRS 9 §6.5 | ⏳ | ✅ `hedge-accounting` | ⏳ |
| HA-03 | Effectiveness testing | IFRS 9 §6.4.1 | ⏳ | ✅ `hedge-accounting` | ⏳ |
| HA-04 | OCI reserve (effective portion of cash flow hedge) | IFRS 9 §6.5.11 | ⏳ | ✅ `hedge-accounting` | ⏳ |
| HA-05 | Ineffectiveness → P&L | IFRS 9 §6.5.11 | ⏳ | ✅ `hedge-accounting` | ⏳ |
| HA-06 | Discontinuation (failure or de-designation) | IFRS 9 §6.5.6 | ⏳ | ✅ `hedge-accounting` | ⏳ |
| HA-07 | Net investment hedge | IFRS 9 §6.5.13 | ⏳ | ✅ `hedge-accounting` | ⏳ |
| HA-08 | Rebalancing (adjust ratio) | IFRS 9 §6.5.8 | ⏳ | ✅ `hedge-accounting` | ⏳ |
| HA-09 | Basis adjustment (OCI → asset/liability) | IFRS 9 §6.5.15 | ⏳ | ✅ `hedge-accounting` | ⏳ |
| HA-10 | Disclosure (risk strategy, effectiveness) | IFRS 7 §22A | ⏳ | ✅ `hedge-accounting` | ⏳ |

### 24. Transfer Pricing (OECD Guidelines)

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| TP-01 | Arm's-length principle | OECD §1.6 | ✅ IC agreement with `markupPercent` | ✅ `transfer-pricing` | ⏳ |
| TP-02 | TP methods (CUP, resale price, cost-plus, TNMM) | OECD §2 | ⏳ | ✅ `transfer-pricing` | ⏳ |
| TP-03 | IC agreement master | OECD §1.52 | ⏳ | ✅ `transfer-pricing` | ⏳ |
| TP-04 | Price validation at transaction time | OECD §1.33 | ⏳ | ✅ `transfer-pricing` | ⏳ |
| TP-05 | TP documentation (master file + local file) | OECD BEPS 13 | ⏳ | ✅ `transfer-pricing` | ⏳ |
| TP-06 | Advance pricing agreement tracking | OECD §4.123 | ⏳ | ✅ `transfer-pricing` | ⏳ |
| TP-07 | TP adjustment (year-end true-up) | OECD §1.33 | ⏳ | ✅ `transfer-pricing` | ⏳ |
| TP-08 | Country-by-country reporting (CbCR) | OECD BEPS 13 | ⏳ | ✅ `transfer-pricing` | ⏳ |
| TP-09 | Thin capitalization limits | OECD BEPS 4 | ⏳ | ✅ `transfer-pricing` | ⏳ |
| TP-10 | Permanent establishment risk flag | OECD §5 | ⏳ | ✅ `transfer-pricing` | ⏳ |

### 25. Internal Controls (COSO / AICPA)

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| IC-01 | Segregation of duties (preparer ≠ approver ≠ poster) | COSO | ✅ `IAuthorizationPolicy` + `requireSoD()` | ✅ via `authz` | 🔧 Frappe role permissions |
| IC-02 | Authorization matrix (amount thresholds) | COSO | ✅ `requirePermission()` preHandler | ✅ via `authz` | 🔧 `Authorization Rule` doctype |
| IC-03 | Audit trail (immutable log) | AICPA AU-C §315 | ✅ `IJournalAuditRepo` + `IPeriodAuditRepo` | ✅ via audit events | ✅ Frappe `Version` log |
| IC-04 | Period-end lock (no posting to closed) | COSO | ✅ `postJournal` checks period status | ✅ `gl-platform` | ✅ `Accounting Period` |
| IC-05 | Reconciliation controls (sub-ledger = GL) | AICPA | ⏳ | ✅ via reconciliation services | ⏳ |
| IC-06 | Duplicate payment prevention (idempotency) | COSO | ✅ `IIdempotencyStore` claim-or-get | ✅ via idempotency | 🔧 `Purchase Invoice` duplicate check |
| IC-07 | Four-eyes principle on high-value | COSO | ✅ `requireSoD()` | ✅ via `authz` | 🔧 Frappe workflow approval |
| IC-08 | Exception reporting | COSO Monitoring | ⏳ | ✅ via event handlers | ⏳ |
| IC-09 | User access review (quarterly) | SOX §404 | ⏳ | ✅ via `authz` | ⏳ |
| IC-10 | Change management (versioned rules) | COSO IT Controls | ✅ `IClassificationRuleRepo` versioned | ✅ via versioned rules | ⏳ |

### 26. Data Architecture (AIS Requirements)

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| DA-01 | Integer minor units (no FLOAT for money) | Romney & Steinbart | ✅ `bigint` columns | ✅ `bigint` columns | ⏳ `Currency` field (float-backed) |
| DA-02 | Tenant isolation (org_id + RLS) | Multi-tenant AIS | ✅ `tenantId` + RLS + `withTenant()` | ✅ `tenantId` + RLS | ⏳ single-tenant (multi-company) |
| DA-03 | Optimistic concurrency (expectedVersion) | AIS best practice | ⏳ | ✅ via versioning | ⏳ |
| DA-04 | Soft delete (deleted_at, never hard DELETE) | Audit requirement | ✅ financial records immutable | ✅ soft delete | 🔧 Frappe `docstatus=2` (cancel, not delete) |
| DA-05 | Effective dating on rate/rule tables | IAS 8 | ✅ `effectiveDate`/`expiresAt` on FX rates | ✅ effective dating | 🔧 `Currency Exchange.date` |
| DA-06 | Idempotency keys on all writes | AIS best practice | ✅ `IIdempotencyStore` | ✅ idempotency keys | ⏳ |
| DA-07 | Append-only audit log | AICPA | ✅ audit tables, REVOKE UPDATE | ✅ append-only | ✅ Frappe `Version` (append-only) |
| DA-08 | Deterministic hash on derived entries | Audit replay | ✅ outbox events with correlation | ✅ hash-based | ⏳ |
| DA-09 | Partitioned tables for high-volume | PostgreSQL | ⏳ | ✅ partitioning strategy | ⏳ |
| DA-10 | Read replica routing for reporting | CQRS | ✅ Neon read replicas available | ✅ read replica | ⏳ |

### 27. Statutory Reporting & Disclosure

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| SR-01 | Balance sheet per IAS 1 §54 | IAS 1 | ✅ `getBalanceSheet` | ✅ `statutory-reporting` | ✅ `Balance Sheet` report |
| SR-02 | Income statement (by nature or function) | IAS 1 §99 | ✅ `getIncomeStatement` | ✅ `statutory-reporting` | ✅ `Profit and Loss Statement` |
| SR-03 | Statement of changes in equity | IAS 1 §106 | ⏳ | ✅ `statutory-reporting` | ⏳ |
| SR-04 | Cash flow statement (indirect) | IAS 7 §18 | ✅ `getCashFlow` | ✅ `statutory-reporting` | ✅ `Cash Flow` report |
| SR-05 | Notes (policies, estimates, judgements) | IAS 1 §112 | ⏳ | ✅ `statutory-reporting` | ⏳ |
| SR-06 | Segment reporting (IFRS 8) | IFRS 8 | ⏳ | ✅ `statutory-reporting` | ⏳ |
| SR-07 | Related party disclosures (IAS 24) | IAS 24 | ⏳ | ✅ `statutory-reporting` | ⏳ |
| SR-08 | Events after reporting period (IAS 10) | IAS 10 | ⏳ | ✅ `statutory-reporting` | ⏳ |
| SR-09 | Earnings per share (IAS 33) | IAS 33 | ⏳ | ✅ `statutory-reporting` | ⏳ |
| SR-10 | XBRL tagging for regulatory filing | SEC/MAS/Bursa | ⏳ | ✅ `statutory-reporting` | ⏳ |

### 28. Subledger Accounting Architecture (SAP SLA / Oracle SLA)

| # | Benchmark Item | Authority | S1 | S2 | S3 |
|---|---------------|-----------|----|----|-----|
| SLA-01 | Operational domains emit AccountingEvent | SAP SLA | 🔧 outbox events (not full SLA) | ✅ `accounting-hub` | 🔧 hooks emit GL entries |
| SLA-02 | Mapping rules (event → journal template) | SAP SLA | 🔧 `derivation-engine.ts` | ✅ `accounting-hub` | ⏳ |
| SLA-03 | Deterministic replay (same event → same journal) | Audit | ✅ idempotent posting | ✅ `accounting-hub` | ⏳ |
| SLA-04 | Multi-ledger derivation (1 event → N journals) | SAP SLA | ⏳ | ✅ `accounting-hub` | ⏳ |
| SLA-05 | Posting audit (hash + rule version + reason) | AICPA | ⏳ | ✅ `accounting-hub` | ⏳ |
| SLA-06 | Preview mode (derive without posting) | SAP SLA | ⏳ | ✅ `accounting-hub` | ⏳ |
| SLA-07 | Event store (immutable acct_events) | Event sourcing | ⏳ | ✅ `accounting-hub` | ⏳ |
| SLA-08 | Mapping version lifecycle (draft→published→deprecated) | SAP SLA | ⏳ | ✅ `accounting-hub` | ⏳ |
| SLA-09 | No direct GL write from operational packages | AFENDA invariant | ⏳ | ✅ `accounting-hub` | 🔧 hooks write GL directly |
| SLA-10 | Reconciliation (events count = entries count) | Audit | ⏳ | ✅ `accounting-hub` | ⏳ |

---

## ERPNext-Only Features (Outside 280-Item Benchmark)

Features present in ERPNext (S3/S4) that fall outside the AIS benchmark scope:

| Feature | ERPNext Doctype(s) | Category |
|---------|-------------------|----------|
| Point of Sale (POS) | `POS Invoice`, `POS Profile`, `POS Opening/Closing Entry` | Retail |
| Loyalty Programs | `Loyalty Program`, `Loyalty Point Entry` | CRM/Retail |
| Pricing Rules & Promotions | `Pricing Rule`, `Promotional Scheme`, `Coupon Code` | Sales |
| Supplier Scorecard | `Supplier Scorecard`, scoring criteria/variables | Procurement |
| Share Management | `Share Transfer`, `Share Balance`, `Shareholder` | Corporate |
| Shipping Rules | `Shipping Rule`, `Shipping Rule Condition` | Logistics |
| Landed Cost Voucher | `Landed Cost Voucher`, `Landed Cost Item` | Inventory |
| Quality Management | `Quality Inspection`, `Quality Goal`, `Quality Review` | QMS |
| Manufacturing (BOM, Work Order) | `BOM`, `Work Order`, `Job Card`, `Production Plan` | Manufacturing |
| Subcontracting | `Subcontracting Order`, `Subcontracting Receipt` | Manufacturing |
| Stock / Inventory | `Stock Entry`, `Stock Ledger Entry`, `Warehouse`, `Batch` | Inventory |
| CRM | `Lead`, `Opportunity`, `Campaign`, `Prospect` | Sales |
| Maintenance | `Maintenance Schedule`, `Maintenance Visit` | Operations |
| E-Invoicing (EDI) | `EDI` module | Compliance |

---

## Architecture Comparison

| Dimension | S1 (NEXUSCANON) | S2 (AFENDA-NEXUS) | S3 (ERPNext) | S4 (Extraction) |
|-----------|----------------|-------------------|-------------|-----------------|
| **Language** | TypeScript | TypeScript | Python | TypeScript |
| **Framework** | Fastify | — (library packages) | Frappe | Hono |
| **ORM** | Drizzle | Drizzle | Frappe ORM | Drizzle |
| **Database** | Neon PG17 | Neon PG17 | MariaDB/PG | Neon PG16 |
| **Multi-tenant** | RLS + `withTenant()` | RLS + `withTenant()` | Multi-company (single-tenant) | RLS (generated) |
| **Money type** | `bigint` (minor units) | `bigint` (minor units) | `Currency` (float-backed decimal) | `numeric` |
| **Architecture** | Hexagonal (ports/adapters) | DDD (calculators/commands/queries/services) | Doctype-centric (model-view-controller) | CRUD per entity |
| **Test approach** | Vitest (unit + integration) | Vitest (unit + integration) | pytest (unit + integration) | — |
| **CI gates** | arch-guard, ESLint, coverage | 6 CIG gates, arch-guard | GitHub Actions, Semgrep | — |
| **IFRS depth** | GL spine (IAS 1, 7, 21) | Full (IAS 1–41, IFRS 1–17) | Partial (IAS 16, 21, basic IFRS 15) | Same as S3 |

---

## Key Findings

1. **S2 (AFENDA-NEXUS)** is the gold-standard benchmark: 280/280 items across 28 categories with IFRS/GAAP/COSO authority citations. 37 domain packages, 1,921 tests.

2. **S1 (NEXUSCANON-AFENDA)** covers the GL spine deeply (70/280 ≈ 25%) with production-grade quality (RLS, idempotency, audit trail, integer money). Missing: AP/AR, Fixed Assets, Lease, Tax, most sub-ledgers.

3. **ERPNext (S3)** has broad operational coverage (~112/280 ≈ 40%) but lacks IFRS-specialist modules: no Lease Accounting (IFRS 16), no Hedge Accounting, no Financial Instruments classification (IFRS 9), no Provisions (IAS 37), no Intangible Assets (IAS 38), no Transfer Pricing, no Subledger Architecture. Uses float-backed money.

4. **S4 (Extraction)** is a mechanical TypeScript port of S3 — identical feature coverage, different tech stack (Drizzle/Hono/Zod). Useful as a TypeScript reference for ERPNext entity shapes.

5. **Biggest gaps in ERPNext** (0/10 categories): Lease Accounting, Provisions, Intangible Assets, Financial Instruments, Hedge Accounting, Transfer Pricing.

6. **S1's path to S2 parity** requires adding ~210 benchmark items across 21 categories — primarily sub-ledger modules (AP, AR, FA, Lease, Tax) and IFRS-specialist packages.
