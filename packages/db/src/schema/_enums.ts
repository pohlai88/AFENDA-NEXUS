import { pgEnum } from 'drizzle-orm/pg-core';

export const tenantStatusEnum = pgEnum('tenant_status', ['ACTIVE', 'SUSPENDED', 'DEACTIVATED']);

export const journalStatusEnum = pgEnum('journal_status', [
  'DRAFT',
  'PENDING_APPROVAL',
  'POSTED',
  'REVERSED',
  'VOIDED',
]);

export const accountTypeEnum = pgEnum('account_type', [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
]);

export const periodStatusEnum = pgEnum('period_status', ['OPEN', 'CLOSED', 'LOCKED']);

export const documentTypeEnum = pgEnum('document_type', [
  'JOURNAL',
  'INVOICE',
  'PAYMENT',
  'CREDIT_NOTE',
  'DEBIT_NOTE',
  'TRANSFER',
]);

export const icPricingEnum = pgEnum('ic_pricing', ['COST', 'MARKET', 'TRANSFER_PRICE', 'AGREED']);

export const icSettlementStatusEnum = pgEnum('ic_settlement_status', [
  'PENDING',
  'SETTLED',
  'CANCELLED',
]);

export const icLegSideEnum = pgEnum('ic_leg_side', ['SELLER', 'BUYER']);

export const counterpartyTypeEnum = pgEnum('counterparty_type', ['CUSTOMER', 'VENDOR', 'BOTH']);

export const recurringFrequencyEnum = pgEnum('recurring_frequency', [
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
]);

export const settlementMethodEnum = pgEnum('settlement_method', ['NETTING', 'CASH', 'JOURNAL']);

export const settlementStatusEnum = pgEnum('settlement_status', [
  'DRAFT',
  'CONFIRMED',
  'CANCELLED',
]);

export const recognitionMethodEnum = pgEnum('recognition_method', [
  'STRAIGHT_LINE',
  'MILESTONE',
  'PERCENTAGE_OF_COMPLETION',
]);

export const contractStatusEnum = pgEnum('contract_status', ['ACTIVE', 'COMPLETED', 'CANCELLED']);

export const reportingStandardEnum = pgEnum('reporting_standard', ['IFRS', 'US_GAAP', 'LOCAL']);

export const supplierStatusEnum = pgEnum('supplier_status', ['ACTIVE', 'ON_HOLD', 'INACTIVE']);

export const paymentMethodTypeEnum = pgEnum('payment_method_type', [
  'BANK_TRANSFER',
  'CHECK',
  'WIRE',
  'SEPA',
  'LOCAL_TRANSFER',
]);

export const apHoldTypeEnum = pgEnum('ap_hold_type', [
  'DUPLICATE',
  'MATCH_EXCEPTION',
  'VALIDATION',
  'SUPPLIER',
  'FX_RATE',
  'MANUAL',
]);

export const apHoldStatusEnum = pgEnum('ap_hold_status', ['ACTIVE', 'RELEASED']);

export const apInvoiceStatusEnum = pgEnum('ap_invoice_status', [
  'DRAFT',
  'INCOMPLETE',
  'PENDING_APPROVAL',
  'APPROVED',
  'POSTED',
  'PAID',
  'PARTIALLY_PAID',
  'CANCELLED',
]);

export const apInvoiceTypeEnum = pgEnum('ap_invoice_type', [
  'STANDARD',
  'DEBIT_MEMO',
  'CREDIT_MEMO',
  'PREPAYMENT',
]);

export const paymentRunStatusEnum = pgEnum('payment_run_status', [
  'DRAFT',
  'APPROVED',
  'EXECUTED',
  'CANCELLED',
]);

export const arInvoiceStatusEnum = pgEnum('ar_invoice_status', [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'POSTED',
  'PAID',
  'PARTIALLY_PAID',
  'WRITTEN_OFF',
  'CANCELLED',
]);

export const dunningRunStatusEnum = pgEnum('dunning_run_status', [
  'DRAFT',
  'APPROVED',
  'SENT',
  'CANCELLED',
]);

export const taxRateTypeEnum = pgEnum('tax_rate_type', [
  'VAT',
  'GST',
  'SALES_TAX',
  'WHT',
  'EXCISE',
  'CUSTOM',
]);

