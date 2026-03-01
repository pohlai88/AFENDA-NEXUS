/**
 * GL-13: Inventory costing & valuation calculator (IAS 2).
 * Pure calculator — no DB, no side effects.
 *
 * Supports:
 * - Weighted Average Cost (WAC)
 * - FIFO (First In, First Out)
 * - Specific Identification
 * - IAS 2: Lower of cost and Net Realisable Value (NRV)
 * - COGS journal generation
 * - Stock count reconciliation
 * - WIP valuation (basic)
 *
 * All monetary values are bigint (minor units).
 * Quantities in integer units (×10000 for fractional).
 */

import type { CalculatorResult } from '../../../shared/types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CostingMethod = 'WEIGHTED_AVERAGE' | 'FIFO' | 'SPECIFIC_ID';

export interface InventoryMovement {
  readonly movementId: string;
  readonly date: string;
  readonly type: 'PURCHASE' | 'SALE' | 'RETURN_IN' | 'RETURN_OUT' | 'ADJUSTMENT';
  readonly quantity: bigint; // positive for in, negative for out
  readonly unitCost: bigint; // per unit, minor units
  readonly totalCost: bigint;
  readonly batchId?: string; // for specific identification
  readonly description?: string;
}

export interface InventoryItem {
  readonly itemCode: string;
  readonly itemName: string;
  readonly costingMethod: CostingMethod;
  readonly openingQuantity: bigint;
  readonly openingCost: bigint;
  readonly movements: readonly InventoryMovement[];
  readonly netRealisableValue: bigint; // per unit NRV
  readonly currencyCode: string;
}

export interface InventoryValuationLine {
  readonly itemCode: string;
  readonly itemName: string;
  readonly closingQuantity: bigint;
  readonly unitCost: bigint;
  readonly totalCost: bigint;
  readonly nrv: bigint; // total NRV
  readonly nrvWriteDown: bigint;
  readonly carryingAmount: bigint; // lower of cost and NRV
  readonly cogsAmount: bigint;
}

export interface StockCountLine {
  readonly itemCode: string;
  readonly systemQuantity: bigint;
  readonly countedQuantity: bigint;
  readonly variance: bigint;
  readonly varianceValue: bigint;
  readonly isDiscrepancy: boolean;
}

export interface InventoryJournalLine {
  readonly accountCode: string;
  readonly accountDescription: string;
  readonly debit: bigint;
  readonly credit: bigint;
}

export interface InventoryResult {
  readonly valuationDate: string;
  readonly totalItems: number;
  readonly valuations: readonly InventoryValuationLine[];
  readonly totalClosingCost: bigint;
  readonly totalNrvWriteDown: bigint;
  readonly totalCarryingAmount: bigint;
  readonly totalCogs: bigint;
  readonly cogsJournalLines: readonly InventoryJournalLine[];
  readonly stockCountReconciliation: readonly StockCountLine[];
  readonly totalStockVariance: bigint;
  readonly currencyCode: string;
}

// ─── Costing Methods ─────────────────────────────────────────────────────────

function computeWeightedAverage(
  openingQty: bigint,
  openingCost: bigint,
  movements: readonly InventoryMovement[]
): { closingQty: bigint; closingCost: bigint; cogs: bigint; unitCost: bigint } {
  let totalQty = openingQty;
  let totalCost = openingCost;
  let cogs = 0n;

  for (const m of movements) {
    if (m.type === 'PURCHASE' || m.type === 'RETURN_IN') {
      totalQty += m.quantity;
      totalCost += m.totalCost;
    } else if (m.type === 'SALE' || m.type === 'RETURN_OUT') {
      const absQty = m.quantity < 0n ? -m.quantity : m.quantity;
      if (totalQty > 0n) {
        const wac = totalCost / totalQty;
        const movementCogs = wac * absQty;
        cogs += movementCogs;
        totalQty -= absQty;
        totalCost -= movementCogs;
      }
    } else if (m.type === 'ADJUSTMENT') {
      totalQty += m.quantity;
      totalCost += m.totalCost;
    }
  }

  const unitCost = totalQty > 0n ? totalCost / totalQty : 0n;

  return { closingQty: totalQty, closingCost: totalCost < 0n ? 0n : totalCost, cogs, unitCost };
}

