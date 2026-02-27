import { relations } from 'drizzle-orm';
import {
  tenants,
  companies,
  users,
  userPreferences,
  systemConfig,
  adminUsers,
  adminActionLogs,
} from './platform';
import {
  accounts,
  counterparties,
  currencies,
  fiscalPeriods,
  fiscalYears,
  fxRates,
  glBalances,
  glJournalLines,
  glJournals,
  icAgreements,
  icTransactionLegs,
  icTransactions,
  icSettlements,
  icSettlementLines,
  ledgers,
  revenueContracts,
  recognitionMilestones,
  classificationRuleSets,
  classificationRules,
  paymentTermsTemplates,
  paymentTermsLines,
  recurringTemplates,
  budgetEntries,
  suppliers,
  supplierSites,
  supplierBankAccounts,
  supplierUsers,
  apInvoices,
  apHolds,
  apInvoiceLines,
  apPaymentRuns,
  apPaymentRunItems,
  arInvoices,
  arInvoiceLines,
  arPaymentAllocations,
  arAllocationItems,
  dunningRuns,
  dunningLetters,
  taxCodes,
  taxRates,
  taxReturnPeriods,
  whtCertificates,
  assets,
  depreciationSchedules,
  assetMovements,
  assetComponents,
  bankStatements,
  bankStatementLines,
  bankMatches,
  bankReconciliations,
  creditLimits,
  creditReviews,
  expenseClaims,
  expenseClaimLines,
  expensePolicies,
  projects,
  projectCostLines,
  projectBillings,
  leaseContracts,
  leaseSchedules,
  leaseModifications,
  provisions,
  provisionMovements,
  cashForecasts,
  covenants,
  icLoans,
  costCenters,
  costDrivers,
  costDriverValues,
  costAllocationRuns,
  costAllocationLines,
  groupEntities,
  ownershipRecords,
  goodwills,
  intangibleAssets,
  financialInstruments,
  hedgeRelationships,
  hedgeEffectivenessTests,
  deferredTaxItems,
  tpPolicies,
  tpBenchmarks,
  accountingEvents,
  mappingRules,
  mappingRuleVersions,
  fairValueMeasurements,
  ocrJobs,
  matchTolerances,
  apPrepayments,
  apPrepaymentApplications,
  supplierDocuments,
  supplierDisputes,
  supplierNotificationPrefs,
  supplierComplianceItems,
  supplierAccountGroupConfigs,
  supplierCompanyOverrides,
  supplierBlocks,
  supplierBlockHistory,
  supplierBlacklists,
  supplierTaxRegistrations,
  supplierLegalDocuments,
  supplierDocRequirements,
  supplierEvalTemplates,
  supplierEvalCriteria,
  supplierEvaluations,
  supplierEvalScores,
  supplierRiskIndicators,
  supplierDiversities,
  supplierContacts,
  supplierDuplicateSuspects,
} from './erp';
import { documentAttachments, documentLinks } from './erp-document';
import { approvalPolicies, approvalRequests, approvalSteps } from './erp-approval';
import { sodActionLog } from './erp-sod';
import { auditLogs } from './audit';
import { outbox } from './outbox-table';
import { idempotencyStore } from './idempotency-store';

// ─── Platform Relations ─────────────────────────────────────────────────────

export const tenantsRelations = relations(tenants, ({ many }) => ({
  companies: many(companies),
  users: many(users),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  tenant: one(tenants, { fields: [companies.tenantId], references: [tenants.id] }),
  baseCurrency: one(currencies, {
    fields: [companies.baseCurrencyId],
    references: [currencies.id],
  }),
  ledgers: many(ledgers),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
}));

// ─── ERP Relations ──────────────────────────────────────────────────────────

export const currenciesRelations = relations(currencies, ({ one }) => ({
  tenant: one(tenants, { fields: [currencies.tenantId], references: [tenants.id] }),
}));

export const fiscalYearsRelations = relations(fiscalYears, ({ one, many }) => ({
  tenant: one(tenants, { fields: [fiscalYears.tenantId], references: [tenants.id] }),
  periods: many(fiscalPeriods),
}));

export const fiscalPeriodsRelations = relations(fiscalPeriods, ({ one }) => ({
  tenant: one(tenants, { fields: [fiscalPeriods.tenantId], references: [tenants.id] }),
  fiscalYear: one(fiscalYears, {
    fields: [fiscalPeriods.fiscalYearId],
    references: [fiscalYears.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  tenant: one(tenants, { fields: [accounts.tenantId], references: [tenants.id] }),
  parent: one(accounts, { fields: [accounts.parentId], references: [accounts.id] }),
  journalLines: many(glJournalLines),
}));

export const ledgersRelations = relations(ledgers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [ledgers.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [ledgers.companyId], references: [companies.id] }),
  currency: one(currencies, { fields: [ledgers.currencyId], references: [currencies.id] }),
  journals: many(glJournals),
}));

export const glJournalsRelations = relations(glJournals, ({ one, many }) => ({
  tenant: one(tenants, { fields: [glJournals.tenantId], references: [tenants.id] }),
  ledger: one(ledgers, { fields: [glJournals.ledgerId], references: [ledgers.id] }),
  fiscalPeriod: one(fiscalPeriods, {
    fields: [glJournals.fiscalPeriodId],
    references: [fiscalPeriods.id],
  }),
  reversalOf: one(glJournals, { fields: [glJournals.reversalOfId], references: [glJournals.id] }),
  lines: many(glJournalLines),
}));

export const glJournalLinesRelations = relations(glJournalLines, ({ one }) => ({
  tenant: one(tenants, { fields: [glJournalLines.tenantId], references: [tenants.id] }),
  journal: one(glJournals, { fields: [glJournalLines.journalId], references: [glJournals.id] }),
  account: one(accounts, { fields: [glJournalLines.accountId], references: [accounts.id] }),
}));

export const glBalancesRelations = relations(glBalances, ({ one }) => ({
  tenant: one(tenants, { fields: [glBalances.tenantId], references: [tenants.id] }),
  ledger: one(ledgers, { fields: [glBalances.ledgerId], references: [ledgers.id] }),
  account: one(accounts, { fields: [glBalances.accountId], references: [accounts.id] }),
}));

export const counterpartiesRelations = relations(counterparties, ({ one }) => ({
  tenant: one(tenants, { fields: [counterparties.tenantId], references: [tenants.id] }),
}));

