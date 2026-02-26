/**
 * Shared mock factories for finance unit tests.
 * All repos are mocked via ports — no DB needed.
 */
import type { FastifyInstance } from 'fastify';
import { ok, err, NotFoundError, money, companyId, ledgerId, dateRange } from '@afenda/core';
import type { PaginationParams, PaginatedResult } from '@afenda/core';
import { admin as adminRole } from '@afenda/authz';

/**
 * Registers a test auth plugin that populates req.authUser from headers.
 * This bridges the gap between test headers and the extractIdentity(req) flow.
 *
 * Tests send `x-tenant-id` / `x-user-id` headers; this plugin translates
 * them into `req.authUser` so route handlers (which use extractIdentity)
 * see the identity on the canonical path.
 */
export function registerTestAuthPlugin(app: FastifyInstance): void {
  app.decorateRequest('authUser', undefined);
  app.addHook('preHandler', async (req) => {
    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    const userId = req.headers['x-user-id'] as string | undefined;
    if (tenantId && userId) {
      (req as typeof req & { authUser?: Record<string, unknown> }).authUser = {
        tenantId,
        userId,
        roles: [adminRole] as const,
        orgRoles: [] as readonly string[],
      };
    }
  });
}

// Fixed UUIDs for deterministic tests
export const IDS = {
  journal: '00000000-0000-4000-8000-000000000001',
  account1: '00000000-0000-4000-8000-000000000010',
  account2: '00000000-0000-4000-8000-000000000011',
  period: '00000000-0000-4000-8000-000000000020',
  company: '00000000-0000-4000-8000-000000000030',
  company2: '00000000-0000-4000-8000-000000000031',
  ledger: '00000000-0000-4000-8000-000000000040',
  ledger2: '00000000-0000-4000-8000-000000000041',
  agreement: '00000000-0000-4000-8000-000000000099',
  icDoc: '00000000-0000-4000-8000-0000000000a1',
} as const;
import type { Result } from '@afenda/core';
import type { Journal, JournalLine } from '../slices/gl/entities/journal.js';
import type { Account } from '../slices/gl/entities/account.js';
import type { FiscalPeriod } from '../slices/gl/entities/fiscal-period.js';
import type { TrialBalance } from '../slices/gl/entities/gl-balance.js';
import type { JournalAuditEntry } from '../slices/gl/entities/journal-audit.js';
import type { IJournalRepo, CreateJournalInput } from '../slices/gl/ports/journal-repo.js';
import type { IAccountRepo } from '../slices/gl/ports/account-repo.js';
import type { IFiscalPeriodRepo } from '../slices/gl/ports/fiscal-period-repo.js';
import type { IGlBalanceRepo, BalanceUpsertLine } from '../slices/gl/ports/gl-balance-repo.js';
import type {
  IIdempotencyStore,
  IdempotencyClaimInput,
} from '../shared/ports/idempotency-store.js';
import type { IOutboxWriter, OutboxEvent } from '../shared/ports/outbox-writer.js';
import type { IJournalAuditRepo, AuditLogInput } from '../slices/gl/ports/journal-audit-repo.js';
import type { IFxRateRepo } from '../slices/fx/ports/fx-rate-repo.js';
import type { ILedgerRepo } from '../slices/gl/ports/ledger-repo.js';
import type {
  IIcAgreementRepo,
  IIcTransactionRepo,
  CreateIcDocumentInput,
} from '../slices/ic/ports/ic-repo.js';
import type { FxRate } from '../slices/fx/entities/fx-rate.js';
import type { Ledger } from '../slices/gl/entities/ledger.js';
import type {
  IntercompanyRelationship,
  IntercompanyDocument,
} from '../slices/ic/entities/intercompany.js';
import type { RecurringTemplate } from '../slices/hub/entities/recurring-template.js';
import type { BudgetEntry } from '../slices/hub/entities/budget.js';
import type {
  IRecurringTemplateRepo,
  CreateRecurringTemplateInput,
} from '../slices/hub/ports/recurring-template-repo.js';
import type { IBudgetRepo, UpsertBudgetEntryInput } from '../slices/hub/ports/budget-repo.js';
import type { IDocumentNumberGenerator } from '../slices/gl/ports/document-number-generator.js';
import type { IPeriodAuditRepo } from '../slices/gl/ports/period-audit-repo.js';
import type { IIcSettlementRepo } from '../slices/ic/ports/ic-settlement-repo.js';
import type { IClassificationRuleRepo } from '../slices/hub/ports/classification-rule-repo.js';
import type { IFxRateApprovalRepo } from '../slices/fx/ports/fx-rate-approval-repo.js';
import type { IRevenueContractRepo } from '../slices/hub/ports/revenue-contract-repo.js';
import type { ApInvoice, ApInvoiceLine } from '../slices/ap/entities/ap-invoice.js';
import type { PaymentRun, PaymentRunItem } from '../slices/ap/entities/payment-run.js';
import type { PaymentTerms } from '../slices/ap/entities/payment-terms.js';
import type { IApInvoiceRepo, CreateApInvoiceInput } from '../slices/ap/ports/ap-invoice-repo.js';
import type { IPaymentTermsRepo } from '../slices/ap/ports/payment-terms-repo.js';
import type {
  IApPaymentRunRepo,
  CreatePaymentRunInput,
  AddPaymentRunItemInput,
} from '../slices/ap/ports/payment-run-repo.js';
import type { ArInvoice, ArInvoiceLine } from '../slices/ar/entities/ar-invoice.js';
import type {
  ArPaymentAllocation,
  AllocationItem,
} from '../slices/ar/entities/ar-payment-allocation.js';
import type { DunningRun, DunningLetter } from '../slices/ar/entities/dunning.js';
import type { IArInvoiceRepo, CreateArInvoiceInput } from '../slices/ar/ports/ar-invoice-repo.js';
import type {
  IArPaymentAllocationRepo,
  CreatePaymentAllocationInput,
  AddAllocationItemInput,
} from '../slices/ar/ports/ar-payment-allocation-repo.js';
import type {
  IDunningRepo,
  CreateDunningRunInput,
  AddDunningLetterInput,
} from '../slices/ar/ports/dunning-repo.js';