export const jurisdictionLevelEnum = pgEnum('jurisdiction_level', [
  'COUNTRY',
  'STATE',
  'CITY',
  'SPECIAL',
]);

export const taxReturnStatusEnum = pgEnum('tax_return_status', [
  'DRAFT',
  'CALCULATED',
  'FILED',
  'AMENDED',
]);

export const whtCertificateStatusEnum = pgEnum('wht_certificate_status', [
  'DRAFT',
  'ISSUED',
  'CANCELLED',
  'EXEMPT',
  'REVOKED',
]);

export const assetStatusEnum = pgEnum('asset_status', [
  'ACTIVE',
  'DISPOSED',
  'FULLY_DEPRECIATED',
  'IMPAIRED',
  'CWIP',
]);

export const depreciationMethodEnum = pgEnum('depreciation_method', [
  'STRAIGHT_LINE',
  'DECLINING_BALANCE',
  'UNITS_OF_PRODUCTION',
]);

export const assetMovementTypeEnum = pgEnum('asset_movement_type', [
  'ACQUISITION',
  'DEPRECIATION',
  'REVALUATION',
  'IMPAIRMENT',
  'DISPOSAL',
  'TRANSFER',
  'CAPITALIZATION',
]);

export const statementFormatEnum = pgEnum('statement_format', [
  'OFX',
  'MT940',
  'CAMT053',
  'CSV',
  'MANUAL',
]);

export const bankLineMatchStatusEnum = pgEnum('bank_line_match_status', [
  'UNMATCHED',
  'AUTO_MATCHED',
  'MANUAL_MATCHED',
  'CONFIRMED',
  'INVESTIGATING',
]);

export const bankMatchTypeEnum = pgEnum('bank_match_type', ['AUTO', 'MANUAL']);

export const bankMatchConfidenceEnum = pgEnum('bank_match_confidence', ['HIGH', 'MEDIUM', 'LOW']);

export const reconciliationStatusEnum = pgEnum('reconciliation_status', [
  'IN_PROGRESS',
  'COMPLETED',
  'SIGNED_OFF',
]);

export const creditStatusEnum = pgEnum('credit_status', [
  'ACTIVE',
  'ON_HOLD',
  'SUSPENDED',
  'CLOSED',
]);

export const reviewOutcomeEnum = pgEnum('review_outcome', [
  'APPROVED',
  'REDUCED',
  'SUSPENDED',
  'UNCHANGED',
]);

export const expenseClaimStatusEnum = pgEnum('expense_claim_status', [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'REIMBURSED',
  'CANCELLED',
]);

export const expenseCategoryEnum = pgEnum('expense_category', [
  'TRAVEL',
  'MEALS',
  'ACCOMMODATION',
  'TRANSPORT',
  'SUPPLIES',
  'COMMUNICATION',
  'ENTERTAINMENT',
  'OTHER',
]);

export const projectStatusEnum = pgEnum('project_status', [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
]);

export const billingTypeEnum = pgEnum('billing_type', [
  'FIXED_FEE',
  'TIME_AND_MATERIALS',
  'MILESTONE',
  'COST_PLUS',
]);

export const costCategoryEnum = pgEnum('cost_category', [
  'LABOR',
  'MATERIALS',
  'SUBCONTRACT',
  'TRAVEL',
  'EQUIPMENT',
  'OVERHEAD',
  'OTHER',
]);

export const billingStatusEnum = pgEnum('billing_status', ['DRAFT', 'INVOICED', 'PAID']);

// ─── Phase 4: Lease enums ─────────────────────────────────────────────────

export const leaseTypeEnum = pgEnum('lease_type', ['FINANCE', 'OPERATING']);

export const leaseStatusEnum = pgEnum('lease_status', [
  'DRAFT',
  'ACTIVE',
  'MODIFIED',
  'TERMINATED',
  'EXPIRED',
]);

export const lesseeOrLessorEnum = pgEnum('lessee_or_lessor', ['LESSEE', 'LESSOR']);

export const leaseModificationTypeEnum = pgEnum('lease_modification_type', [
  'TERM_EXTENSION',
  'TERM_REDUCTION',
  'PAYMENT_CHANGE',
  'SCOPE_CHANGE',
  'RATE_CHANGE',
]);

