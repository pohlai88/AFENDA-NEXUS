import { describe, it, expect } from 'vitest';
import { computeInventoryValuation, type InventoryItem } from '../inventory-costing.js';

const makeItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  itemCode: 'ITEM-001',
  itemName: 'Widget A',
  costingMethod: 'WEIGHTED_AVERAGE',
  openingQuantity: 100n,
  openingCost: 10_000n, // 100 units × 100 each
  movements: [
    {
      movementId: 'M-1',
      date: '2025-01-15',
      type: 'PURCHASE',
      quantity: 50n,
      unitCost: 120n,
      totalCost: 6_000n,
    },
    {
      movementId: 'M-2',
      date: '2025-02-10',
      type: 'SALE',
      quantity: -80n,
      unitCost: 0n,
      totalCost: 0n,
    },
  ],
  netRealisableValue: 150n,
  currencyCode: 'MYR',
  ...overrides,
});

describe('computeInventoryValuation', () => {
  describe('Weighted Average', () => {
    it('computes closing balance using WAC', () => {
      const { result } = computeInventoryValuation({
        valuationDate: '2025-12-31',
        items: [makeItem()],
      });

      // Opening: 100 @ 100 = 10,000
      // Purchase: 50 @ 120 = 6,000
      // Total pool: 150 units, 16,000 cost → WAC = 106.67
      // Sale: 80 units → COGS = 80 × 106 = 8,480 (integer division)
      // Closing: 70 units
      expect(result.valuations[0]!.closingQuantity).toBe(70n);
      expect(result.valuations[0]!.cogsAmount).toBeGreaterThan(0n);
      expect(result.totalItems).toBe(1);
    });
  });

  describe('FIFO', () => {
    it('computes COGS using oldest cost first', () => {
      const { result } = computeInventoryValuation({
        valuationDate: '2025-12-31',
        items: [
          makeItem({
            costingMethod: 'FIFO',
            openingQuantity: 100n,
            openingCost: 10_000n, // 100 @ 100
            movements: [
              {
                movementId: 'M-1',
                date: '2025-01-15',
                type: 'PURCHASE',
                quantity: 50n,
                unitCost: 120n,
                totalCost: 6_000n,
              },
              {
                movementId: 'M-2',
                date: '2025-02-10',
                type: 'SALE',
                quantity: -80n,
                unitCost: 0n,
                totalCost: 0n,
              },
            ],
          }),
        ],
      });

      // FIFO: sell 80 from opening (100 @ 100)
      // COGS = 80 × 100 = 8,000
      expect(result.valuations[0]!.cogsAmount).toBe(8_000n);
      // Remaining: 20 @ 100 + 50 @ 120 = 2,000 + 6,000 = 8,000
      expect(result.valuations[0]!.closingQuantity).toBe(70n);
      expect(result.valuations[0]!.totalCost).toBe(8_000n);
    });

    it('exhausts first layer before moving to next', () => {
      const { result } = computeInventoryValuation({
        valuationDate: '2025-12-31',
        items: [
          makeItem({
            costingMethod: 'FIFO',
            openingQuantity: 30n,
            openingCost: 3_000n, // 30 @ 100
            movements: [
              {
                movementId: 'M-1',
                date: '2025-01-15',
                type: 'PURCHASE',
                quantity: 50n,
                unitCost: 120n,
                totalCost: 6_000n,
              },
              {
                movementId: 'M-2',
                date: '2025-02-10',
                type: 'SALE',
                quantity: -40n,
                unitCost: 0n,
                totalCost: 0n,
              },
            ],
          }),
        ],
      });

      // Sell 40: 30 from opening (30 × 100 = 3,000) + 10 from purchase (10 × 120 = 1,200)
      expect(result.valuations[0]!.cogsAmount).toBe(4_200n);
      // Remaining: 40 @ 120 = 4,800
      expect(result.valuations[0]!.closingQuantity).toBe(40n);
      expect(result.valuations[0]!.totalCost).toBe(4_800n);
    });
  });

  describe('Specific Identification', () => {
    it('tracks cost by batch', () => {
      const { result } = computeInventoryValuation({
        valuationDate: '2025-12-31',
        items: [
          makeItem({
            costingMethod: 'SPECIFIC_ID',
            openingQuantity: 0n,
            openingCost: 0n,
            movements: [
              {
                movementId: 'M-1',
                date: '2025-01',
                type: 'PURCHASE',
                quantity: 10n,
                unitCost: 100n,
                totalCost: 1_000n,
                batchId: 'BATCH-A',
              },
              {
                movementId: 'M-2',
                date: '2025-02',
                type: 'PURCHASE',
                quantity: 10n,
                unitCost: 200n,
                totalCost: 2_000n,
                batchId: 'BATCH-B',
              },
              {
                movementId: 'M-3',
                date: '2025-03',
                type: 'SALE',
                quantity: -5n,
                unitCost: 0n,
                totalCost: 0n,
                batchId: 'BATCH-B',
              },
            ],
          }),
        ],
      });

      // Sold 5 from BATCH-B @ 200 = COGS 1,000
      expect(result.valuations[0]!.cogsAmount).toBe(1_000n);
      // Remaining: BATCH-A 10 @ 100 + BATCH-B 5 @ 200 = 1,000 + 1,000 = 2,000
      expect(result.valuations[0]!.closingQuantity).toBe(15n);
      expect(result.valuations[0]!.totalCost).toBe(2_000n);
    });
  });

  describe('IAS 2: NRV Write-Down', () => {
    it('writes down when cost exceeds NRV', () => {
      const { result } = computeInventoryValuation({
        valuationDate: '2025-12-31',
        items: [
          makeItem({
            openingQuantity: 100n,
            openingCost: 20_000n, // 100 @ 200
            movements: [],
            netRealisableValue: 150n, // NRV per unit < cost per unit
          }),
        ],
      });

      // Cost: 20,000; NRV: 100 × 150 = 15,000; Write-down: 5,000
      expect(result.valuations[0]!.nrvWriteDown).toBe(5_000n);
      expect(result.valuations[0]!.carryingAmount).toBe(15_000n);
      expect(result.totalNrvWriteDown).toBe(5_000n);
    });

    it('no write-down when NRV exceeds cost', () => {
      const { result } = computeInventoryValuation({
        valuationDate: '2025-12-31',
        items: [
          makeItem({
            openingQuantity: 100n,
            openingCost: 10_000n,
            movements: [],
            netRealisableValue: 150n,
          }),
        ],
      });

      expect(result.valuations[0]!.nrvWriteDown).toBe(0n);
      expect(result.valuations[0]!.carryingAmount).toBe(10_000n);
    });
  });

  describe('COGS Journal', () => {
    it('generates COGS journal lines', () => {
      const { result } = computeInventoryValuation({
        valuationDate: '2025-12-31',
        items: [makeItem()],
      });

      expect(result.cogsJournalLines.length).toBeGreaterThanOrEqual(2);
      const cogsLine = result.cogsJournalLines.find((l) => l.accountCode === '5000');
      expect(cogsLine).toBeDefined();
      expect(cogsLine!.debit).toBe(result.totalCogs);
    });

    it('includes NRV write-down journal when applicable', () => {
      const { result } = computeInventoryValuation({
        valuationDate: '2025-12-31',
        items: [
          makeItem({
            openingQuantity: 100n,
            openingCost: 20_000n,
            movements: [],
            netRealisableValue: 150n,
          }),
        ],
      });

      const writeDownLine = result.cogsJournalLines.find((l) => l.accountCode === '5010');
      expect(writeDownLine).toBeDefined();
      expect(writeDownLine!.debit).toBe(5_000n);
    });
  });

  describe('Stock Count Reconciliation', () => {
    it('detects stock discrepancies', () => {
      const { result } = computeInventoryValuation({
        valuationDate: '2025-12-31',
        items: [makeItem({ movements: [] })], // closing = opening = 100
        stockCounts: [{ itemCode: 'ITEM-001', countedQuantity: 95n }],
      });

      expect(result.stockCountReconciliation).toHaveLength(1);
      expect(result.stockCountReconciliation[0]!.isDiscrepancy).toBe(true);
      expect(result.stockCountReconciliation[0]!.variance).toBe(-5n);
      expect(result.totalStockVariance).toBeGreaterThan(0n);
    });

    it('reports no discrepancy when counts match', () => {
      const { result } = computeInventoryValuation({
        valuationDate: '2025-12-31',
        items: [makeItem({ movements: [] })],
        stockCounts: [{ itemCode: 'ITEM-001', countedQuantity: 100n }],
      });

      expect(result.stockCountReconciliation[0]!.isDiscrepancy).toBe(false);
      expect(result.totalStockVariance).toBe(0n);
    });
  });

  it('handles multiple items', () => {
    const { result } = computeInventoryValuation({
      valuationDate: '2025-12-31',
      items: [makeItem({ itemCode: 'A' }), makeItem({ itemCode: 'B', costingMethod: 'FIFO' })],
    });

    expect(result.totalItems).toBe(2);
    expect(result.valuations).toHaveLength(2);
  });

  it('throws on empty items', () => {
    expect(() => computeInventoryValuation({ valuationDate: '2025-12-31', items: [] })).toThrow(
      'At least one inventory item'
    );
  });

  it('provides audit explanation', () => {
    const calc = computeInventoryValuation({
      valuationDate: '2025-12-31',
      items: [makeItem()],
    });

    expect(calc.explanation).toContain('Inventory valuation');
    expect(calc.explanation).toContain('1 items');
    expect(calc.explanation).toContain('COGS');
  });
});