function computeFifo(
  openingQty: bigint,
  openingCost: bigint,
  movements: readonly InventoryMovement[]
): { closingQty: bigint; closingCost: bigint; cogs: bigint; unitCost: bigint } {
  // FIFO layers: [{ qty, unitCost }]
  const layers: { qty: bigint; unitCost: bigint }[] = [];

  // Opening balance as first layer
  if (openingQty > 0n) {
    const openingUnitCost = openingCost / openingQty;
    layers.push({ qty: openingQty, unitCost: openingUnitCost });
  }

  let cogs = 0n;

  for (const m of movements) {
    if (m.type === 'PURCHASE' || m.type === 'RETURN_IN') {
      const qty = m.quantity > 0n ? m.quantity : -m.quantity;
      layers.push({ qty, unitCost: m.unitCost });
    } else if (m.type === 'SALE' || m.type === 'RETURN_OUT') {
      let remaining = m.quantity < 0n ? -m.quantity : m.quantity;

      while (remaining > 0n && layers.length > 0) {
        const layer = layers[0]!;
        if (layer.qty <= remaining) {
          cogs += layer.qty * layer.unitCost;
          remaining -= layer.qty;
          layers.shift();
        } else {
          cogs += remaining * layer.unitCost;
          layers[0] = { qty: layer.qty - remaining, unitCost: layer.unitCost };
          remaining = 0n;
        }
      }
    } else if (m.type === 'ADJUSTMENT') {
      const qty = m.quantity > 0n ? m.quantity : -m.quantity;
      if (m.quantity > 0n) {
        layers.push({ qty, unitCost: m.unitCost });
      } else {
        // Negative adjustment: remove from oldest
        let rem = qty;
        while (rem > 0n && layers.length > 0) {
          const layer = layers[0]!;
          if (layer.qty <= rem) {
            rem -= layer.qty;
            layers.shift();
          } else {
            layers[0] = { qty: layer.qty - rem, unitCost: layer.unitCost };
            rem = 0n;
          }
        }
      }
    }
  }

  let closingQty = 0n;
  let closingCost = 0n;
  for (const layer of layers) {
    closingQty += layer.qty;
    closingCost += layer.qty * layer.unitCost;
  }

  const unitCost = closingQty > 0n ? closingCost / closingQty : 0n;

  return { closingQty, closingCost, cogs, unitCost };
}

function computeSpecificId(
  openingQty: bigint,
  openingCost: bigint,
  movements: readonly InventoryMovement[]
): { closingQty: bigint; closingCost: bigint; cogs: bigint; unitCost: bigint } {
  // Each movement with a batchId is tracked individually
  const batches = new Map<string, { qty: bigint; cost: bigint }>();

  if (openingQty > 0n) {
    batches.set('OPENING', { qty: openingQty, cost: openingCost });
  }

  let cogs = 0n;

  for (const m of movements) {
    const batchId = m.batchId ?? m.movementId;

    if (m.type === 'PURCHASE' || m.type === 'RETURN_IN') {
      const existing = batches.get(batchId);
      if (existing) {
        batches.set(batchId, { qty: existing.qty + m.quantity, cost: existing.cost + m.totalCost });
      } else {
        batches.set(batchId, { qty: m.quantity, cost: m.totalCost });
      }
    } else if (m.type === 'SALE' || m.type === 'RETURN_OUT') {
      const existing = batches.get(batchId);
      if (existing) {
        const absQty = m.quantity < 0n ? -m.quantity : m.quantity;
        const unitCost = existing.qty > 0n ? existing.cost / existing.qty : 0n;
        const moveCogs = unitCost * absQty;
        cogs += moveCogs;
        batches.set(batchId, {
          qty: existing.qty - absQty,
          cost: existing.cost - moveCogs,
        });
        if (existing.qty - absQty <= 0n) batches.delete(batchId);
      }
    }
  }

  let closingQty = 0n;
  let closingCost = 0n;
  for (const b of batches.values()) {
    closingQty += b.qty;
    closingCost += b.cost;
  }

  const unitCost = closingQty > 0n ? closingCost / closingQty : 0n;

  return { closingQty, closingCost, cogs, unitCost };
}

// ─── Main Calculator ─────────────────────────────────────────────────────────

export interface InventoryInput {
  readonly valuationDate: string;
  readonly items: readonly InventoryItem[];
  readonly stockCounts?: readonly { itemCode: string; countedQuantity: bigint }[];
}

