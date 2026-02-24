import { describe, it, expect } from "vitest";
import { classifyInstruments } from "../calculators/classification.js";
import { computeEir } from "../calculators/effective-interest-rate.js";
import { computeFairValue } from "../calculators/fair-value.js";
import { computeEcl } from "../calculators/ecl.js";
import { evaluateDerecognition } from "../calculators/derecognition.js";

// ── Classification ───────────────────────────────────────────────────────────

describe("classifyInstruments", () => {
  it("classifies hold-to-collect + SPPI pass as Amortized Cost", () => {
    const result = classifyInstruments([
      {
        instrumentId: "fi-1",
        instrumentType: "DEBT_HELD",
        businessModel: "HOLD_TO_COLLECT",
        passesSppiTest: true,
        isDesignatedFvtpl: false,
        isEquityInvestment: false,
        isDesignatedFvoci: false,
      },
    ]);
    expect(result.result[0]!.classification).toBe("AMORTIZED_COST");
  });

  it("classifies SPPI failure as FVTPL", () => {
    const result = classifyInstruments([
      {
        instrumentId: "fi-2",
        instrumentType: "DERIVATIVE",
        businessModel: "HOLD_TO_COLLECT",
        passesSppiTest: false,
        isDesignatedFvtpl: false,
        isEquityInvestment: false,
        isDesignatedFvoci: false,
      },
    ]);
    expect(result.result[0]!.classification).toBe("FVTPL");
  });

  it("classifies hold-to-collect-and-sell as FVOCI", () => {
    const result = classifyInstruments([
      {
        instrumentId: "fi-3",
        instrumentType: "DEBT_HELD",
        businessModel: "HOLD_TO_COLLECT_AND_SELL",
        passesSppiTest: true,
        isDesignatedFvtpl: false,
        isEquityInvestment: false,
        isDesignatedFvoci: false,
      },
    ]);
    expect(result.result[0]!.classification).toBe("FVOCI");
  });

  it("classifies equity designated FVOCI", () => {
    const result = classifyInstruments([
      {
        instrumentId: "fi-4",
        instrumentType: "EQUITY_INVESTMENT",
        businessModel: "OTHER",
        passesSppiTest: false,
        isDesignatedFvtpl: false,
        isEquityInvestment: true,
        isDesignatedFvoci: true,
      },
    ]);
    expect(result.result[0]!.classification).toBe("FVOCI");
  });

  it("overrides with fair value option", () => {
    const result = classifyInstruments([
      {
        instrumentId: "fi-5",
        instrumentType: "DEBT_HELD",
        businessModel: "HOLD_TO_COLLECT",
        passesSppiTest: true,
        isDesignatedFvtpl: true,
        isEquityInvestment: false,
        isDesignatedFvoci: false,
      },
    ]);
    expect(result.result[0]!.classification).toBe("FVTPL");
  });

  it("throws on empty input", () => {
    expect(() => classifyInstruments([])).toThrow("At least one");
  });
});

// ── EIR ──────────────────────────────────────────────────────────────────────

describe("computeEir", () => {
  it("computes interest income using EIR", () => {
    const result = computeEir([
      {
        instrumentId: "fi-1",
        carryingAmount: 1000000n,
        effectiveInterestRateBps: 500,
        periodMonths: 6,
        cashReceived: 20000n,
        currencyCode: "USD",
      },
    ]);
    // Annual interest = 1000000 * 500 / 10000 = 50000; 6-month = 25000
    expect(result.result[0]!.interestIncome).toBe(25000n);
    // Premium/discount amort = 25000 - 20000 = 5000
    expect(result.result[0]!.premiumDiscountAmortization).toBe(5000n);
    expect(result.result[0]!.newCarryingAmount).toBe(1005000n);
  });

  it("throws on empty input", () => {
    expect(() => computeEir([])).toThrow("At least one");
  });
});

// ── Fair Value ───────────────────────────────────────────────────────────────

describe("computeFairValue", () => {
  it("recognizes FVTPL gain in P&L", () => {
    const result = computeFairValue([
      {
        instrumentId: "fi-1",
        classification: "FVTPL",
        carryingAmount: 100000n,
        newFairValue: 110000n,
        fairValueLevel: "LEVEL_1",
        currencyCode: "USD",
      },
    ]);
    expect(result.result[0]!.unrealizedGainLoss).toBe(10000n);
    expect(result.result[0]!.recognizedInPnl).toBe(10000n);
    expect(result.result[0]!.recognizedInOci).toBe(0n);
  });

  it("recognizes FVOCI gain in OCI", () => {
    const result = computeFairValue([
      {
        instrumentId: "fi-2",
        classification: "FVOCI",
        carryingAmount: 100000n,
        newFairValue: 95000n,
        fairValueLevel: "LEVEL_2",
        currencyCode: "USD",
      },
    ]);
    expect(result.result[0]!.unrealizedGainLoss).toBe(-5000n);
    expect(result.result[0]!.recognizedInOci).toBe(-5000n);
    expect(result.result[0]!.recognizedInPnl).toBe(0n);
  });

  it("no adjustment for amortized cost", () => {
    const result = computeFairValue([
      {
        instrumentId: "fi-3",
        classification: "AMORTIZED_COST",
        carryingAmount: 100000n,
        newFairValue: 120000n,
        fairValueLevel: "LEVEL_2",
        currencyCode: "USD",
      },
    ]);
    expect(result.result[0]!.unrealizedGainLoss).toBe(0n);
    expect(result.result[0]!.newCarryingAmount).toBe(100000n);
  });

  it("throws on empty input", () => {
    expect(() => computeFairValue([])).toThrow("At least one");
  });
});

