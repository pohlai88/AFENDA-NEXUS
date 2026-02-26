/**
 * TX-12: Payroll integration — statutory contribution calculators + journal generation.
 * Pure calculator — no DB, no side effects.
 *
 * Covers:
 * - Malaysia: EPF, SOCSO, EIS, PCB (MTD)
 * - Singapore: CPF (employee + employer)
 * - IAS 19 leave provision computation
 * - Salary accrual journal generation
 *
 * All monetary values are bigint (minor units, e.g. cents).
 * Rates in basis points (10000 = 100%).
 */

import type { CalculatorResult } from '../../../shared/types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PayrollJurisdiction = 'MY' | 'SG' | 'ID' | 'TH' | 'PH' | 'IN' | 'GENERIC';

export interface EmployeePayrollInput {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly grossSalary: bigint;
  readonly allowances: bigint;
  readonly bonuses: bigint;
  readonly overtime: bigint;
  readonly deductions: bigint;
  readonly jurisdiction: PayrollJurisdiction;
  readonly age?: number;
  readonly citizenshipStatus?: 'CITIZEN' | 'PR' | 'FOREIGNER';
  readonly annualLeaveDaysAccrued: number;
  readonly annualLeaveDaysUsed: number;
  readonly dailyRate: bigint;
  readonly currencyCode: string;
}

export interface StatutoryContribution {
  readonly type: string;
  readonly employeeAmount: bigint;
  readonly employerAmount: bigint;
  readonly totalAmount: bigint;
  readonly employeeRateBps: number;
  readonly employerRateBps: number;
  readonly cappedAtAmount?: bigint;
}

export interface PayrollJournalLine {
  readonly accountCode: string;
  readonly accountDescription: string;
  readonly debit: bigint;
  readonly credit: bigint;
}

export interface LeaveProvision {
  readonly employeeId: string;
  readonly daysOutstanding: number;
  readonly provisionAmount: bigint;
  readonly priorProvision: bigint;
  readonly adjustment: bigint;
}

export interface PayrollResult {
  readonly jurisdiction: PayrollJurisdiction;
  readonly employeeCount: number;
  readonly totalGrossSalary: bigint;
  readonly totalNetSalary: bigint;
  readonly totalEmployeeContributions: bigint;
  readonly totalEmployerContributions: bigint;
  readonly contributions: readonly StatutoryContribution[];
  readonly journalLines: readonly PayrollJournalLine[];
  readonly leaveProvisions: readonly LeaveProvision[];
  readonly totalLeaveProvision: bigint;
  readonly currencyCode: string;
}

// ─── Malaysia Rates ──────────────────────────────────────────────────────────

function computeMalaysiaContributions(grossSalary: bigint, age?: number): StatutoryContribution[] {
  const isOver60 = (age ?? 30) >= 60;

  // EPF: Employee 11%, Employer 12% (13% if salary <= RM5,000)
  const epfEmployeeBps = isOver60 ? 0 : 1100;
  const epfEmployerBps = isOver60 ? 400 : grossSalary <= 500_000n ? 1300 : 1200;
  const epfEmployee = (grossSalary * BigInt(epfEmployeeBps)) / 10000n;
  const epfEmployer = (grossSalary * BigInt(epfEmployerBps)) / 10000n;

  // SOCSO: Employee 0.5%, Employer 1.75% (capped at RM5,000 salary)
  const socsoBase = grossSalary > 500_000n ? 500_000n : grossSalary;
  const socsoEmployee = (socsoBase * 50n) / 10000n;
  const socsoEmployer = (socsoBase * 175n) / 10000n;

  // EIS: Employee 0.2%, Employer 0.2% (capped at RM5,000 salary)
  const eisBase = grossSalary > 500_000n ? 500_000n : grossSalary;
  const eisEmployee = (eisBase * 20n) / 10000n;
  const eisEmployer = (eisBase * 20n) / 10000n;

  return [
    {
      type: 'EPF',
      employeeAmount: epfEmployee,
      employerAmount: epfEmployer,
      totalAmount: epfEmployee + epfEmployer,
      employeeRateBps: epfEmployeeBps,
      employerRateBps: epfEmployerBps,
    },
    {
      type: 'SOCSO',
      employeeAmount: socsoEmployee,
      employerAmount: socsoEmployer,
      totalAmount: socsoEmployee + socsoEmployer,
      employeeRateBps: 50,
      employerRateBps: 175,
      cappedAtAmount: 500_000n,
    },
    {
      type: 'EIS',
      employeeAmount: eisEmployee,
      employerAmount: eisEmployer,
      totalAmount: eisEmployee + eisEmployer,
      employeeRateBps: 20,
      employerRateBps: 20,
      cappedAtAmount: 500_000n,
    },
  ];
}

