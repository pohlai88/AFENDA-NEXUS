/**
 * Shared mock factories for finance unit tests.
 * All repos are mocked via ports — no DB needed.
 */
import { ok, err, NotFoundError, money, companyId, ledgerId, dateRange } from "@afenda/core";
import type { PaginationParams, PaginatedResult } from "@afenda/core";

// Fixed UUIDs for deterministic tests
export const IDS = {
  journal: "00000000-0000-4000-8000-000000000001",
  account1: "00000000-0000-4000-8000-000000000010",
  account2: "00000000-0000-4000-8000-000000000011",
  period: "00000000-0000-4000-8000-000000000020",
  company: "00000000-0000-4000-8000-000000000030",
  company2: "00000000-0000-4000-8000-000000000031",
  ledger: "00000000-0000-4000-8000-000000000040",
  ledger2: "00000000-0000-4000-8000-000000000041",
  agreement: "00000000-0000-4000-8000-000000000099",
  icDoc: "00000000-0000-4000-8000-0000000000a1",
} as const;
import type { Result } from "@afenda/core";
import type { Journal, JournalLine, Account, FiscalPeriod, TrialBalance, JournalAuditEntry } from "../domain/index.js";
import type { IJournalRepo, CreateJournalInput } from "../slices/gl/ports/journal-repo.js";
import type { IAccountRepo } from "../slices/gl/ports/account-repo.js";
import type { IFiscalPeriodRepo } from "../slices/gl/ports/fiscal-period-repo.js";
import type { IGlBalanceRepo, BalanceUpsertLine } from "../slices/gl/ports/gl-balance-repo.js";
import type { IIdempotencyStore, IdempotencyClaimInput } from "../shared/ports/idempotency-store.js";
import type { IOutboxWriter, OutboxEvent } from "../shared/ports/outbox-writer.js";
import type { IJournalAuditRepo, AuditLogInput } from "../slices/gl/ports/journal-audit-repo.js";
import type { IFxRateRepo } from "../slices/fx/ports/fx-rate-repo.js";
import type { ILedgerRepo } from "../slices/gl/ports/ledger-repo.js";
import type { IIcAgreementRepo, IIcTransactionRepo, CreateIcDocumentInput } from "../slices/ic/ports/ic-repo.js";
import type { FxRate, Ledger, IntercompanyRelationship, IntercompanyDocument, RecurringTemplate, BudgetEntry } from "../domain/index.js";
import type { IRecurringTemplateRepo, CreateRecurringTemplateInput } from "../slices/hub/ports/recurring-template-repo.js";
import type { IBudgetRepo, UpsertBudgetEntryInput } from "../slices/hub/ports/budget-repo.js";
import type { IDocumentNumberGenerator } from "../slices/gl/ports/document-number-generator.js";
import type { IPeriodAuditRepo } from "../slices/gl/ports/period-audit-repo.js";
import type { IIcSettlementRepo } from "../slices/ic/ports/ic-settlement-repo.js";
import type { IClassificationRuleRepo } from "../slices/hub/ports/classification-rule-repo.js";
import type { IFxRateApprovalRepo } from "../slices/fx/ports/fx-rate-approval-repo.js";
import type { IRevenueContractRepo } from "../slices/hub/ports/revenue-contract-repo.js";

// ─── Domain Factories ───────────────────────────────────────────────────────

export function makeLine(overrides: Partial<JournalLine> = {}): JournalLine {
  return {
    accountId: IDS.account1,
    accountCode: "1000",
    debit: money(10000n, "USD"),
    credit: money(0n, "USD"),
    ...overrides,
  };
}

