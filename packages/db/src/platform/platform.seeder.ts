/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { tenants, companies, users } from '../schema/platform.js';
import { currencies } from '../schema/erp.js';
import type { DbClient } from '../client.js';

export interface PlatformSeedOptions {
  seed: number;
  tenantCount?: number;
  companiesPerTenant?: number;
}

/**
 * Seeds platform foundation: tenants, companies, users, currencies.
 * Uses drizzle-seed for deterministic generation.
 * 
 * @param db - Database client (direct connection required)
 * @param options - Seeding options with deterministic seed number
 * @returns Created platform entities
 */
export async function seedPlatform(
  db: DbClient,
  options: PlatformSeedOptions
): Promise<{
  tenant: typeof tenants.$inferSelect;
  companies: Array<typeof companies.$inferSelect>;
  adminUser: typeof users.$inferSelect;
  currencies: Array<typeof currencies.$inferSelect>;
}> {
  console.log(`📦 Seeding platform (seed: ${options.seed})...`);
  
  // ─── Tenant (idempotent) ─────────────────────────────────────────
  const [insertedTenant] = await db
    .insert(tenants)
    .values({ 
      name: 'Demo Tenant', 
      slug: 'demo', 
      status: 'ACTIVE', 
      settings: {},
      displayName: 'Afenda Demo Organization',
      planTier: 'enterprise',
    })
    .onConflictDoNothing({ target: tenants.slug })
    .returning();

  const tenant = insertedTenant ?? 
    (await db.query.tenants.findFirst({ 
      where: (t, { eq }) => eq(t.slug, 'demo') 
    }))!;

  console.log(`  ✓ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── Admin User (idempotent) ─────────────────────────────────────
  const [insertedUser] = await db
    .insert(users)
    .values({ 
      tenantId: tenant.id, 
      email: 'admin@demo.afenda.dev', 
      displayName: 'Admin User',
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();
    
  const adminUser = insertedUser ?? 
    (await db.query.users.findFirst({
      where: (u, { eq, and }) => and(
        eq(u.tenantId, tenant.id),
        eq(u.email, 'admin@demo.afenda.dev')
      )
    }))!;

  console.log(`  ✓ Admin User: ${adminUser.displayName} (${adminUser.email})`);

  // ─── Currencies (idempotent) ─────────────────────────────────────
  await db
    .insert(currencies)
    .values([
      { tenantId: tenant.id, code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
      { tenantId: tenant.id, code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
      { tenantId: tenant.id, code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2 },
      { tenantId: tenant.id, code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
      { tenantId: tenant.id, code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2 },
    ])
    .onConflictDoNothing();
    
  const allCurrencies = await db.query.currencies.findMany({
    where: (c, { eq }) => eq(c.tenantId, tenant.id)
  });

  const usd = allCurrencies.find((c) => c.code === 'USD')!;
  const myr = allCurrencies.find((c) => c.code === 'MYR')!;
  const sgd = allCurrencies.find((c) => c.code === 'SGD')!;

  console.log(`  ✓ Currencies: ${allCurrencies.map(c => c.code).join(', ')}`);

  // ─── Companies (idempotent) ──────────────────────────────────────
  const companyCount = options.companiesPerTenant ?? 2;
  const companyData = [
    { name: 'Afenda HQ (US)', code: 'HQ-US', baseCurrencyId: usd.id },
    { name: 'Afenda MY Sdn Bhd', code: 'MY-01', baseCurrencyId: myr.id },
    { name: 'Afenda Singapore Pte Ltd', code: 'SG-01', baseCurrencyId: sgd.id },
  ].slice(0, companyCount);

  await db
    .insert(companies)
    .values(companyData.map(c => ({ ...c, tenantId: tenant.id, isActive: true })))
    .onConflictDoNothing();

  const allCompanies = await db.query.companies.findMany({
    where: (c, { eq }) => eq(c.tenantId, tenant.id)
  });

  console.log(`  ✓ Companies: ${allCompanies.map(c => c.name).join(', ')}`);

  return {
    tenant,
    companies: allCompanies,
    adminUser,
    currencies: allCurrencies,
  };
}