// ─── Domain Factories ───────────────────────────────────────────────────────

export function makeLine(overrides: Partial<JournalLine> = {}): JournalLine {
  return {
    accountId: IDS.account1,
    accountCode: '1000',
    debit: money(10000n, 'USD'),
    credit: money(0n, 'USD'),
    ...overrides,
  };
}

export function makeJournal(overrides: Partial<Journal> = {}): Journal {
  return {
    id: IDS.journal,
    companyId: companyId(IDS.company),
    ledgerId: ledgerId(IDS.ledger),
    fiscalPeriodId: IDS.period,
    description: 'Test journal',
    date: new Date('2025-06-15'),
    status: 'DRAFT',
    lines: [
      makeLine({ accountId: IDS.account1, debit: money(10000n, 'USD'), credit: money(0n, 'USD') }),
      makeLine({
        accountId: IDS.account2,
        accountCode: '2000',
        debit: money(0n, 'USD'),
        credit: money(10000n, 'USD'),
      }),
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
    code: '1000',
    name: 'Cash',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    parentId: null,
    isActive: true,
    ...overrides,
  };
}

export function makePeriod(overrides: Partial<FiscalPeriod> = {}): FiscalPeriod {
  return {
    id: IDS.period,
    companyId: companyId(IDS.company),
    name: '2025-P06',
    range: dateRange(new Date('2025-06-01'), new Date('2025-06-30')),
    status: 'OPEN',
    ...overrides,
  };
}

// ─── Mock Repos ─────────────────────────────────────────────────────────────

export function mockJournalRepo(
  journals: Map<string, Journal> = new Map()
): IJournalRepo & { journals: Map<string, Journal> } {
  return {
    journals,
    async findById(id: string): Promise<Result<Journal>> {
      const j = journals.get(id);
      return j ? ok(j) : err(new NotFoundError('Journal', id));
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
        status: 'DRAFT',
        lines: input.lines.map((l, i) =>
          makeLine({
            accountId: l.accountId,
            accountCode: `${1000 + i}`,
            debit: money(l.debit, 'USD'),
            credit: money(l.credit, 'USD'),
            description: l.description,
          })
        ),
      });
      journals.set(j.id, j);
      return ok(j);
    },
    async findByPeriod(
      periodId?: string,
      status?: string,
      pagination?: PaginationParams
    ): Promise<Result<PaginatedResult<Journal>>> {
      const all = [...journals.values()].filter(
        (j) => (!periodId || j.fiscalPeriodId === periodId) && (!status || j.status === status)
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
      return a ? ok(a) : err(new NotFoundError('Account', code));
    },
    async findById(id: string): Promise<Result<Account>> {
      const a = accounts.find((acc) => acc.id === id);
      return a ? ok(a) : err(new NotFoundError('Account', id));
    },
    async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<Account>>> {
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 20;
      const offset = (page - 1) * limit;
      return ok({
        data: accounts.slice(offset, offset + limit),
        total: accounts.length,
        page,
        limit,
      });
    },
  };
}