export const icAgreementsRelations = relations(icAgreements, ({ one, many }) => ({
  tenant: one(tenants, { fields: [icAgreements.tenantId], references: [tenants.id] }),
  sellerCompany: one(companies, {
    fields: [icAgreements.sellerCompanyId],
    references: [companies.id],
    relationName: 'icAgreementSeller',
  }),
  buyerCompany: one(companies, {
    fields: [icAgreements.buyerCompanyId],
    references: [companies.id],
    relationName: 'icAgreementBuyer',
  }),
  currency: one(currencies, { fields: [icAgreements.currencyId], references: [currencies.id] }),
  transactions: many(icTransactions),
}));

export const icTransactionsRelations = relations(icTransactions, ({ one, many }) => ({
  tenant: one(tenants, { fields: [icTransactions.tenantId], references: [tenants.id] }),
  agreement: one(icAgreements, {
    fields: [icTransactions.agreementId],
    references: [icAgreements.id],
  }),
  currency: one(currencies, { fields: [icTransactions.currencyId], references: [currencies.id] }),
  legs: many(icTransactionLegs),
}));

export const icTransactionLegsRelations = relations(icTransactionLegs, ({ one }) => ({
  tenant: one(tenants, { fields: [icTransactionLegs.tenantId], references: [tenants.id] }),
  transaction: one(icTransactions, {
    fields: [icTransactionLegs.transactionId],
    references: [icTransactions.id],
  }),
  company: one(companies, { fields: [icTransactionLegs.companyId], references: [companies.id] }),
  journal: one(glJournals, { fields: [icTransactionLegs.journalId], references: [glJournals.id] }),
}));

// ─── IC Settlement Relations ────────────────────────────────────────────────

export const icSettlementsRelations = relations(icSettlements, ({ one, many }) => ({
  tenant: one(tenants, { fields: [icSettlements.tenantId], references: [tenants.id] }),
  agreement: one(icAgreements, {
    fields: [icSettlements.agreementId],
    references: [icAgreements.id],
  }),
  currency: one(currencies, { fields: [icSettlements.currencyId], references: [currencies.id] }),
  lines: many(icSettlementLines),
}));

export const icSettlementLinesRelations = relations(icSettlementLines, ({ one }) => ({
  tenant: one(tenants, { fields: [icSettlementLines.tenantId], references: [tenants.id] }),
  settlement: one(icSettlements, {
    fields: [icSettlementLines.settlementId],
    references: [icSettlements.id],
  }),
  transaction: one(icTransactions, {
    fields: [icSettlementLines.transactionId],
    references: [icTransactions.id],
  }),
}));

// ─── Revenue Contract Relations ─────────────────────────────────────────────

export const revenueContractsRelations = relations(revenueContracts, ({ one, many }) => ({
  tenant: one(tenants, { fields: [revenueContracts.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [revenueContracts.companyId], references: [companies.id] }),
  currency: one(currencies, { fields: [revenueContracts.currencyId], references: [currencies.id] }),
  deferredAccount: one(accounts, {
    fields: [revenueContracts.deferredAccountId],
    references: [accounts.id],
    relationName: 'revenueContractDeferred',
  }),
  revenueAccount: one(accounts, {
    fields: [revenueContracts.revenueAccountId],
    references: [accounts.id],
    relationName: 'revenueContractRevenue',
  }),
  milestones: many(recognitionMilestones),
}));

export const recognitionMilestonesRelations = relations(recognitionMilestones, ({ one }) => ({
  tenant: one(tenants, { fields: [recognitionMilestones.tenantId], references: [tenants.id] }),
  contract: one(revenueContracts, {
    fields: [recognitionMilestones.contractId],
    references: [revenueContracts.id],
  }),
}));

// ─── Classification Rule Relations ──────────────────────────────────────────

export const classificationRuleSetsRelations = relations(
  classificationRuleSets,
  ({ one, many }) => ({
    tenant: one(tenants, { fields: [classificationRuleSets.tenantId], references: [tenants.id] }),
    rules: many(classificationRules),
  })
);

export const classificationRulesRelations = relations(classificationRules, ({ one }) => ({
  tenant: one(tenants, { fields: [classificationRules.tenantId], references: [tenants.id] }),
  ruleSet: one(classificationRuleSets, {
    fields: [classificationRules.ruleSetId],
    references: [classificationRuleSets.id],
  }),
}));

// ─── AP Relations ──────────────────────────────────────────────────────────

export const paymentTermsTemplatesRelations = relations(paymentTermsTemplates, ({ one }) => ({
  tenant: one(tenants, { fields: [paymentTermsTemplates.tenantId], references: [tenants.id] }),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [suppliers.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [suppliers.companyId], references: [companies.id] }),
  currency: one(currencies, { fields: [suppliers.currencyId], references: [currencies.id] }),
  defaultPaymentTerms: one(paymentTermsTemplates, {
    fields: [suppliers.defaultPaymentTermsId],
    references: [paymentTermsTemplates.id],
  }),
  parentSupplier: one(suppliers, {
    fields: [suppliers.parentSupplierId],
    references: [suppliers.id],
    relationName: 'parentChild',
  }),
  children: many(suppliers, { relationName: 'parentChild' }),
  sites: many(supplierSites),
  bankAccounts: many(supplierBankAccounts),
  users: many(supplierUsers),
  blocks: many(supplierBlocks),
  blacklists: many(supplierBlacklists),
  taxRegistrations: many(supplierTaxRegistrations),
  legalDocuments: many(supplierLegalDocuments),
  evaluations: many(supplierEvaluations),
  riskIndicators: many(supplierRiskIndicators),
  diversities: many(supplierDiversities),
  contacts: many(supplierContacts),
  companyOverrides: many(supplierCompanyOverrides),
}));

export const supplierUsersRelations = relations(supplierUsers, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierUsers.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, { fields: [supplierUsers.supplierId], references: [suppliers.id] }),
  user: one(users, { fields: [supplierUsers.userId], references: [users.id] }),
}));

export const supplierSitesRelations = relations(supplierSites, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierSites.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, { fields: [supplierSites.supplierId], references: [suppliers.id] }),
}));

export const supplierBankAccountsRelations = relations(supplierBankAccounts, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierBankAccounts.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, {
    fields: [supplierBankAccounts.supplierId],
    references: [suppliers.id],
  }),
  site: one(supplierSites, {
    fields: [supplierBankAccounts.siteId],
    references: [supplierSites.id],
  }),
  currency: one(currencies, {
    fields: [supplierBankAccounts.currencyId],
    references: [currencies.id],
  }),
}));

