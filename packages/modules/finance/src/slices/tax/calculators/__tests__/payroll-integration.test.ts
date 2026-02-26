import { describe, it, expect } from 'vitest';
import { computePayrollAccrual, type EmployeePayrollInput } from '../payroll-integration.js';

const myEmployee: EmployeePayrollInput = {
  employeeId: 'EMP-001',
  employeeName: 'Ali bin Ahmad',
  grossSalary: 500_000n, // RM5,000
  allowances: 50_000n,
  bonuses: 0n,
  overtime: 0n,
  deductions: 0n,
  jurisdiction: 'MY',
  age: 35,
  citizenshipStatus: 'CITIZEN',
  annualLeaveDaysAccrued: 14,
  annualLeaveDaysUsed: 10,
  dailyRate: 23_000n,
  currencyCode: 'MYR',
};

const sgEmployee: EmployeePayrollInput = {
  ...myEmployee,
  employeeId: 'EMP-002',
  employeeName: 'Tan Wei Lin',
  grossSalary: 600_000n, // S$6,000
  allowances: 0n,
  jurisdiction: 'SG',
  currencyCode: 'SGD',
};

describe('computePayrollAccrual', () => {
  describe('Malaysia', () => {
    it('computes EPF contributions', () => {
      const { result } = computePayrollAccrual([myEmployee]);

      const epf = result.contributions.find((c) => c.type === 'EPF');
      expect(epf).toBeDefined();
      // Gross = 550,000 (salary + allowances)
      // Employee 11%: 60,500; Employer 13% (<=RM5,000 threshold based on gross): 71,500
      expect(epf!.employeeAmount).toBeGreaterThan(0n);
      expect(epf!.employerAmount).toBeGreaterThan(0n);
      expect(epf!.employerRateBps).toBe(1200); // gross > 500,000
    });

    it('computes SOCSO contributions (capped at RM5,000)', () => {
      const { result } = computePayrollAccrual([myEmployee]);

      const socso = result.contributions.find((c) => c.type === 'SOCSO');
      expect(socso).toBeDefined();
      expect(socso!.cappedAtAmount).toBe(500_000n);
    });

    it('computes EIS contributions', () => {
      const { result } = computePayrollAccrual([myEmployee]);

      const eis = result.contributions.find((c) => c.type === 'EIS');
      expect(eis).toBeDefined();
      expect(eis!.employeeRateBps).toBe(20);
      expect(eis!.employerRateBps).toBe(20);
    });
  });

  describe('Singapore', () => {
    it('computes CPF contributions', () => {
      const { result } = computePayrollAccrual([sgEmployee]);

      const cpf = result.contributions.find((c) => c.type === 'CPF');
      expect(cpf).toBeDefined();
      expect(cpf!.employeeRateBps).toBe(2000); // 20% for age <= 55
      expect(cpf!.employerRateBps).toBe(1700); // 17%
      expect(cpf!.cappedAtAmount).toBe(680_000n);
    });

    it('skips CPF for foreigners', () => {
      const { result } = computePayrollAccrual([{ ...sgEmployee, citizenshipStatus: 'FOREIGNER' }]);

      const cpf = result.contributions.find((c) => c.type === 'CPF');
      expect(cpf!.employeeAmount).toBe(0n);
      expect(cpf!.employerAmount).toBe(0n);
    });

    it('uses lower rates for older employees', () => {
      const { result } = computePayrollAccrual([{ ...sgEmployee, age: 58 }]);

      const cpf = result.contributions.find((c) => c.type === 'CPF');
      expect(cpf!.employeeRateBps).toBe(1500); // reduced for 56-60
    });
  });

  describe('General', () => {
    it('generates salary accrual journal lines', () => {
      const { result } = computePayrollAccrual([myEmployee]);

      expect(result.journalLines.length).toBeGreaterThanOrEqual(5);
      const salaryExpense = result.journalLines.find((l) => l.accountCode === '6100');
      expect(salaryExpense).toBeDefined();
      expect(salaryExpense!.debit).toBe(result.totalGrossSalary);
    });

    it('computes leave provision (IAS 19)', () => {
      const { result } = computePayrollAccrual([myEmployee]);

      // 14 accrued - 10 used = 4 days × RM230 daily rate = RM920
      expect(result.leaveProvisions).toHaveLength(1);
      expect(result.leaveProvisions[0]!.daysOutstanding).toBe(4);
      expect(result.leaveProvisions[0]!.provisionAmount).toBe(92_000n);
      expect(result.totalLeaveProvision).toBe(92_000n);
    });

    it('generates leave provision journal entries', () => {
      const { result } = computePayrollAccrual([myEmployee]);

      const leaveExpense = result.journalLines.find((l) => l.accountCode === '6120');
      expect(leaveExpense).toBeDefined();
      expect(leaveExpense!.debit).toBe(92_000n);
    });

    it('handles multiple employees', () => {
      const { result } = computePayrollAccrual([
        myEmployee,
        { ...myEmployee, employeeId: 'EMP-002' },
      ]);

      expect(result.employeeCount).toBe(2);
      expect(result.totalGrossSalary).toBe(1_100_000n);
    });

    it('computes net salary', () => {
      const { result } = computePayrollAccrual([myEmployee]);

      expect(result.totalNetSalary).toBeLessThan(result.totalGrossSalary);
      expect(result.totalNetSalary).toBe(
        result.totalGrossSalary - result.totalEmployeeContributions
      );
    });

    it('throws on empty employees', () => {
      expect(() => computePayrollAccrual([])).toThrow('At least one employee');
    });

    it('provides audit explanation', () => {
      const calc = computePayrollAccrual([myEmployee]);

      expect(calc.explanation).toContain('Payroll accrual');
      expect(calc.explanation).toContain('MY');
      expect(calc.explanation).toContain('1 employees');
      expect(calc.explanation).toContain('leave provision');
    });
  });
});
