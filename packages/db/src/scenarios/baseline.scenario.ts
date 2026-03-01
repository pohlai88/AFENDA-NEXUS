/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
import type { DbClient } from '../client.js';
import { createDbSession } from '../session.js';
import { 
  arInvoices, 
  arInvoiceLines,
  apInvoices,
  apInvoiceLines,
  glJournals,
  glJournalLines
} from '../schema/erp.js';
import { invoiceNumber, journalNumber } from '../utils/business-keys.js';

export interface BaselineScenarioOptions {
  seed: number;
  tenantId: string;
  companyId: string;
  months: number;
}

/**
 * Baseline scenario: Steady operations with realistic cash flow patterns.
 * 
 * Generates:
 * - 20-30 AR invoices per month
 * - 15-20 AP invoices per month
 * - Payroll journals (monthly)
 * - Depreciation journals (monthly)
 * 
 * Simulates normal business operations with:
 * - 80% invoices paid within terms
 * - 20% delayed payments (30-60 days)
 * - Realistic aging distribution
 */
export async function runBaselineScenario(
  db: DbClient,
  options: BaselineScenarioOptions
): Promise<void> {
  const session = createDbSession({ db });
  
  console.log(`📊 Running baseline scenario (${options.months} months)...`);

  await session.withTenantAndCompany(
    { tenantId: options.tenantId, companyId: options.companyId },
    async (tx) => {
      // Get fiscal periods
      const periods = await tx.query.fiscalPeriods.findMany({
        where: (p, { eq }) => eq(p.tenantId, options.tenantId),
        orderBy: (p, { asc }) => [asc(p.periodNumber)],
        limit: options.months
      });

      // Get accounts
      const accts = await tx.query.accounts.findMany({
        where: (a, { eq }) => eq(a.tenantId, options.tenantId)
      });

      const cashAcct = accts.find(a => a.code === '1000')!;
      const arAcct = accts.find(a => a.code === '1100')!;
      const apAcct = accts.find(a => a.code === '2000')!;
      const revenueAcct = accts.find(a => a.code === '4000')!;
      const cogsAcct = accts.find(a => a.code === '5000')!;
      const salariesAcct = accts.find(a => a.code === '6000')!;
      const depreciationAcct = accts.find(a => a.code === '6500')!;
      const accDepreciationAcct = accts.find(a => a.code === '1510')!;

      // Get customers and suppliers
      const customerList = await tx.query.customers.findMany({
        where: (c, { eq }) => eq(c.tenantId, options.tenantId),
        limit: 50
      });

      const supplierList = await tx.query.suppliers.findMany({
        where: (s, { eq }) => eq(s.tenantId, options.tenantId),
        limit: 30
      });

      if (customerList.length === 0 || supplierList.length === 0) {
        console.warn('    ⚠️  No customers or suppliers found. Run master data seed first.');
        return;
      }

      // Process each period
      for (const [periodIndex, period] of periods.entries()) {
        console.log(`    Period ${period.name}:`);
        
        // ─── AR Invoices (20-30 per month) ──────────────────────
        const arInvoiceCount = 20 + Math.floor(Math.random() * 11);
        const arInvoiceData: Array<typeof arInvoices.$inferInsert> = [];
        const arLineData: Array<typeof arInvoiceLines.$inferInsert> = [];
        
        for (let i = 0; i < arInvoiceCount; i++) {
          const customer = customerList[i % customerList.length]!;
          const invoiceDate = new Date(period.startDate);
          invoiceDate.setDate(invoiceDate.getDate() + Math.floor(Math.random() * 28));
          
          const dueDate = new Date(invoiceDate);
          dueDate.setDate(dueDate.getDate() + 30); // NET30
          
          const lineAmount = BigInt(Math.floor(1000 + Math.random() * 9000) * 100);
          const taxAmount = lineAmount * 20n / 100n; // 20% VAT
          const totalAmount = lineAmount + taxAmount;
          
          const invoiceId = crypto.randomUUID();
          
          arInvoiceData.push({
            id: invoiceId,
            tenantId: options.tenantId,
            companyId: options.companyId,
            customerId: customer.id,
            invoiceNumber: invoiceNumber('INV', 2025, periodIndex * 100 + i + 1),
            invoiceDate,
            dueDate,
            status: 'POSTED',
            currencyId: customer.currencyId || '',
            totalAmount,
            outstandingAmount: Math.random() < 0.8 ? 0n : totalAmount, // 80% paid
          });
          
          arLineData.push({
            id: crypto.randomUUID(),
            tenantId: options.tenantId,
            invoiceId,
            lineNumber: 1,
            description: 'Professional Services',
            quantity: 1,
            unitPrice: lineAmount,
            amount: lineAmount,
            taxAmount,
          });
        }

        if (arInvoiceData.length > 0) {
          await tx.insert(arInvoices).values(arInvoiceData).onConflictDoNothing();
          await tx.insert(arInvoiceLines).values(arLineData).onConflictDoNothing();
          console.log(`      ✓ AR Invoices: ${arInvoiceData.length}`);
        }

        // ─── AP Invoices (15-20 per month) ──────────────────────
        const apInvoiceCount = 15 + Math.floor(Math.random() * 6);
        const apInvoiceData: Array<typeof apInvoices.$inferInsert> = [];
        const apLineData: Array<typeof apInvoiceLines.$inferInsert> = [];
        
        for (let i = 0; i < apInvoiceCount; i++) {
          const supplier = supplierList[i % supplierList.length]!;
          const invoiceDate = new Date(period.startDate);
          invoiceDate.setDate(invoiceDate.getDate() + Math.floor(Math.random() * 28));
          
          const dueDate = new Date(invoiceDate);
          dueDate.setDate(dueDate.getDate() + 60); // NET60
          
          const lineAmount = BigInt(Math.floor(500 + Math.random() * 4500) * 100);
          const taxAmount = lineAmount * 20n / 100n;
          const totalAmount = lineAmount + taxAmount;
          
          const invoiceId = crypto.randomUUID();
          
          apInvoiceData.push({
            id: invoiceId,
            tenantId: options.tenantId,
            companyId: options.companyId,
            supplierId: supplier.id,
            invoiceNumber: invoiceNumber('BILL', 2025, periodIndex * 100 + i + 1),
            invoiceDate,
            dueDate,
            status: 'POSTED',
            currencyId: supplier.currencyId || '',
            totalAmount,
            outstandingAmount: Math.random() < 0.9 ? 0n : totalAmount, // 90% paid
          });
          
          apLineData.push({
            id: crypto.randomUUID(),
            tenantId: options.tenantId,
            invoiceId,
            lineNumber: 1,
            description: 'Operating Supplies',
            quantity: 1,
            unitPrice: lineAmount,
            amount: lineAmount,
            taxAmount,
          });
        }

        if (apInvoiceData.length > 0) {
          await tx.insert(apInvoices).values(apInvoiceData).onConflictDoNothing();
          await tx.insert(apInvoiceLines).values(apLineData).onConflictDoNothing();
          console.log(`      ✓ AP Invoices: ${apInvoiceData.length}`);
        }

        // ─── Payroll Journal (monthly) ───────────────────────────
        const payrollJournalId = crypto.randomUUID();
        const salaryAmount = 150000n * 100n; // $150,000/month
        
        await tx.insert(glJournals).values({
          id: payrollJournalId,
          tenantId: options.tenantId,
          ledgerId: '', // Will be set by domain service in production
          fiscalPeriodId: period.id,
          journalNumber: journalNumber('SAL', 2025, periodIndex + 1),
          documentType: 'JOURNAL',
          status: 'POSTED',
          description: 'Monthly payroll',
          postingDate: new Date(period.endDate),
          metadata: {},
        }).onConflictDoNothing();

        await tx.insert(glJournalLines).values([
          {
            id: crypto.randomUUID(),
            tenantId: options.tenantId,
            journalId: payrollJournalId,
            lineNumber: 1,
            accountId: salariesAcct.id,
            description: 'Salary expense',
            debit: salaryAmount,
            credit: 0n,
          },
          {
            id: crypto.randomUUID(),
            tenantId: options.tenantId,
            journalId: payrollJournalId,
            lineNumber: 2,
            accountId: cashAcct.id,
            description: 'Cash payment',
            debit: 0n,
            credit: salaryAmount,
          },
        ]).onConflictDoNothing();

        console.log(`      ✓ Payroll: $${Number(salaryAmount / 100n).toLocaleString()}`);

        // ─── Depreciation Journal (monthly) ──────────────────────
        const depreciationJournalId = crypto.randomUUID();
        const depreciationAmount = 5000n * 100n; // $5,000/month
        
        await tx.insert(glJournals).values({
          id: depreciationJournalId,
          tenantId: options.tenantId,
          ledgerId: '',
          fiscalPeriodId: period.id,
          journalNumber: journalNumber('DEP', 2025, periodIndex + 1),
          documentType: 'JOURNAL',
          status: 'POSTED',
          description: 'Monthly depreciation',
          postingDate: new Date(period.endDate),
          metadata: {},
        }).onConflictDoNothing();

        await tx.insert(glJournalLines).values([
          {
            id: crypto.randomUUID(),
            tenantId: options.tenantId,
            journalId: depreciationJournalId,
            lineNumber: 1,
            accountId: depreciationAcct.id,
            description: 'Depreciation expense',
            debit: depreciationAmount,
            credit: 0n,
          },
          {
            id: crypto.randomUUID(),
            tenantId: options.tenantId,
            journalId: depreciationJournalId,
            lineNumber: 2,
            accountId: accDepreciationAcct.id,
            description: 'Accumulated depreciation',
            debit: 0n,
            credit: depreciationAmount,
          },
        ]).onConflictDoNothing();

        console.log(`      ✓ Depreciation: $${Number(depreciationAmount / 100n).toLocaleString()}`);
      }
    }
  );

  console.log(`  ✅ Baseline scenario completed`);
}