export const apInvoicesRelations = relations(apInvoices, ({ one, many }) => ({
  tenant: one(tenants, { fields: [apInvoices.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [apInvoices.companyId], references: [companies.id] }),
  ledger: one(ledgers, { fields: [apInvoices.ledgerId], references: [ledgers.id] }),
  currency: one(currencies, { fields: [apInvoices.currencyId], references: [currencies.id] }),
  journal: one(glJournals, { fields: [apInvoices.journalId], references: [glJournals.id] }),
  paymentTerms: one(paymentTermsTemplates, {
    fields: [apInvoices.paymentTermsId],
    references: [paymentTermsTemplates.id],
  }),
  lines: many(apInvoiceLines),
}));

export const apHoldsRelations = relations(apHolds, ({ one }) => ({
  tenant: one(tenants, { fields: [apHolds.tenantId], references: [tenants.id] }),
  invoice: one(apInvoices, { fields: [apHolds.invoiceId], references: [apInvoices.id] }),
}));

export const apInvoiceLinesRelations = relations(apInvoiceLines, ({ one }) => ({
  tenant: one(tenants, { fields: [apInvoiceLines.tenantId], references: [tenants.id] }),
  invoice: one(apInvoices, { fields: [apInvoiceLines.invoiceId], references: [apInvoices.id] }),
  account: one(accounts, { fields: [apInvoiceLines.accountId], references: [accounts.id] }),
}));

export const apPaymentRunsRelations = relations(apPaymentRuns, ({ one, many }) => ({
  tenant: one(tenants, { fields: [apPaymentRuns.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [apPaymentRuns.companyId], references: [companies.id] }),
  currency: one(currencies, { fields: [apPaymentRuns.currencyId], references: [currencies.id] }),
  items: many(apPaymentRunItems),
}));

export const apPaymentRunItemsRelations = relations(apPaymentRunItems, ({ one }) => ({
  tenant: one(tenants, { fields: [apPaymentRunItems.tenantId], references: [tenants.id] }),
  paymentRun: one(apPaymentRuns, {
    fields: [apPaymentRunItems.paymentRunId],
    references: [apPaymentRuns.id],
  }),
  invoice: one(apInvoices, { fields: [apPaymentRunItems.invoiceId], references: [apInvoices.id] }),
}));

// ─── AR Relations ──────────────────────────────────────────────────────────

export const arInvoicesRelations = relations(arInvoices, ({ one, many }) => ({
  tenant: one(tenants, { fields: [arInvoices.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [arInvoices.companyId], references: [companies.id] }),
  ledger: one(ledgers, { fields: [arInvoices.ledgerId], references: [ledgers.id] }),
  paymentTerms: one(paymentTermsTemplates, {
    fields: [arInvoices.paymentTermsId],
    references: [paymentTermsTemplates.id],
  }),
  journal: one(glJournals, { fields: [arInvoices.journalId], references: [glJournals.id] }),
  lines: many(arInvoiceLines),
}));

export const arInvoiceLinesRelations = relations(arInvoiceLines, ({ one }) => ({
  tenant: one(tenants, { fields: [arInvoiceLines.tenantId], references: [tenants.id] }),
  invoice: one(arInvoices, { fields: [arInvoiceLines.invoiceId], references: [arInvoices.id] }),
  account: one(accounts, { fields: [arInvoiceLines.accountId], references: [accounts.id] }),
}));

export const arPaymentAllocationsRelations = relations(arPaymentAllocations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [arPaymentAllocations.tenantId], references: [tenants.id] }),
  items: many(arAllocationItems),
}));

export const arAllocationItemsRelations = relations(arAllocationItems, ({ one }) => ({
  tenant: one(tenants, { fields: [arAllocationItems.tenantId], references: [tenants.id] }),
  paymentAllocation: one(arPaymentAllocations, {
    fields: [arAllocationItems.paymentAllocationId],
    references: [arPaymentAllocations.id],
  }),
  invoice: one(arInvoices, { fields: [arAllocationItems.invoiceId], references: [arInvoices.id] }),
}));

export const dunningRunsRelations = relations(dunningRuns, ({ one, many }) => ({
  tenant: one(tenants, { fields: [dunningRuns.tenantId], references: [tenants.id] }),
  letters: many(dunningLetters),
}));

export const dunningLettersRelations = relations(dunningLetters, ({ one }) => ({
  tenant: one(tenants, { fields: [dunningLetters.tenantId], references: [tenants.id] }),
  dunningRun: one(dunningRuns, {
    fields: [dunningLetters.dunningRunId],
    references: [dunningRuns.id],
  }),
}));

// ─── Document Relations ─────────────────────────────────────────────────────

export const documentAttachmentsRelations = relations(documentAttachments, ({ one, many }) => ({
  tenant: one(tenants, { fields: [documentAttachments.tenantId], references: [tenants.id] }),
  links: many(documentLinks),
}));

export const documentLinksRelations = relations(documentLinks, ({ one }) => ({
  document: one(documentAttachments, {
    fields: [documentLinks.documentId],
    references: [documentAttachments.documentId],
  }),
  tenant: one(tenants, { fields: [documentLinks.tenantId], references: [tenants.id] }),
}));

// ─── AP Gap-Close Relations ────────────────────────────────────────────────

export const matchTolerancesRelations = relations(matchTolerances, ({ one }) => ({
  tenant: one(tenants, { fields: [matchTolerances.tenantId], references: [tenants.id] }),
}));

export const apPrepaymentRelations = relations(apPrepayments, ({ one, many }) => ({
  tenant: one(tenants, { fields: [apPrepayments.tenantId], references: [tenants.id] }),
  invoice: one(apInvoices, { fields: [apPrepayments.invoiceId], references: [apInvoices.id] }),
  supplier: one(suppliers, { fields: [apPrepayments.supplierId], references: [suppliers.id] }),
  applications: many(apPrepaymentApplications),
}));

export const apPrepaymentApplicationRelations = relations(apPrepaymentApplications, ({ one }) => ({
  tenant: one(tenants, {
    fields: [apPrepaymentApplications.tenantId],
    references: [tenants.id],
  }),
  prepayment: one(apPrepayments, {
    fields: [apPrepaymentApplications.prepaymentId],
    references: [apPrepayments.id],
  }),
  targetInvoice: one(apInvoices, {
    fields: [apPrepaymentApplications.targetInvoiceId],
    references: [apInvoices.id],
  }),
}));

