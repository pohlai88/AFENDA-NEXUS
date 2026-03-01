/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
import { seed } from 'drizzle-seed';
import type { DbClient } from '../client.js';
import { createDbSession } from '../session.js';
import { 
  accounts, 
  fiscalYears, 
  fiscalPeriods, 
  ledgers,
  customers,
  suppliers,
  taxCodes,
  paymentTerms
} from '../schema/erp.js';

export interface MasterDataSeedOptions {
  seed: number;
  tenantId: string;
  companyId: string;
  currencyId: string;
  customerCount?: number;
  supplierCount?: number;
}

/**
 * Seeds ERP master data: COA, fiscal calendar, customers, suppliers, tax codes, payment terms.
 * Uses drizzle-seed for deterministic generation + business keys for realistic codes.
 * 
 * @param db - Database client
 * @param options - Master data seeding options
 */
export async function seedMasterData(
  db: DbClient,
  options: MasterDataSeedOptions
): Promise<void> {
  const session = createDbSession({ db });
  
  console.log(`🗂️  Seeding master data for company ${options.companyId.substring(0, 8)}...`);

  await session.withTenantAndCompany(
    { tenantId: options.tenantId, companyId: options.companyId },
    async (tx) => {
      // ─── Chart of Accounts (Enhanced) ────────────────────────────
      const coaEntries = [
        // Assets
        { tenantId: options.tenantId, code: '1000', name: 'Cash & Bank', accountType: 'ASSET' as const, isActive: true },
        { tenantId: options.tenantId, code: '1010', name: 'Petty Cash', accountType: 'ASSET' as const, isActive: true },
        { tenantId: options.tenantId, code: '1100', name: 'Accounts Receivable', accountType: 'ASSET' as const, isActive: true },
        { tenantId: options.tenantId, code: '1200', name: 'Intercompany Receivable', accountType: 'ASSET' as const, isActive: true },
        { tenantId: options.tenantId, code: '1300', name: 'Inventory', accountType: 'ASSET' as const, isActive: true },
        { tenantId: options.tenantId, code: '1400', name: 'Prepaid Expenses', accountType: 'ASSET' as const, isActive: true },
        { tenantId: options.tenantId, code: '1500', name: 'Fixed Assets', accountType: 'ASSET' as const, isActive: true },
        { tenantId: options.tenantId, code: '1510', name: 'Accumulated Depreciation', accountType: 'ASSET' as const, isActive: true },
        // Liabilities
        { tenantId: options.tenantId, code: '2000', name: 'Accounts Payable', accountType: 'LIABILITY' as const, isActive: true },
        { tenantId: options.tenantId, code: '2100', name: 'Intercompany Payable', accountType: 'LIABILITY' as const, isActive: true },
        { tenantId: options.tenantId, code: '2200', name: 'Tax Payable', accountType: 'LIABILITY' as const, isActive: true },
        { tenantId: options.tenantId, code: '2300', name: 'Accrued Expenses', accountType: 'LIABILITY' as const, isActive: true },
        { tenantId: options.tenantId, code: '2400', name: 'Short-term Debt', accountType: 'LIABILITY' as const, isActive: true },
        { tenantId: options.tenantId, code: '2500', name: 'Long-term Debt', accountType: 'LIABILITY' as const, isActive: true },
        // Equity
        { tenantId: options.tenantId, code: '3000', name: 'Share Capital', accountType: 'EQUITY' as const, isActive: true },
        { tenantId: options.tenantId, code: '3100', name: 'Retained Earnings', accountType: 'EQUITY' as const, isActive: true },
        // Revenue
        { tenantId: options.tenantId, code: '4000', name: 'Sales Revenue', accountType: 'REVENUE' as const, isActive: true },
        { tenantId: options.tenantId, code: '4100', name: 'Service Revenue', accountType: 'REVENUE' as const, isActive: true },
        { tenantId: options.tenantId, code: '4900', name: 'Other Income', accountType: 'REVENUE' as const, isActive: true },
        // Expenses
        { tenantId: options.tenantId, code: '5000', name: 'Cost of Goods Sold', accountType: 'EXPENSE' as const, isActive: true },
        { tenantId: options.tenantId, code: '6000', name: 'Salaries & Wages', accountType: 'EXPENSE' as const, isActive: true },
        { tenantId: options.tenantId, code: '6100', name: 'Rent Expense', accountType: 'EXPENSE' as const, isActive: true },
        { tenantId: options.tenantId, code: '6200', name: 'Utilities', accountType: 'EXPENSE' as const, isActive: true },
        { tenantId: options.tenantId, code: '6300', name: 'Marketing & Advertising', accountType: 'EXPENSE' as const, isActive: true },
        { tenantId: options.tenantId, code: '6400', name: 'Office Supplies', accountType: 'EXPENSE' as const, isActive: true },
        { tenantId: options.tenantId, code: '6500', name: 'Depreciation Expense', accountType: 'EXPENSE' as const, isActive: true },
        { tenantId: options.tenantId, code: '6900', name: 'Other Expenses', accountType: 'EXPENSE' as const, isActive: true },
      ];

      await tx.insert(accounts).values(coaEntries).onConflictDoNothing();
      console.log(`    ✓ COA: ${coaEntries.length} accounts`);

      // ─── Fiscal Year & Periods ───────────────────────────────────
      await tx
        .insert(fiscalYears)
        .values({
          tenantId: options.tenantId,
          name: 'FY2025',
          startDate: new Date('2025-01-01T00:00:00Z'),
          endDate: new Date('2025-12-31T23:59:59Z'),
        })
        .onConflictDoNothing();

      const [fy] = await tx.query.fiscalYears.findMany({
        where: (f, { eq }) => eq(f.tenantId, options.tenantId),
        limit: 1
      });

      if (fy) {
        const periodValues = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const start = new Date(Date.UTC(2025, i, 1));
          const end = new Date(Date.UTC(2025, i + 1, 0, 23, 59, 59));
          return {
            tenantId: options.tenantId,
            fiscalYearId: fy.id,
            name: fiscalPeriodCode(2025, month),
            periodNumber: month,
            startDate: start,
            endDate: end,
            status: 'OPEN' as const,
          };
        });
        await tx.insert(fiscalPeriods).values(periodValues).onConflictDoNothing();
        console.log(`    ✓ Fiscal periods: 12 (FY2025)`);
      }

      // ─── Ledgers ─────────────────────────────────────────────────
      await tx
        .insert(ledgers)
        .values({
          tenantId: options.tenantId,
          companyId: options.companyId,
          name: 'General Ledger',
          currencyId: options.currencyId,
          isDefault: true,
        })
        .onConflictDoNothing();
      console.log(`    ✓ Ledger: General Ledger`);

      // ─── Tax Codes ───────────────────────────────────────────────
      await tx
        .insert(taxCodes)
        .values([
          { 
            tenantId: options.tenantId, 
            companyId: options.companyId,
            code: 'VAT-STANDARD', 
            name: 'VAT Standard Rate', 
            rate: 20.0,
            taxType: 'OUTPUT',
            isActive: true,
          },
          { 
            tenantId: options.tenantId, 
            companyId: options.companyId,
            code: 'VAT-REDUCED', 
            name: 'VAT Reduced Rate', 
            rate: 5.0,
            taxType: 'OUTPUT',
            isActive: true,
          },
          { 
            tenantId: options.tenantId, 
            companyId: options.companyId,
            code: 'VAT-INPUT', 
            name: 'VAT Input (Reclaimable)', 
            rate: 20.0,
            taxType: 'INPUT',
            isActive: true,
          },
        ])
        .onConflictDoNothing();
      console.log(`    ✓ Tax codes: 3`);

      // ─── Payment Terms ───────────────────────────────────────────
      await tx
        .insert(paymentTerms)
        .values([
          { 
            tenantId: options.tenantId, 
            code: 'NET30', 
            name: 'Net 30 Days', 
            days: 30,
            isActive: true,
          },
          { 
            tenantId: options.tenantId, 
            code: 'NET60', 
            name: 'Net 60 Days', 
            days: 60,
            isActive: true,
          },
          { 
            tenantId: options.tenantId, 
            code: 'DUE-ON-RECEIPT', 
            name: 'Due on Receipt', 
            days: 0,
            isActive: true,
          },
        ])
        .onConflictDoNothing();
      console.log(`    ✓ Payment terms: 3`);

      // ─── Customers (drizzle-seed) ────────────────────────────────
      const customerCount = options.customerCount ?? 50;
      await seed(tx, { customers }, { 
        count: customerCount, 
        seed: options.seed 
      });
      console.log(`    ✓ Customers: ${customerCount}`);

      // ─── Suppliers (drizzle-seed) ────────────────────────────────
      const supplierCount = options.supplierCount ?? 30;
      await seed(tx, { suppliers }, { 
        count: supplierCount, 
        seed: options.seed + 1000  // Different seed for variety
      });
      console.log(`    ✓ Suppliers: ${supplierCount}`);
    }
  );

  console.log(`  ✅ Master data seeded successfully`);
}