// ─── Phase 4: Provision enums ─────────────────────────────────────────────

export const provisionTypeEnum = pgEnum('provision_type', [
  'WARRANTY',
  'RESTRUCTURING',
  'ONEROUS_CONTRACT',
  'DECOMMISSIONING',
  'LEGAL',
  'OTHER',
]);

export const provisionStatusEnum = pgEnum('provision_status', [
  'ACTIVE',
  'PARTIALLY_UTILISED',
  'FULLY_UTILISED',
  'REVERSED',
]);

export const provisionMovementTypeEnum = pgEnum('provision_movement_type', [
  'INITIAL_RECOGNITION',
  'UNWINDING_DISCOUNT',
  'UTILISATION',
  'REVERSAL',
  'REMEASUREMENT',
]);

// ─── Phase 4: Treasury enums ──────────────────────────────────────────────

export const forecastTypeEnum = pgEnum('forecast_type', [
  'RECEIPTS',
  'PAYMENTS',
  'FINANCING',
  'INVESTING',
]);

export const covenantTypeEnum = pgEnum('covenant_type', [
  'DEBT_TO_EQUITY',
  'INTEREST_COVERAGE',
  'CURRENT_RATIO',
  'DEBT_SERVICE_COVERAGE',
  'LEVERAGE',
  'CUSTOM',
]);

export const covenantStatusEnum = pgEnum('covenant_status', ['COMPLIANT', 'WARNING', 'BREACHED']);

export const icLoanStatusEnum = pgEnum('ic_loan_status', ['ACTIVE', 'REPAID', 'WRITTEN_OFF']);

// ─── Phase 5: Cost Accounting enums ───────────────────────────────────────

export const costCenterStatusEnum = pgEnum('cost_center_status', ['ACTIVE', 'INACTIVE', 'CLOSED']);

export const driverTypeEnum = pgEnum('driver_type', [
  'HEADCOUNT',
  'MACHINE_HOURS',
  'DIRECT_LABOR',
  'FLOOR_AREA',
  'REVENUE',
  'UNITS_PRODUCED',
  'CUSTOM',
]);

export const allocationMethodEnum = pgEnum('allocation_method', [
  'DIRECT',
  'STEP_DOWN',
  'RECIPROCAL',
]);

export const allocationRunStatusEnum = pgEnum('allocation_run_status', [
  'DRAFT',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'REVERSED',
]);

// ─── Phase 6: Consolidation enums ────────────────────────────────────────

export const groupEntityTypeEnum = pgEnum('group_entity_type', [
  'PARENT',
  'SUBSIDIARY',
  'ASSOCIATE',
  'JOINT_VENTURE',
]);

export const goodwillStatusEnum = pgEnum('goodwill_status', ['ACTIVE', 'IMPAIRED', 'DERECOGNIZED']);

// ─── Phase 7: IFRS Specialist enums ──────────────────────────────────────

export const intangibleAssetStatusEnum = pgEnum('intangible_asset_status', [
  'ACTIVE',
  'DISPOSED',
  'FULLY_AMORTIZED',
  'IMPAIRED',
  'IN_DEVELOPMENT',
]);

export const intangibleCategoryEnum = pgEnum('intangible_category', [
  'SOFTWARE',
  'PATENT',
  'TRADEMARK',
  'COPYRIGHT',
  'LICENCE',
  'CUSTOMER_RELATIONSHIP',
  'GOODWILL_RELATED',
  'DEVELOPMENT_COST',
  'OTHER',
]);

export const usefulLifeTypeEnum = pgEnum('useful_life_type', ['FINITE', 'INDEFINITE']);

export const instrumentClassificationEnum = pgEnum('instrument_classification', [
  'AMORTIZED_COST',
  'FVOCI',
  'FVTPL',
]);

export const instrumentTypeEnum = pgEnum('instrument_type', [
  'DEBT_HELD',
  'DEBT_ISSUED',
  'EQUITY_INVESTMENT',
  'DERIVATIVE',
  'LOAN_RECEIVABLE',
  'TRADE_RECEIVABLE',
]);

export const fairValueLevelEnum = pgEnum('fair_value_level', ['LEVEL_1', 'LEVEL_2', 'LEVEL_3']);

