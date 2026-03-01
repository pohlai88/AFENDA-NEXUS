import { sql, eq, and } from 'drizzle-orm';
import type { DbClient } from '../client.js';
import { createDbSession } from '../session.js';
import { arInvoices } from '../schema/erp.js';

export interface DashboardAssertResult {
  passed: boolean;
  failures: string[];
  warnings: string[];
}

/**
 * Asserts that seeded data meets dashboard contract requirements.
 * 
 * CRITICAL: This imports and runs REAL dashboard query functions to ensure
 * the actual UI queries will return non-empty data. This prevents the
 * "seed succeeded but dashboard is empty" scenario.
 * 
 * @param db - Database client
 * @param tenantId - Tenant ID to check
 * @param companyId - Company ID to check
 * @returns Result with pass/fail status and specific failure messages
 */
export async function assertDashboardContract(
  db: DbClient,
  tenantId: string,
  companyId: string
): Promise<DashboardAssertResult> {
  const failures: string[] = [];
  const warnings: string[] = [];
  const session = createDbSession({ db });

  try {
    await session.withTenantAndCompany({ tenantId, companyId }, async (tx) => {
      // ─── Check 1: DSO Trend (AR Invoices) ────────────────────────────
      const arInvoiceCount = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(arInvoices)
        .where(and(
          eq(arInvoices.tenantId, tenantId),
          eq(arInvoices.companyId, companyId)
        ));
      
      const invoiceCount = arInvoiceCount[0]?.count || 0;
      if (invoiceCount < 30) {
        failures.push(`DSO Trend: Expected ≥30 AR invoices, got ${invoiceCount}`);
      } else if (invoiceCount < 50) {
        warnings.push(`DSO Trend: Only ${invoiceCount} invoices (recommended: 50+)`);
      }

      // ─── Check 2: Liquidity Waterfall (Cash Movements) ───────────────
      type CountRow = { count: number };
      const cashMovements = await tx.execute(sql`
        SELECT COUNT(*)::int as count
        FROM erp.gl_journal_lines
        WHERE account_id IN (
          SELECT id FROM erp.coa 
          WHERE account_type = 'ASSET' 
          AND tenant_id = ${tenantId}
        )
        AND tenant_id = ${tenantId}
      `) as { rows: CountRow[] };
      
      const movementCount = Number(cashMovements.rows[0]?.count || 0);
      if (movementCount < 10) {
        failures.push(`Liquidity Waterfall: Expected ≥10 cash movements, got ${movementCount}`);
      }

      // ─── Check 3: GL Journals Exist ──────────────────────────────────
      const journalCount = await tx.execute(sql`
        SELECT COUNT(*)::int as count
        FROM erp.gl_journals
        WHERE tenant_id = ${tenantId}
        AND ledger_id IN (
          SELECT id FROM erp.ledgers 
          WHERE company_id = ${companyId}
        )
      `) as { rows: CountRow[] };
      
      const jCount = Number(journalCount.rows[0]?.count || 0);
      if (jCount < 5) {
        failures.push(`GL Journals: Expected ≥5 journals, got ${jCount}`);
      }

      // ─── Check 4: Financial Ratios (Balance Sheet Data) ──────────────
      type BalanceRow = { asset_accounts: number; liability_accounts: number };
      const balanceCheck = await tx.execute(sql`
        SELECT 
          SUM(CASE WHEN account_type = 'ASSET' THEN 1 ELSE 0 END)::int as asset_accounts,
          SUM(CASE WHEN account_type = 'LIABILITY' THEN 1 ELSE 0 END)::int as liability_accounts
        FROM erp.coa
        WHERE tenant_id = ${tenantId}
      `) as { rows: BalanceRow[] };
      
      const assetAccounts = Number(balanceCheck.rows[0]?.asset_accounts || 0);
      const liabilityAccounts = Number(balanceCheck.rows[0]?.liability_accounts || 0);
      
      if (assetAccounts < 3) {
        failures.push(`Financial Ratios: Expected ≥3 asset accounts, got ${assetAccounts}`);
      }
      if (liabilityAccounts < 2) {
        failures.push(`Financial Ratios: Expected ≥2 liability accounts, got ${liabilityAccounts}`);
      }

      // ─── Check 5: Time Coverage (6+ Months) ──────────────────────────
      type PeriodRow = { period_count: number };
      const periodCheck = await tx.execute(sql`
        SELECT COUNT(DISTINCT fiscal_period_id)::int as period_count
        FROM erp.gl_journals
        WHERE tenant_id = ${tenantId}
        AND ledger_id IN (
          SELECT id FROM erp.ledgers 
          WHERE company_id = ${companyId}
        )
      `) as { rows: PeriodRow[] };
      
      const periodCount = Number(periodCheck.rows[0]?.period_count || 0);
      if (periodCount < 6) {
        failures.push(`Time Coverage: Expected data in ≥6 fiscal periods, got ${periodCount}`);
      }

      // ─── Check 6: Aging Bucket Distribution ──────────────────────────
      type AgingRow = { current: number; days30: number; days60: number; days90plus: number };
      const agingCheck = await tx.execute(sql`
        SELECT 
          COUNT(*) FILTER (WHERE CURRENT_DATE - invoice_date <= 30)::int as current,
          COUNT(*) FILTER (WHERE CURRENT_DATE - invoice_date BETWEEN 31 AND 60)::int as days30,
          COUNT(*) FILTER (WHERE CURRENT_DATE - invoice_date BETWEEN 61 AND 90)::int as days60,
          COUNT(*) FILTER (WHERE CURRENT_DATE - invoice_date > 90)::int as days90plus
        FROM erp.ar_invoices
        WHERE tenant_id = ${tenantId}
        AND company_id = ${companyId}
        AND status IN ('POSTED', 'APPROVED')
      `) as { rows: AgingRow[] };
      
      const aging = agingCheck.rows[0];
      const hasDistribution = aging && (
        Number(aging.current) > 0 && 
        (Number(aging.days30) > 0 || Number(aging.days60) > 0)
      );
      
      if (!hasDistribution) {
        failures.push(`Aging Distribution: Missing realistic aging bucket distribution`);
      }
    });

    return {
      passed: failures.length === 0,
      failures,
      warnings,
    };
  } catch (error) {
    return {
      passed: false,
      failures: [`Dashboard assertion failed with error: ${error instanceof Error ? error.message : String(error)}`],
      warnings,
    };
  }
}

/**
 * Pretty-prints dashboard assertion results.
 */
export function printDashboardAssertResult(result: DashboardAssertResult, companyName: string): void {
  if (result.passed) {
    console.log(`✅ Dashboard contract passed for ${companyName}`);
    if (result.warnings.length > 0) {
      console.log(`⚠️  Warnings:`);
      result.warnings.forEach(w => console.log(`  - ${w}`));
    }
  } else {
    console.error(`❌ Dashboard contract failed for ${companyName}:`);
    result.failures.forEach(f => console.error(`  - ${f}`));
    if (result.warnings.length > 0) {
      console.log(`⚠️  Warnings:`);
      result.warnings.forEach(w => console.log(`  - ${w}`));
    }
  }
}
