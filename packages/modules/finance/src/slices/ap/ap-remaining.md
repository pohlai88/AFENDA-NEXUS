# AP Enterprise Spec vs. Actual Codebase — Gap Audit (Validated)

**Last validated**: 2026-02-27 **Typecheck**: `@afenda/db` `@afenda/finance`
`@afenda/api`

---

## Status: ALL 85 CAPABILITIES NOW V3+ — 0 GAPS REMAINING

Every gap identified in the original audit has been closed. All capabilities now
have a complete end-to-end production path: entity → Drizzle repo → DB table →
`ApDeps` (required) → `runtime.ts` wiring → registered route.

---

## Closed Gaps (migration 0022_ap_gap_close.sql)

| #       | Capability               | Fix Applied                                                                                                             | Commit   |
| ------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| **B2**  | Triage queue             | `INCOMPLETE` added to `ap_invoice_status` enum                                                                          | c79a9d2  |
| **B3**  | OCR pipeline             | `POST /ap/ocr/webhook` route added to `ap-capture-routes.ts`                                                            | df0a56a+ |
| **B6**  | Prepayment invoices      | `ap_prepayment` + `ap_prepayment_application` tables, `DrizzleApPrepaymentRepo`                                         | c79a9d2  |
| **B7**  | Attachments              | `DrizzleInvoiceAttachmentRepo` bridging to `document_attachment` + `document_link`                                      | df0a56a  |
| **C5**  | Tolerance rules          | `match_tolerance` table, `DrizzleMatchToleranceRepo`                                                                    | c79a9d2  |
| **F2**  | WHT line classification  | `wht_income_type` enum + column on `ap_invoice_line`                                                                    | c79a9d2  |
| **F4**  | WHT cert/exemption (AP)  | `DrizzleApWhtCertificateRepo` adapter mapping AP port → `wht_certificate` table; `EXEMPT`/`REVOKED` status values added | df0a56a+ |
| **K4**  | Tamper-resistant logging | `content_hash`/`previous_hash` on outbox, `DrizzleHashedOutboxStore`, `TamperResistantOutboxWriter` now default         | df0a56a  |
| **N8**  | Supplier document vault  | `supplier_document` table, `DrizzleSupplierDocumentRepo`                                                                | c79a9d2  |
| **N9**  | Supplier disputes        | `supplier_dispute` table, `DrizzleSupplierDisputeRepo`                                                                  | c79a9d2  |
| **N10** | Notification prefs       | `supplier_notification_pref` table, `DrizzleSupplierNotificationPrefRepo`                                               | c79a9d2  |
| **N11** | Compliance tracking      | `supplier_compliance_item` table, `DrizzleSupplierComplianceRepo`                                                       | c79a9d2  |

---

## Verified Scorecard

| Metric                           | Spec Claims  | Actual (validated) |
| -------------------------------- | ------------ | ------------------ |
| V3+ capabilities                 | 85/85 (100%) | **85/85 (100%)**   |
| Missing DB tables                | 0            | **0**              |
| Missing DB columns/enums         | 0            | **0**              |
| Missing Drizzle repos            | 0            | **0**              |
| Unwired in runtime               | 0            | **0**              |
| All `ApDeps` properties required | —            | (none optional)    |

---

## New Drizzle Repos Created

| Repo                                  | DB Table                                                  | Port Interface                  |
| ------------------------------------- | --------------------------------------------------------- | ------------------------------- |
| `DrizzleMatchToleranceRepo`           | `erp.match_tolerance`                                     | `IMatchToleranceRepo`           |
| `DrizzleApPrepaymentRepo`             | `erp.ap_prepayment` + `erp.ap_prepayment_application`     | `IApPrepaymentRepo`             |
| `DrizzleInvoiceAttachmentRepo`        | `erp.document_attachment` + `erp.document_link` (adapter) | `IInvoiceAttachmentRepo`        |
| `DrizzleApWhtCertificateRepo`         | `erp.wht_certificate` (adapter, maps supplierId↔payeeId)  | `IWhtCertificateRepo` (AP)      |
| `DrizzleSupplierDocumentRepo`         | `erp.supplier_document`                                   | `ISupplierDocumentRepo`         |
| `DrizzleSupplierDisputeRepo`          | `erp.supplier_dispute`                                    | `ISupplierDisputeRepo`          |
| `DrizzleSupplierNotificationPrefRepo` | `erp.supplier_notification_pref`                          | `ISupplierNotificationPrefRepo` |
| `DrizzleSupplierComplianceRepo`       | `erp.supplier_compliance_item`                            | `ISupplierComplianceRepo`       |
| `DrizzleHashedOutboxStore`            | `erp.outbox` (hash columns)                               | `IHashedOutboxStore`            |

---

## New DB Enums Added

`tolerance_scope`, `ap_prepayment_status`, `supplier_document_category`,
`dispute_status`, `dispute_category`, `compliance_item_type`, `wht_income_type`
**Modified**: `ap_invoice_status` (+`INCOMPLETE`), `wht_certificate_status`
(+`EXEMPT`, +`REVOKED`)

---

## New API Endpoint

- `POST /ap/ocr/webhook` — OCR provider webhook receiver (B3)