export function computeInventoryValuation(
  input: InventoryInput
): CalculatorResult<InventoryResult> {
  if (input.items.length === 0) throw new Error('At least one inventory item is required');

  const valuations: InventoryValuationLine[] = [];
  const stockLines: StockCountLine[] = [];
  let totalClosingCost = 0n;
  let totalNrvWriteDown = 0n;
  let totalCarrying = 0n;
  let totalCogs = 0n;
  let totalStockVariance = 0n;
  const currencyCode = input.items[0]!.currencyCode;

  for (const item of input.items) {
    let closing: { closingQty: bigint; closingCost: bigint; cogs: bigint; unitCost: bigint };

    switch (item.costingMethod) {
      case 'WEIGHTED_AVERAGE':
        closing = computeWeightedAverage(item.openingQuantity, item.openingCost, item.movements);
        break;
      case 'FIFO':
        closing = computeFifo(item.openingQuantity, item.openingCost, item.movements);
        break;
      case 'SPECIFIC_ID':
        closing = computeSpecificId(item.openingQuantity, item.openingCost, item.movements);
        break;
    }

    // IAS 2: Lower of cost and NRV
    const totalNrv = item.netRealisableValue * closing.closingQty;
    const writeDown = closing.closingCost > totalNrv ? closing.closingCost - totalNrv : 0n;
    const carrying = closing.closingCost - writeDown;

    valuations.push({
      itemCode: item.itemCode,
      itemName: item.itemName,
      closingQuantity: closing.closingQty,
      unitCost: closing.unitCost,
      totalCost: closing.closingCost,
      nrv: totalNrv,
      nrvWriteDown: writeDown,
      carryingAmount: carrying,
      cogsAmount: closing.cogs,
    });

    totalClosingCost += closing.closingCost;
    totalNrvWriteDown += writeDown;
    totalCarrying += carrying;
    totalCogs += closing.cogs;

    // Stock count reconciliation
    if (input.stockCounts) {
      const count = input.stockCounts.find((c) => c.itemCode === item.itemCode);
      if (count) {
        const variance = count.countedQuantity - closing.closingQty;
        const varianceValue = variance * closing.unitCost;
        const absVariance = varianceValue < 0n ? -varianceValue : varianceValue;
        stockLines.push({
          itemCode: item.itemCode,
          systemQuantity: closing.closingQty,
          countedQuantity: count.countedQuantity,
          variance,
          varianceValue,
          isDiscrepancy: variance !== 0n,
        });
        totalStockVariance += absVariance;
      }
    }
  }

  // COGS journal lines
  const journalLines: InventoryJournalLine[] = [];
  if (totalCogs > 0n) {
    journalLines.push(
      {
        accountCode: '5000',
        accountDescription: 'Cost of Goods Sold',
        debit: totalCogs,
        credit: 0n,
      },
      { accountCode: '1300', accountDescription: 'Inventory', debit: 0n, credit: totalCogs }
    );
  }
  if (totalNrvWriteDown > 0n) {
    journalLines.push(
      {
        accountCode: '5010',
        accountDescription: 'Inventory NRV Write-Down',
        debit: totalNrvWriteDown,
        credit: 0n,
      },
      {
        accountCode: '1310',
        accountDescription: 'Inventory Valuation Allowance',
        debit: 0n,
        credit: totalNrvWriteDown,
      }
    );
  }

  const result: InventoryResult = {
    valuationDate: input.valuationDate,
    totalItems: input.items.length,
    valuations,
    totalClosingCost,
    totalNrvWriteDown,
    totalCarryingAmount: totalCarrying,
    totalCogs,
    cogsJournalLines: journalLines,
    stockCountReconciliation: stockLines,
    totalStockVariance,
    currencyCode,
  };

  return {
    result,
    inputs: {
      valuationDate: input.valuationDate,
      itemCount: input.items.length,
      hasStockCounts: !!input.stockCounts,
    },
    explanation:
      `Inventory valuation: ${input.items.length} items, total cost ${totalClosingCost}, ` +
      `NRV write-down ${totalNrvWriteDown}, carrying ${totalCarrying}, COGS ${totalCogs}${ 
      stockLines.length > 0
        ? `, ${stockLines.filter((s) => s.isDiscrepancy).length} stock discrepancies`
        : ''}`,
  };
}
