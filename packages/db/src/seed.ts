import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index.js";
import { tenants, companies, users } from "./schema/platform.js";
import {
  currencies,
  fiscalYears,
  fiscalPeriods,
  accounts,
  ledgers,
  glJournals,
  glJournalLines,
  icAgreements,
} from "./schema/erp.js";

/**
 * Seed script — inserts enterprise reference data for development.
 *
 * Creates a complete multi-company, multi-currency, intercompany
 * environment with COA, fiscal periods, ledgers, and a sample journal.
 *
 * All IDs are DB-generated via uuid_generate_v7() — no hardcoded UUIDs.
 * Uses returning() to chain dependent inserts.
 *
 * Run via: pnpm --filter @afenda/db db:seed
 */
export async function seed(connectionString: string): Promise<void> {
  const client = postgres(connectionString, {
    max: 1,
    ssl: "require",
    onnotice: () => { },
  });
  const db = drizzle({ client, schema });

  try {
    // ─── Tenant (idempotent — upsert or select existing) ─────────────
    const [insertedTenant] = await db
      .insert(tenants)
      .values({ name: "Demo Tenant", slug: "demo", status: "ACTIVE", settings: {} })
      .onConflictDoNothing({ target: tenants.slug })
      .returning();

    const tid = insertedTenant?.id
      ?? (await db.select().from(tenants).where(eq(tenants.slug, "demo")).limit(1))[0]!.id;

    // ─── Users (idempotent) ──────────────────────────────────────────
    const [insertedUser] = await db
      .insert(users)
      .values({ tenantId: tid, email: "admin@demo.afenda.dev", displayName: "Admin User" })
      .onConflictDoNothing()
      .returning();
    const adminUser = insertedUser
      ?? (await db.select().from(users).where(eq(users.tenantId, tid)).limit(1))[0];

    // ─── Currencies (idempotent) ────────────────────────────────────────
    await db
      .insert(currencies)
      .values([
        { tenantId: tid, code: "USD", name: "US Dollar", symbol: "$", decimalPlaces: 2 },
        { tenantId: tid, code: "EUR", name: "Euro", symbol: "€", decimalPlaces: 2 },
        { tenantId: tid, code: "MYR", name: "Malaysian Ringgit", symbol: "RM", decimalPlaces: 2 },
      ])
      .onConflictDoNothing();
    const allCurrencies = await db.select().from(currencies).where(eq(currencies.tenantId, tid));
    const usd = allCurrencies.find((c) => c.code === "USD")!;
    const myr = allCurrencies.find((c) => c.code === "MYR")!;

    // ─── Companies (idempotent) ─────────────────────────────────────────
    await db
      .insert(companies)
      .values([
        { tenantId: tid, name: "Afenda HQ (US)", code: "HQ-US", baseCurrencyId: usd.id },
        { tenantId: tid, name: "Afenda MY Sdn Bhd", code: "MY-01", baseCurrencyId: myr.id },
      ])
      .onConflictDoNothing();
    const allCompanies = await db.select().from(companies).where(eq(companies.tenantId, tid));
    const hqCompany = allCompanies.find((c) => c.code === "HQ-US")!;
    const myCompany = allCompanies.find((c) => c.code === "MY-01")!;

    // ─── Chart of Accounts (idempotent) ──────────────────────────────
    const coaEntries = [
      { tenantId: tid, code: "1000", name: "Cash & Bank", accountType: "ASSET" as const },
      { tenantId: tid, code: "1100", name: "Accounts Receivable", accountType: "ASSET" as const },
      { tenantId: tid, code: "1200", name: "Intercompany Receivable", accountType: "ASSET" as const },
      { tenantId: tid, code: "2000", name: "Accounts Payable", accountType: "LIABILITY" as const },
      { tenantId: tid, code: "2100", name: "Intercompany Payable", accountType: "LIABILITY" as const },
      { tenantId: tid, code: "3000", name: "Retained Earnings", accountType: "EQUITY" as const },
      { tenantId: tid, code: "4000", name: "Revenue", accountType: "REVENUE" as const },
      { tenantId: tid, code: "5000", name: "Cost of Goods Sold", accountType: "EXPENSE" as const },
      { tenantId: tid, code: "6000", name: "Operating Expenses", accountType: "EXPENSE" as const },
    ];
    await db.insert(accounts).values(coaEntries).onConflictDoNothing();
    const accts = await db.select().from(accounts).where(eq(accounts.tenantId, tid));
    const cashAcct = accts.find((a) => a.code === "1000")!;
    const revenueAcct = accts.find((a) => a.code === "4000")!;

    // ─── Fiscal Year + Periods (idempotent) ──────────────────────────
    await db
      .insert(fiscalYears)
      .values({
        tenantId: tid,
        name: "FY2025",
        startDate: new Date("2025-01-01T00:00:00Z"),
        endDate: new Date("2025-12-31T23:59:59Z"),
      })
      .onConflictDoNothing();
    const [fy] = await db.select().from(fiscalYears).where(eq(fiscalYears.tenantId, tid)).limit(1);

    const periodValues = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const start = new Date(Date.UTC(2025, i, 1));
      const end = new Date(Date.UTC(2025, i + 1, 0, 23, 59, 59));
      return {
        tenantId: tid,
        fiscalYearId: fy!.id,
        name: `P${String(month).padStart(2, "0")}`,
        periodNumber: month,
        startDate: start,
        endDate: end,
        status: "OPEN" as const,
      };
    });
    await db.insert(fiscalPeriods).values(periodValues).onConflictDoNothing();
    const periods = await db.select().from(fiscalPeriods).where(eq(fiscalPeriods.tenantId, tid));

    // ─── Ledgers (idempotent) ────────────────────────────────────────
    await db
      .insert(ledgers)
      .values([
        { tenantId: tid, companyId: hqCompany.id, name: "General Ledger", currencyId: usd.id, isDefault: true },
        { tenantId: tid, companyId: myCompany.id, name: "General Ledger", currencyId: myr.id, isDefault: true },
      ])
      .onConflictDoNothing();
    const [hqLedger] = await db.select().from(ledgers).where(and(eq(ledgers.tenantId, tid), eq(ledgers.companyId, hqCompany.id))).limit(1);

    // ─── Intercompany Agreement (idempotent) ─────────────────────────
    await db.insert(icAgreements).values({
      tenantId: tid,
      sellerCompanyId: hqCompany.id,
      buyerCompanyId: myCompany.id,
      pricing: "TRANSFER_PRICE",
      currencyId: usd.id,
    }).onConflictDoNothing();

    // ─── Sample Journal (idempotent) ─────────────────────────────────
    await db
      .insert(glJournals)
      .values({
        tenantId: tid,
        ledgerId: hqLedger!.id,
        fiscalPeriodId: periods[0]!.id,
        journalNumber: "JV-2025-0001",
        documentType: "JOURNAL",
        status: "DRAFT",
        description: "Opening balance — seed data",
        postingDate: new Date("2025-01-01T00:00:00Z"),
        metadata: {},
      })
      .onConflictDoNothing();
    const [journal] = await db.select().from(glJournals).where(eq(glJournals.tenantId, tid)).limit(1);

    await db.insert(glJournalLines).values([
      {
        tenantId: tid,
        journalId: journal!.id,
        lineNumber: 1,
        accountId: cashAcct.id,
        description: "Cash opening balance",
        debit: 1000000n,
        credit: 0n,
      },
      {
        tenantId: tid,
        journalId: journal!.id,
        lineNumber: 2,
        accountId: revenueAcct.id,
        description: "Revenue opening balance",
        debit: 0n,
        credit: 1000000n,
      },
    ]).onConflictDoNothing();

    console.warn(
      `Seed complete: tenant=${tid}, companies=2, currencies=3, accounts=${accts.length}, periods=12, user=${adminUser!.id}`,
    );
  } finally {
    await client.end();
  }
}