export const supplierDocumentsRelations = relations(supplierDocuments, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierDocuments.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, {
    fields: [supplierDocuments.supplierId],
    references: [suppliers.id],
  }),
}));

export const supplierDisputesRelations = relations(supplierDisputes, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierDisputes.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, {
    fields: [supplierDisputes.supplierId],
    references: [suppliers.id],
  }),
}));

export const supplierNotificationPrefsRelations = relations(
  supplierNotificationPrefs,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [supplierNotificationPrefs.tenantId],
      references: [tenants.id],
    }),
    supplier: one(suppliers, {
      fields: [supplierNotificationPrefs.supplierId],
      references: [suppliers.id],
    }),
  })
);

export const supplierComplianceItemsRelations = relations(supplierComplianceItems, ({ one }) => ({
  tenant: one(tenants, {
    fields: [supplierComplianceItems.tenantId],
    references: [tenants.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierComplianceItems.supplierId],
    references: [suppliers.id],
  }),
}));

// ─── Supplier MDM Relations ──────────────────────────────────────────────────

export const supplierAccountGroupConfigsRelations = relations(supplierAccountGroupConfigs, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierAccountGroupConfigs.tenantId], references: [tenants.id] }),
}));

export const supplierCompanyOverridesRelations = relations(supplierCompanyOverrides, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierCompanyOverrides.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, { fields: [supplierCompanyOverrides.supplierId], references: [suppliers.id] }),
  company: one(companies, { fields: [supplierCompanyOverrides.companyId], references: [companies.id] }),
}));

export const supplierBlocksRelations = relations(supplierBlocks, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierBlocks.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, { fields: [supplierBlocks.supplierId], references: [suppliers.id] }),
}));

export const supplierBlockHistoryRelations = relations(supplierBlockHistory, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierBlockHistory.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, { fields: [supplierBlockHistory.supplierId], references: [suppliers.id] }),
  block: one(supplierBlocks, { fields: [supplierBlockHistory.blockId], references: [supplierBlocks.id] }),
}));

export const supplierBlacklistsRelations = relations(supplierBlacklists, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierBlacklists.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, { fields: [supplierBlacklists.supplierId], references: [suppliers.id] }),
}));

export const supplierTaxRegistrationsRelations = relations(supplierTaxRegistrations, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierTaxRegistrations.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, { fields: [supplierTaxRegistrations.supplierId], references: [suppliers.id] }),
}));

export const supplierLegalDocumentsRelations = relations(supplierLegalDocuments, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierLegalDocuments.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, { fields: [supplierLegalDocuments.supplierId], references: [suppliers.id] }),
}));

export const supplierDocRequirementsRelations = relations(supplierDocRequirements, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierDocRequirements.tenantId], references: [tenants.id] }),
}));

export const supplierEvalTemplatesRelations = relations(supplierEvalTemplates, ({ one, many }) => ({
  tenant: one(tenants, { fields: [supplierEvalTemplates.tenantId], references: [tenants.id] }),
  criteria: many(supplierEvalCriteria),
}));

export const supplierEvalCriteriaRelations = relations(supplierEvalCriteria, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierEvalCriteria.tenantId], references: [tenants.id] }),
  template: one(supplierEvalTemplates, {
    fields: [supplierEvalCriteria.templateId],
    references: [supplierEvalTemplates.id],
  }),
}));

export const supplierEvaluationsRelations = relations(supplierEvaluations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [supplierEvaluations.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, { fields: [supplierEvaluations.supplierId], references: [suppliers.id] }),
  template: one(supplierEvalTemplates, {
    fields: [supplierEvaluations.templateVersionId],
    references: [supplierEvalTemplates.id],
  }),
  scores: many(supplierEvalScores),
}));

export const supplierEvalScoresRelations = relations(supplierEvalScores, ({ one }) => ({
  evaluation: one(supplierEvaluations, {
    fields: [supplierEvalScores.evaluationId],
    references: [supplierEvaluations.id],
  }),
  criteria: one(supplierEvalCriteria, {
    fields: [supplierEvalScores.criteriaId],
    references: [supplierEvalCriteria.id],
  }),
}));

export const supplierRiskIndicatorsRelations = relations(supplierRiskIndicators, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierRiskIndicators.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, { fields: [supplierRiskIndicators.supplierId], references: [suppliers.id] }),
}));

export const supplierDiversitiesRelations = relations(supplierDiversities, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierDiversities.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, { fields: [supplierDiversities.supplierId], references: [suppliers.id] }),
}));

export const supplierContactsRelations = relations(supplierContacts, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierContacts.tenantId], references: [tenants.id] }),
  supplier: one(suppliers, { fields: [supplierContacts.supplierId], references: [suppliers.id] }),
  site: one(supplierSites, { fields: [supplierContacts.siteId], references: [supplierSites.id] }),
}));

export const supplierDuplicateSuspectsRelations = relations(supplierDuplicateSuspects, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierDuplicateSuspects.tenantId], references: [tenants.id] }),
  supplierA: one(suppliers, {
    fields: [supplierDuplicateSuspects.supplierAId],
    references: [suppliers.id],
    relationName: 'duplicateA',
  }),
  supplierB: one(suppliers, {
    fields: [supplierDuplicateSuspects.supplierBId],
    references: [suppliers.id],
    relationName: 'duplicateB',
  }),
}));

// ─── Outbox Relations ───────────────────────────────────────────────────────

export const outboxRelations = relations(outbox, ({ one }) => ({
  tenant: one(tenants, { fields: [outbox.tenantId], references: [tenants.id] }),
}));

// ─── Platform — Missing Relations ──────────────────────────────────────────

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] }),
}));

export const systemConfigRelations = relations(systemConfig, ({ one }) => ({
  updatedByUser: one(users, { fields: [systemConfig.updatedBy], references: [users.id] }),
}));

export const adminUsersRelations = relations(adminUsers, ({ one }) => ({
  user: one(users, { fields: [adminUsers.userId], references: [users.id] }),
}));

export const adminActionLogsRelations = relations(adminActionLogs, ({ one }) => ({
  admin: one(adminUsers, { fields: [adminActionLogs.adminUserId], references: [adminUsers.userId] }),
  targetTenant: one(tenants, { fields: [adminActionLogs.targetTenantId], references: [tenants.id] }),
  targetUser: one(users, { fields: [adminActionLogs.targetUserId], references: [users.id] }),
}));