export const hedgeTypeEnum = pgEnum('hedge_type', ['FAIR_VALUE', 'CASH_FLOW', 'NET_INVESTMENT']);

export const hedgeStatusEnum = pgEnum('hedge_status', [
  'DESIGNATED',
  'ACTIVE',
  'DISCONTINUED',
  'REBALANCED',
]);

// ─── Gap remediation enums ─────────────────────────────────────────────────

export const accountingEventStatusEnum = pgEnum('accounting_event_status', [
  'PENDING',
  'PROCESSED',
  'FAILED',
  'SKIPPED',
]);

export const mappingRuleStatusEnum = pgEnum('mapping_rule_status', [
  'DRAFT',
  'PUBLISHED',
  'DEPRECATED',
]);

export const hedgeTestMethodEnum = pgEnum('hedge_test_method', [
  'DOLLAR_OFFSET',
  'REGRESSION',
  'CRITICAL_TERMS',
]);

export const hedgeTestResultEnum = pgEnum('hedge_test_result', [
  'HIGHLY_EFFECTIVE',
  'EFFECTIVE',
  'INEFFECTIVE',
]);

export const tpMethodEnum = pgEnum('tp_method', [
  'CUP',
  'RESALE_PRICE',
  'COST_PLUS',
  'TNMM',
  'PROFIT_SPLIT',
]);

// ─── Document storage (R2 integration) ───────────────────────────────────────

export const documentStatusEnum = pgEnum('document_status', [
  'PENDING_UPLOAD',
  'STORED',
  'DELETED',
]);

export const integrityStatusEnum = pgEnum('integrity_status', ['PENDING', 'VERIFIED', 'FAILED']);

export const scanStatusEnum = pgEnum('scan_status', ['NOT_SCANNED', 'CLEAN', 'SUSPECT', 'FAILED']);

export const linkedEntityTypeEnum = pgEnum('linked_entity_type', [
  'JOURNAL',
  'AP_INVOICE',
  'AR_INVOICE',
  'FIXED_ASSET',
  'LEASE_CONTRACT',
  'EXPENSE_CLAIM',
  'BANK_RECONCILIATION',
  'TAX_RETURN',
  'PROVISION',
  'IC_TRANSACTION',
  'SUPPLIER',
  'SUPPLIER_CONTRACT',
  'SUPPLIER_STATEMENT',
]);

export const documentCategoryEnum = pgEnum('document_category', [
  'INVOICE',
  'RECEIPT',
  'CONTRACT',
  'BANK_STATEMENT',
  'BOARD_MINUTES',
  'TAX_NOTICE',
  'VALUATION_REPORT',
  'LEGAL_OPINION',
  'INSURANCE_POLICY',
  'CORRESPONDENCE',
  'OTHER',
]);

// ─── AP Gap-close enums ──────────────────────────────────────────────────

export const toleranceScopeEnum = pgEnum('tolerance_scope', ['ORG', 'COMPANY', 'SITE']);

export const apPrepaymentStatusEnum = pgEnum('ap_prepayment_status', [
  'OPEN',
  'PARTIALLY_APPLIED',
  'FULLY_APPLIED',
  'CANCELLED',
]);

export const supplierDocumentCategoryEnum = pgEnum('supplier_document_category', [
  'CONTRACT',
  'TAX_NOTICE',
  'INSURANCE_POLICY',
  'CORRESPONDENCE',
  'OTHER',
]);

export const disputeStatusEnum = pgEnum('dispute_status', [
  'OPEN',
  'IN_REVIEW',
  'RESOLVED',
  'REJECTED',
]);

export const disputeCategoryEnum = pgEnum('dispute_category', [
  'INCORRECT_AMOUNT',
  'MISSING_PAYMENT',
  'DUPLICATE_CHARGE',
  'PRICING_DISCREPANCY',
  'DELIVERY_ISSUE',
  'QUALITY_ISSUE',
  'OTHER',
]);

export const complianceItemTypeEnum = pgEnum('compliance_item_type', [
  'KYC',
  'TAX_CLEARANCE',
  'INSURANCE',
  'BANK_VERIFICATION',
  'TRADE_LICENSE',
]);