export function makeJournal(overrides: Partial<Journal> = {}): Journal {
  return {
    id: IDS.journal,
    companyId: companyId(IDS.company),
    ledgerId: ledgerId(IDS.ledger),
    fiscalPeriodId: IDS.period,
    description: "Test journal",
    date: new Date("2025-06-15"),
    status: "DRAFT",
    lines: [
      makeLine({ accountId: IDS.account1, debit: money(10000n, "USD"), credit: money(0n, "USD") }),
      makeLine({ accountId: IDS.account2, accountCode: "2000", debit: money(0n, "USD"), credit: money(10000n, "USD") }),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: IDS.account1,
    companyId: companyId(IDS.company),
    code: "1000",
    name: "Cash",
    type: "ASSET",
    normalBalance: "DEBIT",
    parentId: null,
    isActive: true,
    ...overrides,
  };
}

export function makePeriod(overrides: Partial<FiscalPeriod> = {}): FiscalPeriod {
  return {
    id: IDS.period,
    companyId: companyId(IDS.company),
    name: "2025-P06",
    range: dateRange(new Date("2025-06-01"), new Date("2025-06-30")),
    status: "OPEN",
    ...overrides,
  };
}

// ─── Mock Repos ─────────────────────────────────────────────────────────────

export function mockJournalRepo(journals: Map<string, Journal> = new Map()): IJournalRepo & { journals: Map<string, Journal> } {
  return {
    journals,
    async findById(id: string): Promise<Result<Journal>> {
      const j = journals.get(id);
      return j ? ok(j) : err(new NotFoundError("Journal", id));
    },
    async save(journal: Journal): Promise<Result<Journal>> {
      journals.set(journal.id, journal);
      return ok(journal);
    },
    async create(input: CreateJournalInput): Promise<Result<Journal>> {
      const j = makeJournal({
        id: `j-${Date.now()}`,
        ledgerId: ledgerId(input.ledgerId),
        fiscalPeriodId: input.fiscalPeriodId,
        description: input.description,
        date: input.postingDate,
        status: "DRAFT",
        lines: input.lines.map((l, i) => makeLine({
          accountId: l.accountId,
          accountCode: `${1000 + i}`,
          debit: money(l.debit, "USD"),
          credit: money(l.credit, "USD"),
          description: l.description,
        })),
      });
      journals.set(j.id, j);
      return ok(j);
    },
    async findByPeriod(periodId: string, status?: string, pagination?: PaginationParams): Promise<Result<PaginatedResult<Journal>>> {
      const all = [...journals.values()].filter(
        (j) => j.fiscalPeriodId === periodId && (!status || j.status === status),
      );
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 20;
      const offset = (page - 1) * limit;
      return ok({ data: all.slice(offset, offset + limit), total: all.length, page, limit });
    },
  };
}

export function mockAccountRepo(accounts: Account[] = [makeAccount()]): IAccountRepo {
  return {
    async findByCode(_companyId: string, code: string): Promise<Result<Account>> {
      const a = accounts.find((acc) => acc.code === code);
      return a ? ok(a) : err(new NotFoundError("Account", code));
    },
    async findById(id: string): Promise<Result<Account>> {
      const a = accounts.find((acc) => acc.id === id);
      return a ? ok(a) : err(new NotFoundError("Account", id));
    },
    async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<Account>>> {
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 20;
      const offset = (page - 1) * limit;
      return ok({ data: accounts.slice(offset, offset + limit), total: accounts.length, page, limit });
    },
  };
}

export function mockPeriodRepo(periods: FiscalPeriod[] = [makePeriod()]): IFiscalPeriodRepo {
  return {
    async findById(id: string): Promise<Result<FiscalPeriod>> {
      const p = periods.find((per) => per.id === id);
      return p ? ok(p) : err(new NotFoundError("FiscalPeriod", id));
    },
    async findOpenByDate(_companyId: string, date: Date): Promise<Result<FiscalPeriod>> {
      const p = periods.find(
        (per) => per.status === "OPEN" && date >= per.range.from && date <= per.range.to,
      );
      return p ? ok(p) : err(new NotFoundError("FiscalPeriod", `open for ${date.toISOString()}`));
    },
    async close(id: string): Promise<Result<FiscalPeriod>> {
      const p = periods.find((per) => per.id === id);
      if (!p) return err(new NotFoundError("FiscalPeriod", id));
      const closed = { ...p, status: "CLOSED" as const };
      return ok(closed);
    },
    async reopen(id: string): Promise<Result<FiscalPeriod>> {
      const p = periods.find((per) => per.id === id);
      if (!p) return err(new NotFoundError("FiscalPeriod", id));
      const reopened = { ...p, status: "OPEN" as const };
      return ok(reopened);
    },
    async lock(id: string): Promise<Result<FiscalPeriod>> {
      const p = periods.find((per) => per.id === id);
      if (!p) return err(new NotFoundError("FiscalPeriod", id));
      const locked = { ...p, status: "LOCKED" as const };
      return ok(locked);
    },
    async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<FiscalPeriod>>> {
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 20;
      const offset = (page - 1) * limit;
      return ok({ data: periods.slice(offset, offset + limit), total: periods.length, page, limit });
    },
    async findByIds(ids: readonly string[]): Promise<Result<FiscalPeriod[]>> {
      return ok(periods.filter((p) => ids.includes(p.id)));
    },
    async findByLedger(_ledgerId: string, pagination?: PaginationParams): Promise<Result<PaginatedResult<FiscalPeriod>>> {
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 20;
      const offset = (page - 1) * limit;
      return ok({ data: periods.slice(offset, offset + limit), total: periods.length, page, limit });
    },
  };
}

export function mockBalanceRepo(): IGlBalanceRepo & { upserts: unknown[] } {
  const upserts: unknown[] = [];
  return {
    upserts,
    async getTrialBalance(): Promise<Result<TrialBalance>> {
      return ok({
        companyId: companyId(IDS.company),
        ledgerId: ledgerId(IDS.ledger),
        periodId: "2025-P06",
        rows: [],
        totalDebits: money(0n, "USD"),
        totalCredits: money(0n, "USD"),
        isBalanced: true,
      });
    },
    async upsertForJournal(input: {
      tenantId: string;
      ledgerId: string;
      fiscalYear: string;
      fiscalPeriod: number;
      lines: readonly BalanceUpsertLine[];
    }): Promise<void> {
      upserts.push(input);
    },
  };
}

export function mockIdempotencyStore(alreadyClaimed = new Set<string>()): IIdempotencyStore {
  return {
    async claimOrGet(input: IdempotencyClaimInput) {
      const key = `${input.tenantId}:${input.key}:${input.commandType}`;
      if (alreadyClaimed.has(key)) {
        return { claimed: false as const, resultRef: "existing" };
      }
      alreadyClaimed.add(key);
      return { claimed: true as const };
    },
  };
}

export function mockOutboxWriter(): IOutboxWriter & { events: OutboxEvent[] } {
  const events: OutboxEvent[] = [];
  return {
    events,
    async write(event: OutboxEvent): Promise<void> {
      events.push(event);
    },
  };
}

export function makeLedger(overrides: Partial<Ledger> = {}): Ledger {
  return {
    id: IDS.ledger,
    companyId: companyId(IDS.company),
    name: "General Ledger",
    baseCurrency: "USD",
    fiscalYearStart: 1,
    isDefault: true,
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function mockLedgerRepo(
  items: Ledger[] = [makeLedger()],
): ILedgerRepo {
  return {
    async findById(id: string): Promise<Result<Ledger>> {
      const l = items.find((led) => led.id === id);
      if (!l) return err(new NotFoundError("Ledger", id));
      return ok(l);
    },
    async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<Ledger>>> {
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 20;
      const offset = (page - 1) * limit;
      return ok({
        data: items.slice(offset, offset + limit),
        total: items.length,
        page,
        limit,
      });
    },
  };
}

export function makeIcAgreement(overrides: Partial<IntercompanyRelationship> = {}): IntercompanyRelationship {
  return {
    id: IDS.agreement,
    tenantId: "t1" as never,
    sellerCompanyId: companyId(IDS.company),
    buyerCompanyId: companyId(IDS.company2),
    pricingRule: "COST",
    markupPercent: null,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function makeIcDocument(overrides: Partial<IntercompanyDocument> = {}): IntercompanyDocument {
  return {
    id: IDS.icDoc,
    tenantId: "t1" as never,
    relationshipId: IDS.agreement,
    sourceCompanyId: IDS.company as never,
    mirrorCompanyId: IDS.company2 as never,
    sourceJournalId: IDS.journal,
    mirrorJournalId: "00000000-0000-4000-8000-000000000002",
    amount: 100000n,
    currency: "USD",
    status: "PAIRED",
    createdAt: new Date("2025-01-15"),
    ...overrides,
  };
}

export function mockIcAgreementRepo(
  agreements: IntercompanyRelationship[] = [],
): IIcAgreementRepo {
  return {
    async findById(id: string): Promise<Result<IntercompanyRelationship>> {
      const a = agreements.find((ag) => ag.id === id);
      if (!a) return err(new NotFoundError("IcAgreement", id));
      return ok(a);
    },
    async findByCompanyPair(seller: string, buyer: string): Promise<Result<IntercompanyRelationship>> {
      const a = agreements.find((ag) => String(ag.sellerCompanyId) === seller && String(ag.buyerCompanyId) === buyer);
      if (!a) return err(new NotFoundError("IcAgreement", `${seller}/${buyer}`));
      return ok(a);
    },
    async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<IntercompanyRelationship>>> {
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 20;
      const offset = (page - 1) * limit;
      return ok({ data: agreements.slice(offset, offset + limit), total: agreements.length, page, limit });
    },
  };
}

export function mockIcTransactionRepo(
  existing: IntercompanyDocument[] = [],
): IIcTransactionRepo & { docs: CreateIcDocumentInput[] } {
  const docs: CreateIcDocumentInput[] = [];
  return {
    docs,
    async create(input: CreateIcDocumentInput): Promise<Result<IntercompanyDocument>> {
      docs.push(input);
      const doc: IntercompanyDocument = {
        id: IDS.icDoc,
        tenantId: input.tenantId as never,
        relationshipId: input.relationshipId,
        sourceCompanyId: input.sourceCompanyId as never,
        mirrorCompanyId: input.mirrorCompanyId as never,
        sourceJournalId: input.sourceJournalId,
        mirrorJournalId: input.mirrorJournalId,
        amount: input.amount,
        currency: input.currency,
        status: "PAIRED",
        createdAt: new Date(),
      };
      existing.push(doc);
      return ok(doc);
    },
    async findById(id: string): Promise<Result<IntercompanyDocument>> {
      const d = existing.find((doc) => doc.id === id);
      if (!d) return err(new NotFoundError("IcDocument", id));
      return ok(d);
    },
    async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<IntercompanyDocument>>> {
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 20;
      const offset = (page - 1) * limit;
      return ok({ data: existing.slice(offset, offset + limit), total: existing.length, page, limit });
    },
  };
}

export function mockFxRateRepo(
  rates: FxRate[] = [],
): IFxRateRepo {
  return {
    async findRate(fromCurrency: string, toCurrency: string, effectiveDate: Date): Promise<Result<FxRate>> {
      const rate = rates.find(
        (r) =>
          r.fromCurrency === fromCurrency &&
          r.toCurrency === toCurrency &&
          r.effectiveDate <= effectiveDate,
      );
      if (!rate) return err(new NotFoundError("FxRate", `${fromCurrency}/${toCurrency}`));
      return ok(rate);
    },
  };
}

export function mockJournalAuditRepo(): IJournalAuditRepo & { entries: AuditLogInput[] } {
  const entries: AuditLogInput[] = [];
  return {
    entries,
    async log(input: AuditLogInput): Promise<void> {
      entries.push(input);
    },
    async findByJournalId(journalId: string): Promise<Result<JournalAuditEntry[]>> {
      return ok(
        entries
          .filter((e) => e.journalId === journalId)
          .map((e, i) => ({
            id: `audit-${i}`,
            journalId: e.journalId,
            tenantId: e.tenantId,
            fromStatus: e.fromStatus,
            toStatus: e.toStatus,
            userId: e.userId,
            reason: e.reason,
            correlationId: e.correlationId,
            occurredAt: new Date(),
          })),
      );
    },
  };
}

export function makeRecurringTemplate(overrides: Partial<RecurringTemplate> = {}): RecurringTemplate {
  return {
    id: "00000000-0000-4000-8000-0000000000b1",
    companyId: companyId(IDS.company),
    ledgerId: ledgerId(IDS.ledger),
    description: "Monthly depreciation",
    lines: [
      { accountCode: "1000", debit: money(5000n, "USD"), credit: money(0n, "USD"), description: "Depr debit" },
      { accountCode: "2000", debit: money(0n, "USD"), credit: money(5000n, "USD"), description: "Depr credit" },
    ],
    frequency: "MONTHLY",
    nextRunDate: new Date("2025-06-01"),
    isActive: true,
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function mockRecurringTemplateRepo(
  templates: RecurringTemplate[] = [],
): IRecurringTemplateRepo & { templates: RecurringTemplate[] } {
  return {
    templates,
    async findById(id: string): Promise<RecurringTemplate | null> {
      return templates.find((t) => t.id === id) ?? null;
    },
    async findAll(params: PaginationParams) {
      const page = params.page;
      const limit = params.limit;
      const offset = (page - 1) * limit;
      return { data: templates.slice(offset, offset + limit), total: templates.length, page, limit };
    },
    async findDue(asOfDate: Date): Promise<RecurringTemplate[]> {
      return templates.filter((t) => t.isActive && t.nextRunDate <= asOfDate);
    },
    async create(input: CreateRecurringTemplateInput): Promise<RecurringTemplate> {
      const t = makeRecurringTemplate({
        id: `rt-${Date.now()}`,
        description: input.description,
        frequency: input.frequency,
        nextRunDate: input.nextRunDate,
      });
      templates.push(t);
      return t;
    },
    async updateNextRunDate(id: string, nextRunDate: Date): Promise<void> {
      const t = templates.find((tpl) => tpl.id === id);
      if (t) Object.assign(t, { nextRunDate });
    },
    async deactivate(id: string): Promise<void> {
      const t = templates.find((tpl) => tpl.id === id);
      if (t) Object.assign(t, { isActive: false });
    },
  };
}

export function makeBudgetEntry(overrides: Partial<BudgetEntry> = {}): BudgetEntry {
  return {
    id: "00000000-0000-4000-8000-0000000000c1",
    companyId: companyId(IDS.company),
    ledgerId: ledgerId(IDS.ledger),
    accountId: IDS.account1,
    accountCode: "1000",
    periodId: IDS.period,
    budgetAmount: money(50000n, "USD"),
    version: 1,
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function mockBudgetRepo(
  entries: BudgetEntry[] = [],
): IBudgetRepo & { entries: BudgetEntry[] } {
  return {
    entries,
    async upsert(input: UpsertBudgetEntryInput): Promise<BudgetEntry> {
      const existing = entries.find(
        (e) => e.accountId === input.accountId && e.periodId === input.periodId,
      );
      if (existing) {
        Object.assign(existing, { budgetAmount: money(input.budgetAmount, "USD") });
        return existing;
      }
      const entry = makeBudgetEntry({
        id: `be-${Date.now()}`,
        accountId: input.accountId,
        periodId: input.periodId,
        budgetAmount: money(input.budgetAmount, "USD"),
      });
      entries.push(entry);
      return entry;
    },
    async findByLedgerAndPeriod(
      _ledgerId: string,
      periodId: string,
      params: PaginationParams,
    ) {
      const filtered = entries.filter((e) => e.periodId === periodId);
      const page = params.page;
      const limit = params.limit;
      const offset = (page - 1) * limit;
      return {
        data: filtered.slice(offset, offset + limit),
        total: filtered.length,
        page,
        limit,
      };
    },
  };
}

export function mockDocumentNumberGenerator(): IDocumentNumberGenerator & { counter: number } {
  let counter = 0;
  return {
    get counter() { return counter; },
    async next(_tenantId: string, prefix: string) {
      counter++;
      return ok(`${prefix}-${String(counter).padStart(6, "0")}`);
    },
  };
}

export function mockPeriodAuditRepo(): IPeriodAuditRepo {
  return {
    async log() { /* no-op */ },
  };
}

export function mockIcSettlementRepo(): IIcSettlementRepo {
  return {
    async create() { return err(new NotFoundError("IcSettlement", "stub")); },
    async findById() { return err(new NotFoundError("IcSettlement", "stub")); },
    async confirm() { return err(new NotFoundError("IcSettlement", "stub")); },
    async cancel() { return err(new NotFoundError("IcSettlement", "stub")); },
  };
}

export function mockClassificationRuleRepo(): IClassificationRuleRepo {
  return {
    async findByStandard() { return err(new NotFoundError("ClassificationRuleSet", "stub")); },
    async findAll() { return ok({ data: [], total: 0, page: 1, limit: 20 }); },
    async findRuleById() { return err(new NotFoundError("ClassificationRule", "stub")); },
  };
}

export function mockFxRateApprovalRepo(): IFxRateApprovalRepo {
  return {
    async submit() { return err(new NotFoundError("FxRateApproval", "stub")); },
    async approve() { return err(new NotFoundError("FxRateApproval", "stub")); },
    async reject() { return err(new NotFoundError("FxRateApproval", "stub")); },
    async findByRateId() { return err(new NotFoundError("FxRateApproval", "stub")); },
  };
}

export function mockRevenueContractRepo(): IRevenueContractRepo {
  return {
    async create() { return err(new NotFoundError("RevenueContract", "stub")); },
    async findById() { return err(new NotFoundError("RevenueContract", "stub")); },
    async findAll() { return ok({ data: [], total: 0, page: 1, limit: 20 }); },
    async updateRecognized() { return err(new NotFoundError("RevenueContract", "stub")); },
    async findMilestones() { return ok([]); },
  };
}
