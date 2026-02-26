import { relations } from 'drizzle-orm';
import { tenants, companies, users } from './platform';
import {
  accounts,
  counterparties,
  currencies,
  fiscalPeriods,
  fiscalYears,
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
  apInvoices,
  apInvoiceLines,
  apPaymentRuns,
  apPaymentRunItems,
  arInvoices,
  arInvoiceLines,
  arPaymentAllocations,
  arAllocationItems,
  dunningRuns,
  dunningLetters,
} from './erp';
import { documentAttachments, documentLinks } from './erp-document';
import { outbox } from './outbox-table';

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

// ─── Outbox Relations ───────────────────────────────────────────────────────

export const outboxRelations = relations(outbox, ({ one }) => ({
  tenant: one(tenants, { fields: [outbox.tenantId], references: [tenants.id] }),
}));