/** Alert thresholds for compliance expiry monitoring (Phase 1.1.3 CAP-COMPL). */
export const complianceAlertTypeEnum = pgEnum('compliance_alert_type', [
  'EXPIRING_30D',
  'EXPIRING_14D',
  'EXPIRING_7D',
  'EXPIRED',
]);

export const whtIncomeTypeEnum = pgEnum('wht_income_type', [
  'ROYALTIES',
  'INTEREST',
  'DIVIDENDS',
  'TECHNICAL_FEES',
  'MANAGEMENT_FEES',
  'CONTRACT_PAYMENTS',
  'RENTAL_INCOME',
  'COMMISSION',
  'OTHER',
]);

// ─── OCR Pipeline enums ──────────────────────────────────────────────────

export const ocrJobStatusEnum = pgEnum('ocr_job_status', [
  'CLAIMED',
  'UPLOADED',
  'EXTRACTING',
  'SCORED',
  'INVOICE_CREATING',
  'COMPLETED',
  'FAILED',
]);

export const ocrFailureReasonEnum = pgEnum('ocr_failure_reason', [
  'PROVIDER_TIMEOUT',
  'PROVIDER_REJECTED',
  'UNSUPPORTED_MIME',
  'PARSE_ERROR',
  'INTERNAL_ERROR',
]);

export const ocrConfidenceLevelEnum = pgEnum('ocr_confidence_level', ['HIGH', 'MEDIUM', 'LOW']);

// ─── Supplier MDM enums ──────────────────────────────────────────────────

export const supplierOnboardingStatusEnum = pgEnum('supplier_onboarding_status', [
  'PROSPECT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
]);

/** Wizard steps for supplier onboarding (Phase 1.1.2 CAP-ONB). */
export const onboardingStepEnum = pgEnum('onboarding_step', [
  'company_info',
  'bank_details',
  'kyc_documents',
  'tax_registration',
  'review',
]);

export const supplierAccountGroupEnum = pgEnum('supplier_account_group', [
  'TRADE',
  'INTERCOMPANY',
  'ONE_TIME',
  'EMPLOYEE',
  'GOVERNMENT',
  'SUBCONTRACTOR',
]);

export const supplierCategoryEnum = pgEnum('supplier_category', [
  'GOODS',
  'SERVICES',
  'SUBCONTRACTOR',
  'ONE_TIME',
  'INTERCOMPANY',
  'GOVERNMENT',
  'EMPLOYEE',
]);

export const supplierBlockTypeEnum = pgEnum('supplier_block_type', [
  'PURCHASING_BLOCK',
  'POSTING_BLOCK',
  'PAYMENT_BLOCK',
  'FULL_BLOCK',
]);

export const supplierBlockScopeEnum = pgEnum('supplier_block_scope', [
  'ALL_COMPANIES',
  'SPECIFIC_COMPANY',
  'SPECIFIC_SITE',
]);

export const supplierBlockActionEnum = pgEnum('supplier_block_action', ['BLOCKED', 'UNBLOCKED']);

export const supplierTaxTypeEnum = pgEnum('supplier_tax_type', [
  'VAT',
  'GST',
  'SST',
  'TIN',
  'CIT',
  'WHT',
  'CUSTOM',
]);

export const supplierLegalDocTypeEnum = pgEnum('supplier_legal_doc_type', [
  'REGISTRATION_CERTIFICATE',
  'TAX_REGISTRATION',
  'ARTICLES_OF_INCORPORATION',
  'POWER_OF_ATTORNEY',
  'BANK_CONFIRMATION_LETTER',
  'INSURANCE_CERTIFICATE',
  'TRADE_LICENSE',
  'GOOD_STANDING_CERTIFICATE',
  'BENEFICIAL_OWNERSHIP',
  'OTHER',
]);

export const supplierLegalDocStatusEnum = pgEnum('supplier_legal_doc_status', [
  'PENDING',
  'VERIFIED',
  'EXPIRED',
  'REJECTED',
]);

export const supplierEvalStatusEnum = pgEnum('supplier_eval_status', [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
]);