// ─── Audit — Missing Relations ─────────────────────────────────────────────

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [auditLogs.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

// ─── Approval — Missing Relations ──────────────────────────────────────────

export const approvalPoliciesRelations = relations(approvalPolicies, ({ one, many }) => ({
  tenant: one(tenants, { fields: [approvalPolicies.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [approvalPolicies.companyId], references: [companies.id] }),
  requests: many(approvalRequests),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ one, many }) => ({
  tenant: one(tenants, { fields: [approvalRequests.tenantId], references: [tenants.id] }),
  policy: one(approvalPolicies, {
    fields: [approvalRequests.policyId],
    references: [approvalPolicies.id],
  }),
  steps: many(approvalSteps),
}));

export const approvalStepsRelations = relations(approvalSteps, ({ one }) => ({
  tenant: one(tenants, { fields: [approvalSteps.tenantId], references: [tenants.id] }),
  request: one(approvalRequests, {
    fields: [approvalSteps.requestId],
    references: [approvalRequests.id],
  }),
}));

// ─── SoD — Missing Relations ───────────────────────────────────────────────

export const sodActionLogRelations = relations(sodActionLog, ({ one }) => ({
  tenant: one(tenants, { fields: [sodActionLog.tenantId], references: [tenants.id] }),
  actor: one(users, { fields: [sodActionLog.actorId], references: [users.id] }),
}));

// ─── Idempotency — Missing Relations ───────────────────────────────────────

export const idempotencyStoreRelations = relations(idempotencyStore, ({ one }) => ({
  tenant: one(tenants, { fields: [idempotencyStore.tenantId], references: [tenants.id] }),
}));

// ─── FX Rates — Missing Relations ──────────────────────────────────────────

export const fxRatesRelations = relations(fxRates, ({ one }) => ({
  tenant: one(tenants, { fields: [fxRates.tenantId], references: [tenants.id] }),
  fromCurrency: one(currencies, {
    fields: [fxRates.fromCurrencyId],
    references: [currencies.id],
    relationName: 'fxRateFrom',
  }),
  toCurrency: one(currencies, {
    fields: [fxRates.toCurrencyId],
    references: [currencies.id],
    relationName: 'fxRateTo',
  }),
}));

// ─── Recurring Templates — Missing Relations ───────────────────────────────

export const recurringTemplatesRelations = relations(recurringTemplates, ({ one }) => ({
  tenant: one(tenants, { fields: [recurringTemplates.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [recurringTemplates.companyId], references: [companies.id] }),
  ledger: one(ledgers, { fields: [recurringTemplates.ledgerId], references: [ledgers.id] }),
}));

// ─── Budget — Missing Relations ────────────────────────────────────────────

export const budgetEntriesRelations = relations(budgetEntries, ({ one }) => ({
  tenant: one(tenants, { fields: [budgetEntries.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [budgetEntries.companyId], references: [companies.id] }),
  ledger: one(ledgers, { fields: [budgetEntries.ledgerId], references: [ledgers.id] }),
  account: one(accounts, { fields: [budgetEntries.accountId], references: [accounts.id] }),
  period: one(fiscalPeriods, { fields: [budgetEntries.periodId], references: [fiscalPeriods.id] }),
}));

// ─── Payment Terms Lines — Missing Relations ───────────────────────────────

export const paymentTermsLinesRelations = relations(paymentTermsLines, ({ one }) => ({
  tenant: one(tenants, { fields: [paymentTermsLines.tenantId], references: [tenants.id] }),
  template: one(paymentTermsTemplates, {
    fields: [paymentTermsLines.templateId],
    references: [paymentTermsTemplates.id],
  }),
}));

// ─── Tax — Missing Relations ───────────────────────────────────────────────

export const taxCodesRelations = relations(taxCodes, ({ one, many }) => ({
  tenant: one(tenants, { fields: [taxCodes.tenantId], references: [tenants.id] }),
  parent: one(taxCodes, {
    fields: [taxCodes.parentId],
    references: [taxCodes.id],
    relationName: 'taxCodeParentChild',
  }),
  children: many(taxCodes, { relationName: 'taxCodeParentChild' }),
  rates: many(taxRates),
}));

export const taxRatesRelations = relations(taxRates, ({ one }) => ({
  tenant: one(tenants, { fields: [taxRates.tenantId], references: [tenants.id] }),
  taxCode: one(taxCodes, { fields: [taxRates.taxCodeId], references: [taxCodes.id] }),
}));

export const taxReturnPeriodsRelations = relations(taxReturnPeriods, ({ one }) => ({
  tenant: one(tenants, { fields: [taxReturnPeriods.tenantId], references: [tenants.id] }),
  filedByUser: one(users, { fields: [taxReturnPeriods.filedBy], references: [users.id] }),
}));

export const whtCertificatesRelations = relations(whtCertificates, ({ one }) => ({
  tenant: one(tenants, { fields: [whtCertificates.tenantId], references: [tenants.id] }),
}));

// ─── Fixed Assets — Missing Relations ──────────────────────────────────────

export const assetsRelations = relations(assets, ({ one, many }) => ({
  tenant: one(tenants, { fields: [assets.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [assets.companyId], references: [companies.id] }),
  costCenter: one(costCenters, { fields: [assets.costCenterId], references: [costCenters.id] }),
  glAccount: one(accounts, {
    fields: [assets.glAccountId],
    references: [accounts.id],
    relationName: 'assetGlAccount',
  }),
  depreciationAccount: one(accounts, {
    fields: [assets.depreciationAccountId],
    references: [accounts.id],
    relationName: 'assetDepreciationAccount',
  }),
  accumulatedDepreciationAccount: one(accounts, {
    fields: [assets.accumulatedDepreciationAccountId],
    references: [accounts.id],
    relationName: 'assetAccumDepreciationAccount',
  }),
  depreciationSchedules: many(depreciationSchedules),
  movements: many(assetMovements),
  components: many(assetComponents),
}));

export const depreciationSchedulesRelations = relations(depreciationSchedules, ({ one }) => ({
  tenant: one(tenants, { fields: [depreciationSchedules.tenantId], references: [tenants.id] }),
  asset: one(assets, { fields: [depreciationSchedules.assetId], references: [assets.id] }),
  component: one(assetComponents, {
    fields: [depreciationSchedules.componentId],
    references: [assetComponents.id],
  }),
  journal: one(glJournals, { fields: [depreciationSchedules.journalId], references: [glJournals.id] }),
}));

export const assetMovementsRelations = relations(assetMovements, ({ one }) => ({
  tenant: one(tenants, { fields: [assetMovements.tenantId], references: [tenants.id] }),
  asset: one(assets, { fields: [assetMovements.assetId], references: [assets.id] }),
  fromCompany: one(companies, {
    fields: [assetMovements.fromCompanyId],
    references: [companies.id],
    relationName: 'assetMovementFromCompany',
  }),
  toCompany: one(companies, {
    fields: [assetMovements.toCompanyId],
    references: [companies.id],
    relationName: 'assetMovementToCompany',
  }),
  journal: one(glJournals, { fields: [assetMovements.journalId], references: [glJournals.id] }),
}));

export const assetComponentsRelations = relations(assetComponents, ({ one, many }) => ({
  tenant: one(tenants, { fields: [assetComponents.tenantId], references: [tenants.id] }),
  asset: one(assets, { fields: [assetComponents.assetId], references: [assets.id] }),
  depreciationSchedules: many(depreciationSchedules),
}));

// ─── Bank Reconciliation — Missing Relations ───────────────────────────────

export const bankStatementsRelations = relations(bankStatements, ({ one, many }) => ({
  tenant: one(tenants, { fields: [bankStatements.tenantId], references: [tenants.id] }),
  lines: many(bankStatementLines),
}));

export const bankStatementLinesRelations = relations(bankStatementLines, ({ one }) => ({
  tenant: one(tenants, { fields: [bankStatementLines.tenantId], references: [tenants.id] }),
  statement: one(bankStatements, {
    fields: [bankStatementLines.statementId],
    references: [bankStatements.id],
  }),
  match: one(bankMatches, { fields: [bankStatementLines.matchId], references: [bankMatches.id] }),
}));

export const bankMatchesRelations = relations(bankMatches, ({ one }) => ({
  tenant: one(tenants, { fields: [bankMatches.tenantId], references: [tenants.id] }),
  statementLine: one(bankStatementLines, {
    fields: [bankMatches.statementLineId],
    references: [bankStatementLines.id],
  }),
  journal: one(glJournals, { fields: [bankMatches.journalId], references: [glJournals.id] }),
}));

export const bankReconciliationsRelations = relations(bankReconciliations, ({ one }) => ({
  tenant: one(tenants, { fields: [bankReconciliations.tenantId], references: [tenants.id] }),
}));

// ─── Credit Management — Missing Relations ─────────────────────────────────

export const creditLimitsRelations = relations(creditLimits, ({ one, many }) => ({
  tenant: one(tenants, { fields: [creditLimits.tenantId], references: [tenants.id] }),
  customer: one(counterparties, { fields: [creditLimits.customerId], references: [counterparties.id] }),
  company: one(companies, { fields: [creditLimits.companyId], references: [companies.id] }),
  reviews: many(creditReviews),
}));

export const creditReviewsRelations = relations(creditReviews, ({ one }) => ({
  tenant: one(tenants, { fields: [creditReviews.tenantId], references: [tenants.id] }),
  creditLimit: one(creditLimits, {
    fields: [creditReviews.creditLimitId],
    references: [creditLimits.id],
  }),
  customer: one(counterparties, { fields: [creditReviews.customerId], references: [counterparties.id] }),
}));

// ─── Expenses — Missing Relations ──────────────────────────────────────────

export const expenseClaimsRelations = relations(expenseClaims, ({ one, many }) => ({
  tenant: one(tenants, { fields: [expenseClaims.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [expenseClaims.companyId], references: [companies.id] }),
  employee: one(users, { fields: [expenseClaims.employeeId], references: [users.id] }),
  apInvoice: one(apInvoices, { fields: [expenseClaims.apInvoiceId], references: [apInvoices.id] }),
  lines: many(expenseClaimLines),
}));

export const expenseClaimLinesRelations = relations(expenseClaimLines, ({ one }) => ({
  tenant: one(tenants, { fields: [expenseClaimLines.tenantId], references: [tenants.id] }),
  claim: one(expenseClaims, { fields: [expenseClaimLines.claimId], references: [expenseClaims.id] }),
  glAccount: one(accounts, { fields: [expenseClaimLines.glAccountId], references: [accounts.id] }),
  costCenter: one(costCenters, { fields: [expenseClaimLines.costCenterId], references: [costCenters.id] }),
  project: one(projects, { fields: [expenseClaimLines.projectId], references: [projects.id] }),
}));

export const expensePoliciesRelations = relations(expensePolicies, ({ one }) => ({
  tenant: one(tenants, { fields: [expensePolicies.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [expensePolicies.companyId], references: [companies.id] }),
}));

// ─── Projects — Missing Relations ──────────────────────────────────────────

export const projectsRelations = relations(projects, ({ one, many }) => ({
  tenant: one(tenants, { fields: [projects.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [projects.companyId], references: [companies.id] }),
  customer: one(counterparties, { fields: [projects.customerId], references: [counterparties.id] }),
  manager: one(users, { fields: [projects.managerId], references: [users.id] }),
  costLines: many(projectCostLines),
  billings: many(projectBillings),
}));

export const projectCostLinesRelations = relations(projectCostLines, ({ one }) => ({
  tenant: one(tenants, { fields: [projectCostLines.tenantId], references: [tenants.id] }),
  project: one(projects, { fields: [projectCostLines.projectId], references: [projects.id] }),
  glAccount: one(accounts, { fields: [projectCostLines.glAccountId], references: [accounts.id] }),
  journal: one(glJournals, { fields: [projectCostLines.journalId], references: [glJournals.id] }),
  employee: one(users, { fields: [projectCostLines.employeeId], references: [users.id] }),
}));

export const projectBillingsRelations = relations(projectBillings, ({ one }) => ({
  tenant: one(tenants, { fields: [projectBillings.tenantId], references: [tenants.id] }),
  project: one(projects, { fields: [projectBillings.projectId], references: [projects.id] }),
  arInvoice: one(arInvoices, { fields: [projectBillings.arInvoiceId], references: [arInvoices.id] }),
}));

// ─── Lease Accounting — Missing Relations ──────────────────────────────────

export const leaseContractsRelations = relations(leaseContracts, ({ one, many }) => ({
  tenant: one(tenants, { fields: [leaseContracts.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [leaseContracts.companyId], references: [companies.id] }),
  counterparty: one(counterparties, {
    fields: [leaseContracts.counterpartyId],
    references: [counterparties.id],
  }),
  createdByUser: one(users, { fields: [leaseContracts.createdBy], references: [users.id] }),
  schedules: many(leaseSchedules),
  modifications: many(leaseModifications),
}));

export const leaseSchedulesRelations = relations(leaseSchedules, ({ one }) => ({
  tenant: one(tenants, { fields: [leaseSchedules.tenantId], references: [tenants.id] }),
  leaseContract: one(leaseContracts, {
    fields: [leaseSchedules.leaseContractId],
    references: [leaseContracts.id],
  }),
}));

export const leaseModificationsRelations = relations(leaseModifications, ({ one }) => ({
  tenant: one(tenants, { fields: [leaseModifications.tenantId], references: [tenants.id] }),
  leaseContract: one(leaseContracts, {
    fields: [leaseModifications.leaseContractId],
    references: [leaseContracts.id],
  }),
  modifiedByUser: one(users, { fields: [leaseModifications.modifiedBy], references: [users.id] }),
}));

// ─── Provisions — Missing Relations ────────────────────────────────────────

export const provisionsRelations = relations(provisions, ({ one, many }) => ({
  tenant: one(tenants, { fields: [provisions.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [provisions.companyId], references: [companies.id] }),
  glAccount: one(accounts, { fields: [provisions.glAccountId], references: [accounts.id] }),
  movements: many(provisionMovements),
}));

export const provisionMovementsRelations = relations(provisionMovements, ({ one }) => ({
  tenant: one(tenants, { fields: [provisionMovements.tenantId], references: [tenants.id] }),
  provision: one(provisions, {
    fields: [provisionMovements.provisionId],
    references: [provisions.id],
  }),
  journal: one(glJournals, { fields: [provisionMovements.journalId], references: [glJournals.id] }),
}));

// ─── Treasury / Cash Management — Missing Relations ────────────────────────

export const cashForecastsRelations = relations(cashForecasts, ({ one }) => ({
  tenant: one(tenants, { fields: [cashForecasts.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [cashForecasts.companyId], references: [companies.id] }),
}));

export const covenantsRelations = relations(covenants, ({ one }) => ({
  tenant: one(tenants, { fields: [covenants.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [covenants.companyId], references: [companies.id] }),
  lender: one(counterparties, { fields: [covenants.lenderId], references: [counterparties.id] }),
}));

export const icLoansRelations = relations(icLoans, ({ one }) => ({
  tenant: one(tenants, { fields: [icLoans.tenantId], references: [tenants.id] }),
  lenderCompany: one(companies, {
    fields: [icLoans.lenderCompanyId],
    references: [companies.id],
    relationName: 'icLoanLender',
  }),
  borrowerCompany: one(companies, {
    fields: [icLoans.borrowerCompanyId],
    references: [companies.id],
    relationName: 'icLoanBorrower',
  }),
  icAgreement: one(icAgreements, {
    fields: [icLoans.icAgreementId],
    references: [icAgreements.id],
  }),
}));

// ─── Cost Accounting — Missing Relations ───────────────────────────────────

export const costCentersRelations = relations(costCenters, ({ one, many }) => ({
  tenant: one(tenants, { fields: [costCenters.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [costCenters.companyId], references: [companies.id] }),
  parent: one(costCenters, {
    fields: [costCenters.parentId],
    references: [costCenters.id],
    relationName: 'costCenterParentChild',
  }),
  children: many(costCenters, { relationName: 'costCenterParentChild' }),
  manager: one(users, { fields: [costCenters.managerId], references: [users.id] }),
  driverValues: many(costDriverValues),
}));

export const costDriversRelations = relations(costDrivers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [costDrivers.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [costDrivers.companyId], references: [companies.id] }),
  values: many(costDriverValues),
}));

export const costDriverValuesRelations = relations(costDriverValues, ({ one }) => ({
  tenant: one(tenants, { fields: [costDriverValues.tenantId], references: [tenants.id] }),
  driver: one(costDrivers, { fields: [costDriverValues.driverId], references: [costDrivers.id] }),
  costCenter: one(costCenters, {
    fields: [costDriverValues.costCenterId],
    references: [costCenters.id],
  }),
  period: one(fiscalPeriods, { fields: [costDriverValues.periodId], references: [fiscalPeriods.id] }),
}));

export const costAllocationRunsRelations = relations(costAllocationRuns, ({ one, many }) => ({
  tenant: one(tenants, { fields: [costAllocationRuns.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [costAllocationRuns.companyId], references: [companies.id] }),
  period: one(fiscalPeriods, { fields: [costAllocationRuns.periodId], references: [fiscalPeriods.id] }),
  lines: many(costAllocationLines),
}));

export const costAllocationLinesRelations = relations(costAllocationLines, ({ one }) => ({
  tenant: one(tenants, { fields: [costAllocationLines.tenantId], references: [tenants.id] }),
  run: one(costAllocationRuns, {
    fields: [costAllocationLines.runId],
    references: [costAllocationRuns.id],
  }),
  fromCostCenter: one(costCenters, {
    fields: [costAllocationLines.fromCostCenterId],
    references: [costCenters.id],
    relationName: 'allocLineFromCC',
  }),
  toCostCenter: one(costCenters, {
    fields: [costAllocationLines.toCostCenterId],
    references: [costCenters.id],
    relationName: 'allocLineToCc',
  }),
  driver: one(costDrivers, { fields: [costAllocationLines.driverId], references: [costDrivers.id] }),
}));

// ─── Consolidation — Missing Relations ─────────────────────────────────────

export const groupEntitiesRelations = relations(groupEntities, ({ one, many }) => ({
  tenant: one(tenants, { fields: [groupEntities.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [groupEntities.companyId], references: [companies.id] }),
  parent: one(groupEntities, {
    fields: [groupEntities.parentEntityId],
    references: [groupEntities.id],
    relationName: 'groupEntityParentChild',
  }),
  children: many(groupEntities, { relationName: 'groupEntityParentChild' }),
  ownershipAsParent: many(ownershipRecords, { relationName: 'ownershipParent' }),
  ownershipAsChild: many(ownershipRecords, { relationName: 'ownershipChild' }),
}));

export const ownershipRecordsRelations = relations(ownershipRecords, ({ one }) => ({
  tenant: one(tenants, { fields: [ownershipRecords.tenantId], references: [tenants.id] }),
  parentEntity: one(groupEntities, {
    fields: [ownershipRecords.parentEntityId],
    references: [groupEntities.id],
    relationName: 'ownershipParent',
  }),
  childEntity: one(groupEntities, {
    fields: [ownershipRecords.childEntityId],
    references: [groupEntities.id],
    relationName: 'ownershipChild',
  }),
}));

export const goodwillsRelations = relations(goodwills, ({ one }) => ({
  tenant: one(tenants, { fields: [goodwills.tenantId], references: [tenants.id] }),
  ownershipRecord: one(ownershipRecords, {
    fields: [goodwills.ownershipRecordId],
    references: [ownershipRecords.id],
  }),
  childEntity: one(groupEntities, {
    fields: [goodwills.childEntityId],
    references: [groupEntities.id],
  }),
}));

// ─── IFRS Specialist — Missing Relations ───────────────────────────────────

export const intangibleAssetsRelations = relations(intangibleAssets, ({ one }) => ({
  tenant: one(tenants, { fields: [intangibleAssets.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [intangibleAssets.companyId], references: [companies.id] }),
  glAccount: one(accounts, {
    fields: [intangibleAssets.glAccountId],
    references: [accounts.id],
    relationName: 'intangibleGlAccount',
  }),
  amortizationAccount: one(accounts, {
    fields: [intangibleAssets.amortizationAccountId],
    references: [accounts.id],
    relationName: 'intangibleAmortAccount',
  }),
  accumulatedAmortizationAccount: one(accounts, {
    fields: [intangibleAssets.accumulatedAmortizationAccountId],
    references: [accounts.id],
    relationName: 'intangibleAccumAmortAccount',
  }),
}));

export const financialInstrumentsRelations = relations(financialInstruments, ({ one, many }) => ({
  tenant: one(tenants, { fields: [financialInstruments.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [financialInstruments.companyId], references: [companies.id] }),
  counterparty: one(counterparties, {
    fields: [financialInstruments.counterpartyId],
    references: [counterparties.id],
  }),
  glAccount: one(accounts, {
    fields: [financialInstruments.glAccountId],
    references: [accounts.id],
  }),
  hedgeRelationships: many(hedgeRelationships),
  fairValueMeasurements: many(fairValueMeasurements),
}));

export const hedgeRelationshipsRelations = relations(hedgeRelationships, ({ one, many }) => ({
  tenant: one(tenants, { fields: [hedgeRelationships.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [hedgeRelationships.companyId], references: [companies.id] }),
  hedgingInstrument: one(financialInstruments, {
    fields: [hedgeRelationships.hedgingInstrumentId],
    references: [financialInstruments.id],
  }),
  effectivenessTests: many(hedgeEffectivenessTests),
}));

export const hedgeEffectivenessTestsRelations = relations(hedgeEffectivenessTests, ({ one }) => ({
  tenant: one(tenants, { fields: [hedgeEffectivenessTests.tenantId], references: [tenants.id] }),
  hedgeRelationship: one(hedgeRelationships, {
    fields: [hedgeEffectivenessTests.hedgeRelationshipId],
    references: [hedgeRelationships.id],
  }),
  journal: one(glJournals, {
    fields: [hedgeEffectivenessTests.journalId],
    references: [glJournals.id],
  }),
}));

export const deferredTaxItemsRelations = relations(deferredTaxItems, ({ one }) => ({
  tenant: one(tenants, { fields: [deferredTaxItems.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [deferredTaxItems.companyId], references: [companies.id] }),
  period: one(fiscalPeriods, { fields: [deferredTaxItems.periodId], references: [fiscalPeriods.id] }),
}));

export const fairValueMeasurementsRelations = relations(fairValueMeasurements, ({ one }) => ({
  tenant: one(tenants, { fields: [fairValueMeasurements.tenantId], references: [tenants.id] }),
  instrument: one(financialInstruments, {
    fields: [fairValueMeasurements.instrumentId],
    references: [financialInstruments.id],
  }),
  journal: one(glJournals, {
    fields: [fairValueMeasurements.journalId],
    references: [glJournals.id],
  }),
}));

// ─── Transfer Pricing — Missing Relations ──────────────────────────────────

export const tpPoliciesRelations = relations(tpPolicies, ({ one, many }) => ({
  tenant: one(tenants, { fields: [tpPolicies.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [tpPolicies.companyId], references: [companies.id] }),
  benchmarks: many(tpBenchmarks),
}));

export const tpBenchmarksRelations = relations(tpBenchmarks, ({ one }) => ({
  tenant: one(tenants, { fields: [tpBenchmarks.tenantId], references: [tenants.id] }),
  policy: one(tpPolicies, { fields: [tpBenchmarks.policyId], references: [tpPolicies.id] }),
}));

// ─── Accounting Events — Missing Relations ─────────────────────────────────

export const accountingEventsRelations = relations(accountingEvents, ({ one }) => ({
  tenant: one(tenants, { fields: [accountingEvents.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [accountingEvents.companyId], references: [companies.id] }),
  journal: one(glJournals, { fields: [accountingEvents.journalId], references: [glJournals.id] }),
}));

// ─── Mapping Rules — Missing Relations ─────────────────────────────────────

export const mappingRulesRelations = relations(mappingRules, ({ one, many }) => ({
  tenant: one(tenants, { fields: [mappingRules.tenantId], references: [tenants.id] }),
  company: one(companies, { fields: [mappingRules.companyId], references: [companies.id] }),
  targetLedger: one(ledgers, { fields: [mappingRules.targetLedgerId], references: [ledgers.id] }),
  versions: many(mappingRuleVersions),
}));

export const mappingRuleVersionsRelations = relations(mappingRuleVersions, ({ one }) => ({
  tenant: one(tenants, { fields: [mappingRuleVersions.tenantId], references: [tenants.id] }),
  rule: one(mappingRules, { fields: [mappingRuleVersions.ruleId], references: [mappingRules.id] }),
  publishedByUser: one(users, { fields: [mappingRuleVersions.publishedBy], references: [users.id] }),
}));

// ─── OCR Jobs — Missing Relations ──────────────────────────────────────────

export const ocrJobsRelations = relations(ocrJobs, ({ one }) => ({
  tenant: one(tenants, { fields: [ocrJobs.tenantId], references: [tenants.id] }),
  invoice: one(apInvoices, { fields: [ocrJobs.invoiceId], references: [apInvoices.id] }),
}));