export function mockPeriodRepo(periods: FiscalPeriod[] = [makePeriod()]): IFiscalPeriodRepo {
  return {
    async findById(id: string): Promise<Result<FiscalPeriod>> {
      const p = periods.find((per) => per.id === id);
      return p ? ok(p) : err(new NotFoundError('FiscalPeriod', id));
    },
    async findOpenByDate(_companyId: string, date: Date): Promise<Result<FiscalPeriod>> {
      const p = periods.find(
        (per) => per.status === 'OPEN' && date >= per.range.from && date <= per.range.to
      );
      return p ? ok(p) : err(new NotFoundError('FiscalPeriod', `open for ${date.toISOString()}`));
    },
    async close(id: string): Promise<Result<FiscalPeriod>> {
      const p = periods.find((per) => per.id === id);
      if (!p) return err(new NotFoundError('FiscalPeriod', id));
      const closed = { ...p, status: 'CLOSED' as const };
      return ok(closed);
    },
    async reopen(id: string): Promise<Result<FiscalPeriod>> {
      const p = periods.find((per) => per.id === id);
      if (!p) return err(new NotFoundError('FiscalPeriod', id));
      const reopened = { ...p, status: 'OPEN' as const };
      return ok(reopened);
    },
    async lock(id: string): Promise<Result<FiscalPeriod>> {
      const p = periods.find((per) => per.id === id);
      if (!p) return err(new NotFoundError('FiscalPeriod', id));
      const locked = { ...p, status: 'LOCKED' as const };
      return ok(locked);
    },
    async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<FiscalPeriod>>> {
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 20;
      const offset = (page - 1) * limit;
      return ok({
        data: periods.slice(offset, offset + limit),
        total: periods.length,
        page,
        limit,
      });
    },
    async findByIds(ids: readonly string[]): Promise<Result<FiscalPeriod[]>> {
      return ok(periods.filter((p) => ids.includes(p.id)));
    },
    async findByLedger(
      _ledgerId: string,
      pagination?: PaginationParams
    ): Promise<Result<PaginatedResult<FiscalPeriod>>> {
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 20;
      const offset = (page - 1) * limit;
      return ok({
        data: periods.slice(offset, offset + limit),
        total: periods.length,
        page,
        limit,
      });
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
        periodId: '2025-P06',
        rows: [],
        totalDebits: money(0n, 'USD'),
        totalCredits: money(0n, 'USD'),
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
        return { claimed: false as const, resultRef: 'existing' };
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
    name: 'General Ledger',
    baseCurrency: 'USD',
    fiscalYearStart: 1,
    isDefault: true,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function mockLedgerRepo(items: Ledger[] = [makeLedger()]): ILedgerRepo {
  return {
    async findById(id: string): Promise<Result<Ledger>> {
      const l = items.find((led) => led.id === id);
      if (!l) return err(new NotFoundError('Ledger', id));
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

export function makeIcAgreement(
  overrides: Partial<IntercompanyRelationship> = {}
): IntercompanyRelationship {
  return {
    id: IDS.agreement,
    tenantId: 't1' as never,
    sellerCompanyId: companyId(IDS.company),
    buyerCompanyId: companyId(IDS.company2),
    pricingRule: 'COST',
    markupPercent: null,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function makeIcDocument(
  overrides: Partial<IntercompanyDocument> = {}
): IntercompanyDocument {
  return {
    id: IDS.icDoc,
    tenantId: 't1' as never,
    relationshipId: IDS.agreement,
    sourceCompanyId: IDS.company as never,
    mirrorCompanyId: IDS.company2 as never,
    sourceJournalId: IDS.journal,
    mirrorJournalId: '00000000-0000-4000-8000-000000000002',
    amount: 100000n,
    currency: 'USD',
    status: 'PAIRED',
    createdAt: new Date('2025-01-15'),
    ...overrides,
  };
}

export function mockIcAgreementRepo(agreements: IntercompanyRelationship[] = []): IIcAgreementRepo {
  return {
    async findById(id: string): Promise<Result<IntercompanyRelationship>> {
      const a = agreements.find((ag) => ag.id === id);
      if (!a) return err(new NotFoundError('IcAgreement', id));
      return ok(a);
    },
    async findByCompanyPair(
      seller: string,
      buyer: string
    ): Promise<Result<IntercompanyRelationship>> {
      const a = agreements.find(
        (ag) => String(ag.sellerCompanyId) === seller && String(ag.buyerCompanyId) === buyer
      );
      if (!a) return err(new NotFoundError('IcAgreement', `${seller}/${buyer}`));
      return ok(a);
    },
    async findAll(
      pagination?: PaginationParams
    ): Promise<Result<PaginatedResult<IntercompanyRelationship>>> {
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 20;
      const offset = (page - 1) * limit;
      return ok({
        data: agreements.slice(offset, offset + limit),
        total: agreements.length,
        page,
        limit,
      });
    },
  };
}

export function mockIcTransactionRepo(
  existing: IntercompanyDocument[] = []
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
        status: 'PAIRED',
        createdAt: new Date(),
      };
      existing.push(doc);
      return ok(doc);
    },
    async findById(id: string): Promise<Result<IntercompanyDocument>> {
      const d = existing.find((doc) => doc.id === id);
      if (!d) return err(new NotFoundError('IcDocument', id));
      return ok(d);
    },
    async findAll(
      pagination?: PaginationParams
    ): Promise<Result<PaginatedResult<IntercompanyDocument>>> {
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 20;
      const offset = (page - 1) * limit;
      return ok({
        data: existing.slice(offset, offset + limit),
        total: existing.length,
        page,
        limit,
      });
    },
  };
}

export function mockFxRateRepo(rates: FxRate[] = []): IFxRateRepo {
  return {
    async findRate(
      fromCurrency: string,
      toCurrency: string,
      effectiveDate: Date
    ): Promise<Result<FxRate>> {
      const rate = rates.find(
        (r) =>
          r.fromCurrency === fromCurrency &&
          r.toCurrency === toCurrency &&
          r.effectiveDate <= effectiveDate
      );
      if (!rate) return err(new NotFoundError('FxRate', `${fromCurrency}/${toCurrency}`));
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
          }))
      );
    },
  };
}

export function makeRecurringTemplate(
  overrides: Partial<RecurringTemplate> = {}
): RecurringTemplate {
  return {
    id: '00000000-0000-4000-8000-0000000000b1',
    companyId: companyId(IDS.company),
    ledgerId: ledgerId(IDS.ledger),
    description: 'Monthly depreciation',
    lines: [
      {
        accountCode: '1000',
        debit: money(5000n, 'USD'),
        credit: money(0n, 'USD'),
        description: 'Depr debit',
      },
      {
        accountCode: '2000',
        debit: money(0n, 'USD'),
        credit: money(5000n, 'USD'),
        description: 'Depr credit',
      },
    ],
    frequency: 'MONTHLY',
    nextRunDate: new Date('2025-06-01'),
    isActive: true,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function mockRecurringTemplateRepo(
  templates: RecurringTemplate[] = []
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
      return {
        data: templates.slice(offset, offset + limit),
        total: templates.length,
        page,
        limit,
      };
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
    id: '00000000-0000-4000-8000-0000000000c1',
    companyId: companyId(IDS.company),
    ledgerId: ledgerId(IDS.ledger),
    accountId: IDS.account1,
    accountCode: '1000',
    periodId: IDS.period,
    budgetAmount: money(50000n, 'USD'),
    version: 1,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function mockBudgetRepo(
  entries: BudgetEntry[] = []
): IBudgetRepo & { entries: BudgetEntry[] } {
  return {
    entries,
    async upsert(input: UpsertBudgetEntryInput): Promise<BudgetEntry> {
      const existing = entries.find(
        (e) => e.accountId === input.accountId && e.periodId === input.periodId
      );
      if (existing) {
        Object.assign(existing, { budgetAmount: money(input.budgetAmount, 'USD') });
        return existing;
      }
      const entry = makeBudgetEntry({
        id: `be-${Date.now()}`,
        accountId: input.accountId,
        periodId: input.periodId,
        budgetAmount: money(input.budgetAmount, 'USD'),
      });
      entries.push(entry);
      return entry;
    },
    async findByLedgerAndPeriod(_ledgerId: string, periodId: string, params: PaginationParams) {
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
    get counter() {
      return counter;
    },
    async next(_tenantId: string, prefix: string) {
      counter++;
      return ok(`${prefix}-${String(counter).padStart(6, '0')}`);
    },
  };
}

export function mockPeriodAuditRepo(): IPeriodAuditRepo {
  return {
    async log() {
      /* no-op */
    },
  };
}

export function mockIcSettlementRepo(): IIcSettlementRepo {
  return {
    async create() {
      return err(new NotFoundError('IcSettlement', 'stub'));
    },
    async findById() {
      return err(new NotFoundError('IcSettlement', 'stub'));
    },
    async confirm() {
      return err(new NotFoundError('IcSettlement', 'stub'));
    },
    async cancel() {
      return err(new NotFoundError('IcSettlement', 'stub'));
    },
  };
}

export function mockClassificationRuleRepo(): IClassificationRuleRepo {
  return {
    async findByStandard() {
      return err(new NotFoundError('ClassificationRuleSet', 'stub'));
    },
    async findAll() {
      return ok({ data: [], total: 0, page: 1, limit: 20 });
    },
    async findRuleById() {
      return err(new NotFoundError('ClassificationRule', 'stub'));
    },
  };
}

export function mockFxRateApprovalRepo(): IFxRateApprovalRepo {
  return {
    async submit() {
      return err(new NotFoundError('FxRateApproval', 'stub'));
    },
    async approve() {
      return err(new NotFoundError('FxRateApproval', 'stub'));
    },
    async reject() {
      return err(new NotFoundError('FxRateApproval', 'stub'));
    },
    async findByRateId() {
      return err(new NotFoundError('FxRateApproval', 'stub'));
    },
  };
}

export function mockRevenueContractRepo(): IRevenueContractRepo {
  return {
    async create() {
      return err(new NotFoundError('RevenueContract', 'stub'));
    },
    async findById() {
      return err(new NotFoundError('RevenueContract', 'stub'));
    },
    async findAll() {
      return ok({ data: [], total: 0, page: 1, limit: 20 });
    },
    async updateRecognized() {
      return err(new NotFoundError('RevenueContract', 'stub'));
    },
    async findMilestones() {
      return ok([]);
    },
  };
}

// ─── AP Factories ──────────────────────────────────────────────────────────

export const AP_IDS = {
  invoice: '00000000-0000-4000-8000-000000000d01',
  invoice2: '00000000-0000-4000-8000-000000000d02',
  supplier: '00000000-0000-4000-8000-000000000d10',
  paymentRun: '00000000-0000-4000-8000-000000000d20',
  paymentTerms: '00000000-0000-4000-8000-000000000d30',
  apAccount: '00000000-0000-4000-8000-000000000d40',
  expenseAccount: '00000000-0000-4000-8000-000000000d50',
} as const;

export function makeApInvoiceLine(overrides: Partial<ApInvoiceLine> = {}): ApInvoiceLine {
  return {
    id: 'line-1',
    invoiceId: AP_IDS.invoice,
    lineNumber: 1,
    accountId: AP_IDS.expenseAccount,
    description: 'Office supplies',
    quantity: 1,
    unitPrice: money(10000n, 'USD'),
    amount: money(10000n, 'USD'),
    taxAmount: money(0n, 'USD'),
    whtIncomeType: null,
    ...overrides,
  };
}

export function makeApInvoice(overrides: Partial<ApInvoice> = {}): ApInvoice {
  return {
    id: AP_IDS.invoice,
    tenantId: 't1',
    companyId: companyId(IDS.company),
    supplierId: AP_IDS.supplier,
    ledgerId: ledgerId(IDS.ledger),
    invoiceNumber: 'INV-001',
    supplierRef: null,
    invoiceDate: new Date('2025-01-15'),
    dueDate: new Date('2025-02-14'),
    totalAmount: money(10000n, 'USD'),
    paidAmount: money(0n, 'USD'),
    status: 'DRAFT',
    invoiceType: 'STANDARD',
    description: 'Test AP invoice',
    poRef: null,
    receiptRef: null,
    paymentTermsId: null,
    journalId: null,
    originalInvoiceId: null,
    lines: [makeApInvoiceLine()],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makePaymentRunItem(overrides: Partial<PaymentRunItem> = {}): PaymentRunItem {
  return {
    id: 'pri-1',
    paymentRunId: AP_IDS.paymentRun,
    invoiceId: AP_IDS.invoice,
    supplierId: AP_IDS.supplier,
    amount: money(10000n, 'USD'),
    discountAmount: money(0n, 'USD'),
    netAmount: money(10000n, 'USD'),
    journalId: null,
    ...overrides,
  };
}

export function makePaymentRun(overrides: Partial<PaymentRun> = {}): PaymentRun {
  return {
    id: AP_IDS.paymentRun,
    tenantId: 't1',
    companyId: IDS.company,
    runNumber: 'PR-001',
    runDate: new Date('2025-03-01'),
    cutoffDate: new Date('2025-02-28'),
    currencyCode: 'USD',
    totalAmount: money(10000n, 'USD'),
    status: 'DRAFT',
    items: [makePaymentRunItem()],
    executedAt: null,
    executedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makePaymentTerms(overrides: Partial<PaymentTerms> = {}): PaymentTerms {
  return {
    id: AP_IDS.paymentTerms,
    tenantId: 't1',
    code: 'NET30',
    name: 'Net 30',
    netDays: 30,
    discountPercent: 0,
    discountDays: 0,
    isActive: true,
    ...overrides,
  };
}

// ─── AP Mock Repos ─────────────────────────────────────────────────────────

export function mockApInvoiceRepo(
  invoices: Map<string, ApInvoice> = new Map()
): IApInvoiceRepo & { invoices: Map<string, ApInvoice> } {
  return {
    invoices,
    async create(input: CreateApInvoiceInput) {
      const id = `inv-${Date.now()}`;
      const inv = makeApInvoice({
        id,
        tenantId: input.tenantId,
        companyId: companyId(input.companyId),
        supplierId: input.supplierId,
        ledgerId: ledgerId(input.ledgerId),
        invoiceNumber: input.invoiceNumber,
        supplierRef: input.supplierRef,
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate,
        description: input.description,
        poRef: input.poRef,
        receiptRef: input.receiptRef,
        paymentTermsId: input.paymentTermsId,
        totalAmount: money(
          input.lines.reduce((s, l) => s + l.amount + l.taxAmount, 0n),
          input.currencyCode
        ),
        lines: input.lines.map((l, i) =>
          makeApInvoiceLine({
            id: `line-${i}`,
            invoiceId: id,
            lineNumber: i + 1,
            accountId: l.accountId,
            description: l.description,
            quantity: l.quantity,
            unitPrice: money(l.unitPrice, input.currencyCode),
            amount: money(l.amount, input.currencyCode),
            taxAmount: money(l.taxAmount, input.currencyCode),
          })
        ),
      });
      invoices.set(id, inv);
      return ok(inv);
    },
    async findById(id: string) {
      const inv = invoices.get(id);
      return inv ? ok(inv) : err(new NotFoundError('ApInvoice', id));
    },
    async findBySupplier(supplierId: string, params?: PaginationParams) {
      const all = [...invoices.values()].filter((i) => i.supplierId === supplierId);
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      return { data: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit };
    },
    async findByStatus(status: string, params?: PaginationParams) {
      const all = [...invoices.values()].filter((i) => i.status === status);
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      return { data: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit };
    },
    async findAll(params?: PaginationParams) {
      const all = [...invoices.values()];
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      return { data: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit };
    },
    async findUnpaid() {
      return [...invoices.values()].filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');
    },
    async updateStatus(id: string, status: string, journalId?: string) {
      const inv = invoices.get(id);
      if (!inv) return err(new NotFoundError('ApInvoice', id));
      const updated = {
        ...inv,
        status: status as ApInvoice['status'],
        journalId: journalId ?? inv.journalId,
        updatedAt: new Date(),
      };
      invoices.set(id, updated);
      return ok(updated);
    },
    async recordPayment(id: string, amount: bigint) {
      const inv = invoices.get(id);
      if (!inv) return err(new NotFoundError('ApInvoice', id));
      const newPaid = money(inv.paidAmount.amount + amount, inv.paidAmount.currency);
      const newStatus = newPaid.amount >= inv.totalAmount.amount ? 'PAID' : 'PARTIALLY_PAID';
      const updated = {
        ...inv,
        paidAmount: newPaid,
        status: newStatus as ApInvoice['status'],
        updatedAt: new Date(),
      };
      invoices.set(id, updated);
      return ok(updated);
    },
    async recordPaymentWithTrace(id: string, amount: bigint, paymentRef?: string) {
      const prior = invoices.get(id);
      if (!prior) return err(new NotFoundError('ApInvoice', id));
      const priorBalance = prior.totalAmount.amount - prior.paidAmount.amount;
      const newPaid = money(prior.paidAmount.amount + amount, prior.paidAmount.currency);
      const newStatus = newPaid.amount >= prior.totalAmount.amount ? 'PAID' : 'PARTIALLY_PAID';
      const updated = {
        ...prior,
        paidAmount: newPaid,
        status: newStatus as ApInvoice['status'],
        updatedAt: new Date(),
      };
      invoices.set(id, updated);
      const newBalance = updated.totalAmount.amount - updated.paidAmount.amount;
      return ok({
        invoice: updated,
        trace: {
          invoiceId: id,
          paymentRef: paymentRef ?? null,
          priorBalance,
          paymentAmount: amount,
          newBalance,
          priorStatus: prior.status,
          newStatus: updated.status,
          clearedFully: newBalance <= 0n,
          timestamp: new Date(),
        },
      });
    },
  };
}

export function mockPaymentTermsRepo(
  terms: PaymentTerms[] = [makePaymentTerms()]
): IPaymentTermsRepo {
  return {
    async findById(id: string) {
      const t = terms.find((pt) => pt.id === id);
      return t ? ok(t) : err(new NotFoundError('PaymentTerms', id));
    },
    async findByCode(code: string) {
      const t = terms.find((pt) => pt.code === code);
      return t ? ok(t) : err(new NotFoundError('PaymentTerms', code));
    },
    async findAll() {
      return terms.filter((t) => t.isActive);
    },
  };
}

export function mockApPaymentRunRepo(
  runs: Map<string, PaymentRun> = new Map()
): IApPaymentRunRepo & { runs: Map<string, PaymentRun> } {
  return {
    runs,
    async create(input: CreatePaymentRunInput) {
      const id = `pr-${Date.now()}`;
      const run = makePaymentRun({
        id,
        tenantId: input.tenantId,
        companyId: input.companyId,
        runDate: input.runDate,
        cutoffDate: input.cutoffDate,
        currencyCode: input.currencyCode,
        totalAmount: money(0n, input.currencyCode),
        items: [],
      });
      runs.set(id, run);
      return ok(run);
    },
    async findById(id: string) {
      const r = runs.get(id);
      return r ? ok(r) : err(new NotFoundError('PaymentRun', id));
    },
    async findAll(params?: PaginationParams) {
      const all = [...runs.values()];
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      return { data: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit };
    },
    async addItem(runId: string, item: AddPaymentRunItemInput) {
      const run = runs.get(runId);
      if (!run) return err(new NotFoundError('PaymentRun', runId));
      const pri: PaymentRunItem = {
        id: `pri-${Date.now()}`,
        paymentRunId: runId,
        invoiceId: item.invoiceId,
        supplierId: item.supplierId,
        amount: money(item.amount, run.currencyCode),
        discountAmount: money(item.discountAmount, run.currencyCode),
        netAmount: money(item.netAmount, run.currencyCode),
        journalId: null,
      };
      const updated = {
        ...run,
        items: [...run.items, pri],
        totalAmount: money(run.totalAmount.amount + item.netAmount, run.currencyCode),
      };
      runs.set(runId, updated);
      return ok(pri);
    },
    async updateStatus(id: string, status: string) {
      const run = runs.get(id);
      if (!run) return err(new NotFoundError('PaymentRun', id));
      const updated = { ...run, status: status as PaymentRun['status'], updatedAt: new Date() };
      runs.set(id, updated);
      return ok(updated);
    },
    async execute(id: string, userId: string) {
      const run = runs.get(id);
      if (!run) return err(new NotFoundError('PaymentRun', id));
      const updated = {
        ...run,
        status: 'EXECUTED' as const,
        executedAt: new Date(),
        executedBy: userId,
        updatedAt: new Date(),
      };
      runs.set(id, updated);
      return ok(updated);
    },
  };
}

// ─── AR Factories ──────────────────────────────────────────────────────────

export const AR_IDS = {
  invoice: '00000000-0000-4000-8000-000000000e01',
  invoice2: '00000000-0000-4000-8000-000000000e02',
  invoice3: '00000000-0000-4000-8000-000000000e03',
  customer: '00000000-0000-4000-8000-000000000e10',
  customer2: '00000000-0000-4000-8000-000000000e11',
  arAccount: '00000000-0000-4000-8000-000000000e40',
  revenueAccount: '00000000-0000-4000-8000-000000000e50',
  allocation: '00000000-0000-4000-8000-000000000e60',
  dunningRun: '00000000-0000-4000-8000-000000000e70',
} as const;

export function makeArInvoiceLine(overrides: Partial<ArInvoiceLine> = {}): ArInvoiceLine {
  return {
    id: 'ar-line-1',
    invoiceId: AR_IDS.invoice,
    lineNumber: 1,
    accountId: AR_IDS.revenueAccount,
    description: 'Consulting services',
    quantity: 1,
    unitPrice: money(50000n, 'USD'),
    amount: money(50000n, 'USD'),
    taxAmount: money(0n, 'USD'),
    ...overrides,
  };
}

export function makeArInvoice(overrides: Partial<ArInvoice> = {}): ArInvoice {
  return {
    id: AR_IDS.invoice,
    tenantId: 't1',
    companyId: companyId(IDS.company),
    customerId: AR_IDS.customer,
    ledgerId: ledgerId(IDS.ledger),
    invoiceNumber: 'AR-001',
    customerRef: null,
    invoiceDate: new Date('2025-01-15'),
    dueDate: new Date('2025-02-14'),
    totalAmount: money(50000n, 'USD'),
    paidAmount: money(0n, 'USD'),
    status: 'DRAFT',
    description: 'Test AR invoice',
    paymentTermsId: null,
    journalId: null,
    lines: [makeArInvoiceLine()],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeArPaymentAllocation(
  overrides: Partial<ArPaymentAllocation> = {}
): ArPaymentAllocation {
  return {
    id: AR_IDS.allocation,
    tenantId: 't1',
    customerId: AR_IDS.customer,
    paymentDate: new Date('2025-03-01'),
    paymentRef: 'PAY-001',
    totalAmount: money(50000n, 'USD'),
    allocations: [],
    createdAt: new Date(),
    ...overrides,
  };
}

export function makeDunningRun(overrides: Partial<DunningRun> = {}): DunningRun {
  return {
    id: AR_IDS.dunningRun,
    tenantId: 't1',
    runDate: new Date('2025-04-01'),
    status: 'DRAFT',
    letters: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── AR Mock Repos ─────────────────────────────────────────────────────────

export function mockArInvoiceRepo(
  invoices: Map<string, ArInvoice> = new Map()
): IArInvoiceRepo & { invoices: Map<string, ArInvoice> } {
  return {
    invoices,
    async create(input: CreateArInvoiceInput) {
      const id = `ar-inv-${Date.now()}`;
      const inv = makeArInvoice({
        id,
        tenantId: input.tenantId,
        companyId: companyId(input.companyId),
        customerId: input.customerId,
        ledgerId: ledgerId(input.ledgerId),
        invoiceNumber: input.invoiceNumber,
        customerRef: input.customerRef,
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate,
        description: input.description,
        paymentTermsId: input.paymentTermsId,
        totalAmount: money(
          input.lines.reduce((s, l) => s + l.amount + l.taxAmount, 0n),
          input.currencyCode
        ),
        lines: input.lines.map((l, i) =>
          makeArInvoiceLine({
            id: `ar-line-${i}`,
            invoiceId: id,
            lineNumber: i + 1,
            accountId: l.accountId,
            description: l.description,
            quantity: l.quantity,
            unitPrice: money(l.unitPrice, input.currencyCode),
            amount: money(l.amount, input.currencyCode),
            taxAmount: money(l.taxAmount, input.currencyCode),
          })
        ),
      });
      invoices.set(id, inv);
      return ok(inv);
    },
    async findById(id: string) {
      const inv = invoices.get(id);
      return inv ? ok(inv) : err(new NotFoundError('ArInvoice', id));
    },
    async findByCustomer(customerId: string, params?: PaginationParams) {
      const all = [...invoices.values()].filter((i) => i.customerId === customerId);
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      return { data: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit };
    },
    async findByStatus(status: string, params?: PaginationParams) {
      const all = [...invoices.values()].filter((i) => i.status === status);
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      return { data: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit };
    },
    async findAll(params?: PaginationParams) {
      const all = [...invoices.values()];
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      return { data: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit };
    },
    async findUnpaid() {
      return [...invoices.values()].filter(
        (i) => i.status !== 'PAID' && i.status !== 'CANCELLED' && i.status !== 'WRITTEN_OFF'
      );
    },
    async updateStatus(id: string, status: string, journalId?: string) {
      const inv = invoices.get(id);
      if (!inv) return err(new NotFoundError('ArInvoice', id));
      const updated = {
        ...inv,
        status: status as ArInvoice['status'],
        journalId: journalId ?? inv.journalId,
        updatedAt: new Date(),
      };
      invoices.set(id, updated);
      return ok(updated);
    },
    async recordPayment(id: string, amount: bigint) {
      const inv = invoices.get(id);
      if (!inv) return err(new NotFoundError('ArInvoice', id));
      const newPaid = money(inv.paidAmount.amount + amount, inv.paidAmount.currency);
      const newStatus = newPaid.amount >= inv.totalAmount.amount ? 'PAID' : 'PARTIALLY_PAID';
      const updated = {
        ...inv,
        paidAmount: newPaid,
        status: newStatus as ArInvoice['status'],
        updatedAt: new Date(),
      };
      invoices.set(id, updated);
      return ok(updated);
    },
    async writeOff(id: string) {
      const inv = invoices.get(id);
      if (!inv) return err(new NotFoundError('ArInvoice', id));
      const updated = { ...inv, status: 'WRITTEN_OFF' as const, updatedAt: new Date() };
      invoices.set(id, updated);
      return ok(updated);
    },
  };
}

export function mockArPaymentAllocationRepo(
  allocations: Map<string, ArPaymentAllocation> = new Map()
): IArPaymentAllocationRepo & { allocations: Map<string, ArPaymentAllocation> } {
  return {
    allocations,
    async create(input: CreatePaymentAllocationInput) {
      const id = `alloc-${Date.now()}`;
      const alloc = makeArPaymentAllocation({
        id,
        tenantId: input.tenantId,
        customerId: input.customerId,
        paymentDate: input.paymentDate,
        paymentRef: input.paymentRef,
        totalAmount: money(input.totalAmount, input.currencyCode),
        allocations: [],
      });
      allocations.set(id, alloc);
      return ok(alloc);
    },
    async findById(id: string) {
      const a = allocations.get(id);
      return a ? ok(a) : err(new NotFoundError('ArPaymentAllocation', id));
    },
    async findByCustomer(customerId: string, params?: PaginationParams) {
      const all = [...allocations.values()].filter((a) => a.customerId === customerId);
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      return { data: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit };
    },
    async findAll(params?: PaginationParams) {
      const all = [...allocations.values()];
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      return { data: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit };
    },
    async addItem(allocationId: string, item: AddAllocationItemInput) {
      const alloc = allocations.get(allocationId);
      if (!alloc) return err(new NotFoundError('ArPaymentAllocation', allocationId));
      const ai: AllocationItem = {
        id: `ai-${Date.now()}`,
        paymentAllocationId: allocationId,
        invoiceId: item.invoiceId,
        allocatedAmount: money(item.allocatedAmount, alloc.totalAmount.currency),
        journalId: null,
      };
      const updated = { ...alloc, allocations: [...alloc.allocations, ai] };
      allocations.set(allocationId, updated);
      return ok(ai);
    },
  };
}

export function mockDunningRepo(
  runs: Map<string, DunningRun> = new Map()
): IDunningRepo & { runs: Map<string, DunningRun> } {
  return {
    runs,
    async create(input: CreateDunningRunInput) {
      const id = `dr-${Date.now()}`;
      const run = makeDunningRun({
        id,
        tenantId: input.tenantId,
        runDate: input.runDate,
        letters: [],
      });
      runs.set(id, run);
      return ok(run);
    },
    async findById(id: string) {
      const r = runs.get(id);
      return r ? ok(r) : err(new NotFoundError('DunningRun', id));
    },
    async findAll(params?: PaginationParams) {
      const all = [...runs.values()];
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      return { data: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit };
    },
    async addLetter(runId: string, letter: AddDunningLetterInput) {
      const run = runs.get(runId);
      if (!run) return err(new NotFoundError('DunningRun', runId));
      const dl: DunningLetter = {
        id: `dl-${Date.now()}`,
        dunningRunId: runId,
        customerId: letter.customerId,
        level: letter.level,
        invoiceIds: letter.invoiceIds,
        totalOverdue: letter.totalOverdue,
        currencyCode: letter.currencyCode,
        sentAt: null,
      };
      const updated = { ...run, letters: [...run.letters, dl] };
      runs.set(runId, updated);
      return ok(dl);
    },
    async updateStatus(id: string, status: string) {
      const run = runs.get(id);
      if (!run) return err(new NotFoundError('DunningRun', id));
      const updated = { ...run, status: status as DunningRun['status'], updatedAt: new Date() };
      runs.set(id, updated);
      return ok(updated);
    },
  };
}