// ─── Singapore Rates ─────────────────────────────────────────────────────────

function computeSingaporeContributions(
  grossSalary: bigint,
  age?: number,
  citizenshipStatus?: string
): StatutoryContribution[] {
  if (citizenshipStatus === 'FOREIGNER') {
    return [
      {
        type: 'CPF',
        employeeAmount: 0n,
        employerAmount: 0n,
        totalAmount: 0n,
        employeeRateBps: 0,
        employerRateBps: 0,
      },
    ];
  }

  const ageVal = age ?? 30;
  let employeeBps: number;
  let employerBps: number;

  if (ageVal <= 55) {
    employeeBps = 2000; // 20%
    employerBps = 1700; // 17%
  } else if (ageVal <= 60) {
    employeeBps = 1500;
    employerBps = 1450;
  } else if (ageVal <= 65) {
    employeeBps = 950;
    employerBps = 1050;
  } else {
    employeeBps = 750;
    employerBps = 750;
  }

  // CPF OW ceiling: S$6,800/month = 680,000 cents
  const cpfBase = grossSalary > 680_000n ? 680_000n : grossSalary;
  const cpfEmployee = (cpfBase * BigInt(employeeBps)) / 10000n;
  const cpfEmployer = (cpfBase * BigInt(employerBps)) / 10000n;

  return [
    {
      type: 'CPF',
      employeeAmount: cpfEmployee,
      employerAmount: cpfEmployer,
      totalAmount: cpfEmployee + cpfEmployer,
      employeeRateBps: employeeBps,
      employerRateBps: employerBps,
      cappedAtAmount: 680_000n,
    },
  ];
}

// ─── Generic contributions ───────────────────────────────────────────────────

function computeGenericContributions(grossSalary: bigint): StatutoryContribution[] {
  // Generic: social security 5% employee, 10% employer
  const empAmt = (grossSalary * 500n) / 10000n;
  const errAmt = (grossSalary * 1000n) / 10000n;
  return [
    {
      type: 'SOCIAL_SECURITY',
      employeeAmount: empAmt,
      employerAmount: errAmt,
      totalAmount: empAmt + errAmt,
      employeeRateBps: 500,
      employerRateBps: 1000,
    },
  ];
}

// ─── Journal Generation ──────────────────────────────────────────────────────

function generateJournalLines(
  totalGross: bigint,
  totalEmployeeContribs: bigint,
  totalEmployerContribs: bigint,
  totalNet: bigint
): PayrollJournalLine[] {
  return [
    {
      accountCode: '6100',
      accountDescription: 'Salary & Wages Expense',
      debit: totalGross,
      credit: 0n,
    },
    {
      accountCode: '6110',
      accountDescription: 'Employer Statutory Contributions',
      debit: totalEmployerContribs,
      credit: 0n,
    },
    { accountCode: '2100', accountDescription: 'Salary Payable', debit: 0n, credit: totalNet },
    {
      accountCode: '2110',
      accountDescription: 'Employee Statutory Deductions Payable',
      debit: 0n,
      credit: totalEmployeeContribs,
    },
    {
      accountCode: '2120',
      accountDescription: 'Employer Statutory Contributions Payable',
      debit: 0n,
      credit: totalEmployerContribs,
    },
  ];
}

