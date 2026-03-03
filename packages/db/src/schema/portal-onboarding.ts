/**
 * Portal Onboarding Submission table (Phase 1.1.2 — CAP-ONB)
 *
 * Tracks multi-step wizard progress per supplier. One row per supplier.
 * Each wizard step saves a JSON draft; final submission transitions
 * the supplier's onboardingStatus from PROSPECT → PENDING_APPROVAL.
 *
 * All tables are tenant-scoped with RLS enabled.
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { pkId, tenantCol, timestamps } from './_common';
import { onboardingStepEnum, supplierOnboardingStatusEnum } from './_enums';
import { suppliers } from './erp';

// ─── erp.supplier_onboarding_submission (CAP-ONB) ──────────────────────────

/**
 * Tracks wizard progress per supplier. One row per supplier per onboarding
 * attempt. Stores JSON drafts for each step so suppliers can save & resume.
 *
 * completedSteps tracks which steps have been saved at least once.
 * currentStep is the last visited step.
 *
 * Step-specific draft payloads are stored as typed JSONB:
 *   - companyInfoDraft: { tradingName, registrationNumber, countryOfIncorporation, ... }
 *   - bankDetailsDraft: { bankName, accountName, accountNumber, iban, swiftBic, ... }
 *   - kycDocumentsDraft: { documentIds: string[] } (references supplier_legal_document)
 *   - taxRegistrationDraft: { taxId, vatNumber, taxRegime, ... }
 */
export const supplierOnboardingSubmissions = erpSchema
  .table(
    'supplier_onboarding_submission',
    {
      ...pkId(),
      ...tenantCol(),
      supplierId: uuid('supplier_id')
        .notNull()
        .references(() => suppliers.id, { onDelete: 'cascade' }),

      /** Current wizard step the supplier is on. */
      currentStep: onboardingStepEnum('current_step').notNull().default('company_info'),

      /** Steps that have been completed (saved at least once). */
      completedSteps: onboardingStepEnum('completed_steps')
        .array()
        .notNull()
        .default(sql`'{}'::onboarding_step[]`),

      /** Draft payloads per step — JSONB for flexibility. */
      companyInfoDraft: jsonb('company_info_draft').$type<Record<string, unknown>>(),
      bankDetailsDraft: jsonb('bank_details_draft').$type<Record<string, unknown>>(),
      kycDocumentsDraft: jsonb('kyc_documents_draft').$type<Record<string, unknown>>(),
      taxRegistrationDraft: jsonb('tax_registration_draft').$type<Record<string, unknown>>(),

      /** Whether the wizard has been fully submitted for review. */
      isSubmitted: boolean('is_submitted').notNull().default(false),
      submittedAt: timestamp('submitted_at', { withTimezone: true }),
      submittedBy: uuid('submitted_by'),

      /** Review outcome (set by buyer admin). */
      reviewedBy: uuid('reviewed_by'),
      reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
      rejectionReason: text('rejection_reason'),

      /** Proof chain hash for submit/approve/reject events. */
      proofChainHead: varchar('proof_chain_head', { length: 64 }),

      ...timestamps(),
    },
    (t) => [
      uniqueIndex('uq_onboarding_supplier').on(t.tenantId, t.supplierId),
      index('idx_onboarding_tenant').on(t.tenantId),
      index('idx_onboarding_submitted').on(t.tenantId, t.isSubmitted),
    ]
  )
  .enableRLS();