export const supplierRiskRatingEnum = pgEnum('supplier_risk_rating', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export const supplierRiskCategoryEnum = pgEnum('supplier_risk_category', [
  'FINANCIAL',
  'QUALITY',
  'COMPLIANCE',
  'FRAUD',
  'DELIVERY',
  'OTHER',
]);

export const supplierDiversityCodeEnum = pgEnum('supplier_diversity_code', [
  'SMALL_BUSINESS',
  'MINORITY_OWNED',
  'WOMEN_OWNED',
  'VETERAN_OWNED',
  'DISABLED_OWNED',
  'INDIGENOUS_OWNED',
  'LARGE_ENTERPRISE',
  'NONE',
]);

export const supplierContactRoleEnum = pgEnum('supplier_contact_role', [
  'AP_CONTACT',
  'SALES_REP',
  'COMPLIANCE_OFFICER',
  'LOGISTICS',
  'EXECUTIVE',
  'OTHER',
]);

export const supplierDuplicateMatchTypeEnum = pgEnum('supplier_duplicate_match_type', [
  'NAME_MATCH',
  'TAX_ID_MATCH',
  'REG_NO_MATCH',
  'COMBINED',
]);

export const supplierDuplicateStatusEnum = pgEnum('supplier_duplicate_status', [
  'OPEN',
  'CONFIRMED_DUPLICATE',
  'DISMISSED',
  'MERGED',
]);

// ─── Portal Case Management enums (Phase 1.1 — SP-4001) ─────────────────

export const caseStatusEnum = pgEnum('case_status', [
  'DRAFT',
  'SUBMITTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_INFO',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
]);

export const caseCategoryEnum = pgEnum('case_category', [
  'PAYMENT',
  'INVOICE',
  'COMPLIANCE',
  'DELIVERY',
  'QUALITY',
  'ONBOARDING',
  'GENERAL',
  'ESCALATION',
]);

export const casePriorityEnum = pgEnum('case_priority', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const caseTimelineEntryTypeEnum = pgEnum('case_timeline_entry_type', [
  'status',
  'message',
  'attachment',
  'escalation',
  'sla_breach',
  'payment',
  'match',
  'system',
]);

/** Entity types that can be linked to a case (separate from document linkedEntityType). */
export const caseLinkedEntityTypeEnum = pgEnum('case_linked_entity_type', [
  'INVOICE',
  'PAYMENT',
  'DOCUMENT',
  'COMPLIANCE',
  'PO',
]);

/** Actor types in portal context — who performed the action. */
export const portalActorTypeEnum = pgEnum('portal_actor_type', ['SUPPLIER', 'BUYER', 'SYSTEM']);

/** Proof chain event types — every auditable portal action. */
export const proofEventTypeEnum = pgEnum('proof_event_type', [
  'MESSAGE_SENT',
  'MESSAGE_READ',
  'CASE_CREATED',
  'CASE_STATUS_CHANGED',
  'CASE_ASSIGNED',
  'CASE_RESOLVED',
  'CASE_REOPENED',
  'ESCALATION_TRIGGERED',
  'ESCALATION_RESOLVED',
  'DOCUMENT_UPLOADED',
  'DOCUMENT_SHARED',
  'DOCUMENT_SIGNED',
  'BANK_ACCOUNT_PROPOSED',
  'BANK_ACCOUNT_APPROVED',
  'BANK_ACCOUNT_REJECTED',
  'PAYMENT_STATUS_CHANGED',
  'INVOICE_SUBMITTED',
  'INVOICE_STATUS_CHANGED',
  'COMPLIANCE_UPLOADED',
  'COMPLIANCE_VERIFIED',
  'COMPLIANCE_RENEWED',
  'ONBOARDING_SUBMITTED',
  'ONBOARDING_APPROVED',
  'ONBOARDING_REJECTED',
  'DAILY_ANCHOR',
]);

// ─── Portal Location & Directory Enums (Phase 1.1.5-1.1.6) ─────────────────

export const locationTypeEnum = pgEnum('location_type', [
  'HQ',
  'WAREHOUSE',
  'BILLING',
  'SHIPPING',
  'BRANCH',
]);

export const departmentEnum = pgEnum('department', [
  'ACCOUNTS_PAYABLE',
  'PROCUREMENT',
  'COMPLIANCE',
  'FINANCE_MANAGEMENT',
  'EXECUTIVE',
  'OPERATIONS',
  'LEGAL',
]);

/** Invitation status for supplier portal invitations (Phase 1.1.7 CAP-INV). */
export const invitationStatusEnum = pgEnum('invitation_status', [
  'PENDING', // Sent, awaiting acceptance
  'ACCEPTED', // Supplier clicked link and started onboarding
  'EXPIRED', // Token expired (default: 7 days)
  'REVOKED', // Buyer cancelled invitation
]);

/** Message sender type for portal messaging (Phase 1.2.1 CAP-MSG). */
export const senderTypeEnum = pgEnum('sender_type', ['SUPPLIER', 'BUYER']);

/** Escalation status for CAP-SOS breakglass workflow (Phase 1.2.2 P19). */
export const escalationStatusEnum = pgEnum('escalation_status', [
  'ESCALATION_REQUESTED', // Supplier triggered SOS; awaiting assignment
  'ESCALATION_ASSIGNED', // Buyer has assigned an escalation contact
  'ESCALATION_IN_PROGRESS', // Contact is actively working the escalation
  'ESCALATION_RESOLVED', // Issue resolved; proof chain entry created
]);

/** Announcement severity for CAP-ANNOUNCE dashboard banners (Phase 1.2.3 P24). */
export const announcementSeverityEnum = pgEnum('announcement_severity', [
  'INFO', // General information, blue banner
  'WARNING', // Attention required, amber banner
  'CRITICAL', // Urgent action required, red banner
]);

/** Meeting request status lifecycle for CAP-APPT (Phase 1.2.6 P27). */
export const meetingRequestStatusEnum = pgEnum('meeting_request_status', [
  'REQUESTED', // Supplier submitted proposed times; awaiting buyer confirmation
  'CONFIRMED', // Buyer accepted one of the proposed slots
  'COMPLETED', // Meeting has taken place
  'CANCELLED', // Cancelled by either party
]);

/** Meeting type for CAP-APPT. */
export const meetingTypeEnum = pgEnum('meeting_type', [
  'VIRTUAL', // Video / phone call
  'IN_PERSON', // Physical meeting at buyer or supplier site
]);

// ─── CAP-PAY-ETA (P2): Payment Status Fact ──────────────────────────────────

/**
 * Payment stage enum for SP-3005 supplier_payment_status_fact table.
 * State machine: SCHEDULED → APPROVED → PROCESSING → SENT → CLEARED
 * Hold/Rejected are terminal side-states (see SP-4002 payment-stage-machine.ts).
 */
export const paymentStageEnum = pgEnum('payment_stage', [
  'SCHEDULED', // Included in upcoming payment run
  'APPROVED', // Approved for payment — financial controls passed
  'PROCESSING', // Submitted to bank / in transit
  'SENT', // Confirmed sent by bank
  'CLEARED', // Bank confirms cleared in recipient account (terminal)
  'ON_HOLD', // Suspended — hold_reason indicates why
  'REJECTED', // Rejected by bank or internal controls (terminal)
]);

/**
 * Source of the payment stage update. Higher precedence overrides lower.
 * Precedence: BANK_FILE > ERP > MANUAL_OVERRIDE.
 */
export const paymentSourceEnum = pgEnum('payment_source', [
  'BANK_FILE', // Parsed bank statement or MT file — highest precedence
  'ERP', // Payment run scheduled by ERP system
  'MANUAL_OVERRIDE', // AP clerk override — lowest precedence
]);

/**
 * Hold reason taxonomy (internal codes).
 * Supplier sees supplier_visible_label from Status Dictionary (SP-1003).
 * Gate SP-8025 asserts raw hold reasons never reach supplier-facing UI.
 */
export const holdReasonEnum = pgEnum('hold_reason', [
  'APPROVAL_PENDING', // Supplier sees: "Awaiting internal approval"
  'COMPLIANCE_EXPIRED', // Supplier sees: "Compliance document expired"
  'MISMATCH_3WAY', // Supplier sees: "Invoice under review"
  'BANK_REJECTED', // Supplier sees: "Bank processing issue"
  'TAX_VALIDATION_FAILED', // Supplier sees: "Tax registration issue"
  'PAYMENT_RUN_NOT_SCHEDULED', // Supplier sees: "Not yet scheduled for payment"
  'MANUAL_HOLD', // Supplier sees: "Under review"
  'FRAUD_SUSPICION', // Supplier sees: "Verification pending" — NEVER expose internally
]);