// ── ECL ──────────────────────────────────────────────────────────────────────

describe("computeEcl", () => {
  it("computes 12-month ECL for Stage 1", () => {
    const result = computeEcl([
      {
        instrumentId: "fi-1",
        stage: "STAGE_1",
        exposureAtDefault: 1000000n,
        probabilityOfDefaultBps: 200,
        lossGivenDefaultBps: 4500,
        remainingLifeMonths: 36,
        existingProvision: 0n,
        currencyCode: "USD",
      },
    ]);
    // ECL = 1000000 * 200 * 4500 / (10000 * 10000) = 9000
    expect(result.result[0]!.eclAmount).toBe(9000n);
    expect(result.result[0]!.isIncrease).toBe(true);
  });

  it("computes lifetime ECL for Stage 2", () => {
    const result = computeEcl([
      {
        instrumentId: "fi-2",
        stage: "STAGE_2",
        exposureAtDefault: 1000000n,
        probabilityOfDefaultBps: 200,
        lossGivenDefaultBps: 4500,
        remainingLifeMonths: 36,
        existingProvision: 0n,
        currencyCode: "USD",
      },
    ]);
    // Lifetime PD = 200 * 36 / 12 = 600 bps
    // ECL = 1000000 * 600 * 4500 / 100000000 = 27000
    expect(result.result[0]!.eclAmount).toBe(27000n);
  });

  it("caps lifetime PD at 10000 bps", () => {
    const result = computeEcl([
      {
        instrumentId: "fi-3",
        stage: "STAGE_3",
        exposureAtDefault: 500000n,
        probabilityOfDefaultBps: 5000,
        lossGivenDefaultBps: 6000,
        remainingLifeMonths: 60,
        existingProvision: 0n,
        currencyCode: "USD",
      },
    ]);
    // Lifetime PD = 5000 * 60 / 12 = 25000 → capped at 10000
    // ECL = 500000 * 10000 * 6000 / 100000000 = 300000
    expect(result.result[0]!.eclAmount).toBe(300000n);
  });

  it("throws on empty input", () => {
    expect(() => computeEcl([])).toThrow("At least one");
  });
});

// ── Derecognition ────────────────────────────────────────────────────────────

describe("evaluateDerecognition", () => {
  it("full derecognition when risks transferred", () => {
    const result = evaluateDerecognition([
      {
        instrumentId: "fi-1",
        carryingAmount: 100000n,
        considerationReceived: 105000n,
        transfersSubstantiallyAllRisks: true,
        retainsSubstantiallyAllRisks: false,
        retainsControl: false,
        continuingInvolvementFairValue: 0n,
        currencyCode: "USD",
      },
    ]);
    expect(result.result[0]!.outcome).toBe("FULL_DERECOGNITION");
    expect(result.result[0]!.gainOrLoss).toBe(5000n);
    expect(result.result[0]!.isGain).toBe(true);
  });

  it("no derecognition when risks retained", () => {
    const result = evaluateDerecognition([
      {
        instrumentId: "fi-2",
        carryingAmount: 100000n,
        considerationReceived: 100000n,
        transfersSubstantiallyAllRisks: false,
        retainsSubstantiallyAllRisks: true,
        retainsControl: true,
        continuingInvolvementFairValue: 0n,
        currencyCode: "USD",
      },
    ]);
    expect(result.result[0]!.outcome).toBe("NO_DERECOGNITION");
    expect(result.result[0]!.retainedAmount).toBe(100000n);
  });

  it("continuing involvement when control retained", () => {
    const result = evaluateDerecognition([
      {
        instrumentId: "fi-3",
        carryingAmount: 100000n,
        considerationReceived: 80000n,
        transfersSubstantiallyAllRisks: false,
        retainsSubstantiallyAllRisks: false,
        retainsControl: true,
        continuingInvolvementFairValue: 30000n,
        currencyCode: "USD",
      },
    ]);
    expect(result.result[0]!.outcome).toBe("CONTINUING_INVOLVEMENT");
    expect(result.result[0]!.retainedAmount).toBe(30000n);
    expect(result.result[0]!.derecognizedAmount).toBe(70000n);
  });

  it("throws on empty input", () => {
    expect(() => evaluateDerecognition([])).toThrow("At least one");
  });
});