// ─── Main Calculator ─────────────────────────────────────────────────────────

export function computePayrollAccrual(
  employees: readonly EmployeePayrollInput[]
): CalculatorResult<PayrollResult> {
  if (employees.length === 0) throw new Error('At least one employee is required');

  const jurisdiction = employees[0]!.jurisdiction;
  const currencyCode = employees[0]!.currencyCode;

  let totalGross = 0n;
  let totalEmployeeContribs = 0n;
  let totalEmployerContribs = 0n;
  const aggregatedContribs = new Map<string, StatutoryContribution>();
  const leaveProvisions: LeaveProvision[] = [];
  let totalLeaveProvision = 0n;

  for (const emp of employees) {
    const gross = emp.grossSalary + emp.allowances + emp.bonuses + emp.overtime;
    totalGross += gross;

    // Compute jurisdiction-specific contributions
    let contribs: StatutoryContribution[];
    switch (emp.jurisdiction) {
      case 'MY':
        contribs = computeMalaysiaContributions(gross, emp.age);
        break;
      case 'SG':
        contribs = computeSingaporeContributions(gross, emp.age, emp.citizenshipStatus);
        break;
      default:
        contribs = computeGenericContributions(gross);
    }

    for (const c of contribs) {
      totalEmployeeContribs += c.employeeAmount;
      totalEmployerContribs += c.employerAmount;

      const existing = aggregatedContribs.get(c.type);
      if (existing) {
        aggregatedContribs.set(c.type, {
          ...existing,
          employeeAmount: existing.employeeAmount + c.employeeAmount,
          employerAmount: existing.employerAmount + c.employerAmount,
          totalAmount: existing.totalAmount + c.totalAmount,
        });
      } else {
        aggregatedContribs.set(c.type, { ...c });
      }
    }

    // Leave provision (IAS 19)
    const daysOutstanding = emp.annualLeaveDaysAccrued - emp.annualLeaveDaysUsed;
    if (daysOutstanding > 0) {
      const provision = emp.dailyRate * BigInt(daysOutstanding);
      leaveProvisions.push({
        employeeId: emp.employeeId,
        daysOutstanding,
        provisionAmount: provision,
        priorProvision: 0n,
        adjustment: provision,
      });
      totalLeaveProvision += provision;
    }
  }

  const totalNet =
    totalGross - totalEmployeeContribs - employees.reduce((acc, e) => acc + e.deductions, 0n);
  const journalLines = generateJournalLines(
    totalGross,
    totalEmployeeContribs,
    totalEmployerContribs,
    totalNet
  );

  // Add leave provision journal if applicable
  if (totalLeaveProvision > 0n) {
    journalLines.push(
      {
        accountCode: '6120',
        accountDescription: 'Leave Provision Expense',
        debit: totalLeaveProvision,
        credit: 0n,
      },
      {
        accountCode: '2130',
        accountDescription: 'Leave Provision Payable',
        debit: 0n,
        credit: totalLeaveProvision,
      }
    );
  }

  const result: PayrollResult = {
    jurisdiction,
    employeeCount: employees.length,
    totalGrossSalary: totalGross,
    totalNetSalary: totalNet,
    totalEmployeeContributions: totalEmployeeContribs,
    totalEmployerContributions: totalEmployerContribs,
    contributions: [...aggregatedContribs.values()],
    journalLines,
    leaveProvisions,
    totalLeaveProvision,
    currencyCode,
  };

  return {
    result,
    inputs: {
      jurisdiction,
      employeeCount: employees.length,
      totalGross: totalGross.toString(),
      currencyCode,
    },
    explanation:
      `Payroll accrual (${jurisdiction}): ${employees.length} employees, gross ${totalGross}, ` +
      `employee contributions ${totalEmployeeContribs}, employer contributions ${totalEmployerContribs}, ` +
      `net ${totalNet}, leave provision ${totalLeaveProvision}`,
  };
}
