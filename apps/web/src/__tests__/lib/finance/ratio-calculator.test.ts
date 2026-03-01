import { describe, it, expect } from 'vitest';
import {
  calculateCurrentRatio,
  calculateQuickRatio,
  calculateDSO,
  calculateDPO,
  calculateDIO,
  calculateCashConversionCycle,
  calculateDebtToEquity,
  calculateROA,
  calculateROE,
  calculateWorkingCapital,
  calculateBudgetVariance,
  isVarianceFavorable,
  calculateHedgeEffectiveness,
  isHedgeEffective,
} from '@/lib/finance/ratio-calculator';

describe('Financial Ratio Calculator', () => {
  describe('calculateCurrentRatio', () => {
    it('should calculate current ratio correctly', () => {
      expect(calculateCurrentRatio(2000000, 800000)).toBe(2.5);
    });

    it('should return 0 when liabilities are 0', () => {
      expect(calculateCurrentRatio(2000000, 0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(calculateCurrentRatio(1000000, 1500000)).toBeCloseTo(0.667, 2);
    });
  });

  describe('calculateQuickRatio', () => {
    it('should calculate quick ratio correctly', () => {
      expect(calculateQuickRatio(2000000, 500000, 800000)).toBe(1.875);
    });

    it('should return 0 when liabilities are 0', () => {
      expect(calculateQuickRatio(2000000, 500000, 0)).toBe(0);
    });
  });

  describe('calculateDSO', () => {
    it('should calculate DSO correctly', () => {
      expect(calculateDSO(850000, 10000000, 365)).toBeCloseTo(31.025, 2);
    });

    it('should return 0 when revenue is 0', () => {
      expect(calculateDSO(850000, 0, 365)).toBe(0);
    });

    it('should use 365 days by default', () => {
      const result = calculateDSO(850000, 10000000);
      expect(result).toBeCloseTo(31.025, 2);
    });

    it('should handle monthly DSO calculation', () => {
      expect(calculateDSO(850000, 10000000, 30)).toBeCloseTo(2.55, 2);
    });
  });

  describe('calculateDPO', () => {
    it('should calculate DPO correctly', () => {
      expect(calculateDPO(500000, 6000000, 365)).toBeCloseTo(30.42, 2);
    });

    it('should return 0 when COGS is 0', () => {
      expect(calculateDPO(500000, 0, 365)).toBe(0);
    });
  });

  describe('calculateDIO', () => {
    it('should calculate DIO correctly', () => {
      expect(calculateDIO(1000000, 6000000, 365)).toBeCloseTo(60.83, 2);
    });

    it('should return 0 when COGS is 0', () => {
      expect(calculateDIO(1000000, 0, 365)).toBe(0);
    });
  });

  describe('calculateCashConversionCycle', () => {
    it('should calculate cash conversion cycle correctly', () => {
      const dso = 30;
      const dio = 60;
      const dpo = 45;
      expect(calculateCashConversionCycle(dso, dio, dpo)).toBe(45);
    });

    it('should handle negative cycle', () => {
      const dso = 30;
      const dio = 40;
      const dpo = 80;
      expect(calculateCashConversionCycle(dso, dio, dpo)).toBe(-10);
    });
  });

  describe('calculateDebtToEquity', () => {
    it('should calculate debt-to-equity ratio correctly', () => {
      expect(calculateDebtToEquity(3000000, 5000000)).toBe(0.6);
    });

    it('should return 0 when equity is 0', () => {
      expect(calculateDebtToEquity(3000000, 0)).toBe(0);
    });
  });

  describe('calculateROA', () => {
    it('should calculate ROA correctly', () => {
      expect(calculateROA(1000000, 10000000)).toBe(0.1);
    });

    it('should return 0 when assets are 0', () => {
      expect(calculateROA(1000000, 0)).toBe(0);
    });
  });

  describe('calculateROE', () => {
    it('should calculate ROE correctly', () => {
      expect(calculateROE(1000000, 5000000)).toBe(0.2);
    });

    it('should return 0 when equity is 0', () => {
      expect(calculateROE(1000000, 0)).toBe(0);
    });
  });

  describe('calculateWorkingCapital', () => {
    it('should calculate working capital correctly', () => {
      expect(calculateWorkingCapital(2000000, 800000)).toBe(1200000);
    });

    it('should handle negative working capital', () => {
      expect(calculateWorkingCapital(800000, 2000000)).toBe(-1200000);
    });
  });

  describe('calculateBudgetVariance', () => {
    it('should calculate positive variance correctly', () => {
      expect(calculateBudgetVariance(1200000, 1000000)).toBe(20);
    });

    it('should calculate negative variance correctly', () => {
      expect(calculateBudgetVariance(800000, 1000000)).toBe(-20);
    });

    it('should return 0 when budget is 0', () => {
      expect(calculateBudgetVariance(1000000, 0)).toBe(0);
    });

    it('should return 0 when actual equals budget', () => {
      expect(calculateBudgetVariance(1000000, 1000000)).toBe(0);
    });
  });

  describe('isVarianceFavorable', () => {
    it('should mark over-budget revenue as favorable', () => {
      expect(isVarianceFavorable(1200000, 1000000, 'revenue')).toBe(true);
    });

    it('should mark under-budget revenue as unfavorable', () => {
      expect(isVarianceFavorable(800000, 1000000, 'revenue')).toBe(false);
    });

    it('should mark under-budget expense as favorable', () => {
      expect(isVarianceFavorable(800000, 1000000, 'expense')).toBe(true);
    });

    it('should mark over-budget expense as unfavorable', () => {
      expect(isVarianceFavorable(1200000, 1000000, 'expense')).toBe(false);
    });

    it('should handle zero variance', () => {
      expect(isVarianceFavorable(1000000, 1000000, 'revenue')).toBe(false);
      expect(isVarianceFavorable(1000000, 1000000, 'expense')).toBe(false);
    });
  });

  describe('calculateHedgeEffectiveness', () => {
    it('should calculate effectiveness correctly for perfect hedge', () => {
      expect(calculateHedgeEffectiveness(-100000, 100000)).toBe(100);
    });

    it('should calculate effectiveness for partial hedge', () => {
      expect(calculateHedgeEffectiveness(-80000, 100000)).toBe(80);
    });

    it('should calculate effectiveness for over-hedge', () => {
      expect(calculateHedgeEffectiveness(-120000, 100000)).toBe(120);
    });

    it('should return 0 when hedged item change is 0', () => {
      expect(calculateHedgeEffectiveness(-100000, 0)).toBe(0);
    });

    it('should handle same-sign changes (ineffective hedge)', () => {
      expect(calculateHedgeEffectiveness(100000, 100000)).toBe(100);
    });
  });

  describe('isHedgeEffective', () => {
    it('should return true for effectiveness within 80-125% range', () => {
      expect(isHedgeEffective(80)).toBe(true);
      expect(isHedgeEffective(100)).toBe(true);
      expect(isHedgeEffective(125)).toBe(true);
    });

    it('should return false for effectiveness outside range', () => {
      expect(isHedgeEffective(79.9)).toBe(false);
      expect(isHedgeEffective(125.1)).toBe(false);
      expect(isHedgeEffective(50)).toBe(false);
      expect(isHedgeEffective(150)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isHedgeEffective(0)).toBe(false);
      expect(isHedgeEffective(80)).toBe(true);
      expect(isHedgeEffective(125)).toBe(true);
    });
  });
});
