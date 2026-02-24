import { formatMoney, formatDate, formatNumber, formatPercent, truncateId } from "@/lib/format";

describe("formatMoney", () => {
  it("formats USD with symbol by default", () => {
    expect(formatMoney(1000, "USD")).toBe("$1,000.00");
  });

  it("formats bigint amounts (minor units)", () => {
    expect(formatMoney(BigInt(100000), "USD")).toBe("$1,000.00");
  });

  it("formats string amounts (minor units)", () => {
    expect(formatMoney("100000", "USD")).toBe("$1,000.00");
  });

  it("formats with currency code", () => {
    expect(formatMoney(1000, "USD", { showSymbol: false, showCode: true })).toBe("1,000.00 USD");
  });

  it("formats JPY with zero decimals", () => {
    expect(formatMoney(1000, "JPY")).toBe("\u00a51,000");
  });

  it("formats MYR with RM symbol", () => {
    expect(formatMoney(1000, "MYR")).toBe("RM1,000.00");
  });

  it("handles unknown currency gracefully", () => {
    const result = formatMoney(100, "XYZ");
    expect(result).toBe("100.00");
  });
});

describe("formatDate", () => {
  it("formats medium style by default", () => {
    const result = formatDate("2026-01-15T00:00:00Z", "medium");
    expect(result).toContain("Jan");
    expect(result).toContain("2026");
  });

  it("formats short style", () => {
    const result = formatDate("2026-01-15T00:00:00Z", "short");
    expect(result).toContain("2026");
  });

  it("formats long style", () => {
    const result = formatDate("2026-01-15T00:00:00Z", "long");
    expect(result).toContain("January");
    expect(result).toContain("2026");
  });

  it("accepts Date objects", () => {
    const result = formatDate(new Date("2026-06-01"), "medium");
    expect(result).toContain("2026");
  });
});

describe("formatNumber", () => {
  it("formats with no decimals by default", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("formats with specified decimals", () => {
    expect(formatNumber(1234.5, 2)).toBe("1,234.50");
  });
});

describe("formatPercent", () => {
  it("formats decimal as percentage", () => {
    expect(formatPercent(0.1234)).toBe("12.3%");
  });

  it("formats with custom decimals", () => {
    expect(formatPercent(0.1234, 2)).toBe("12.34%");
  });
});

describe("truncateId", () => {
  it("truncates long IDs", () => {
    expect(truncateId("abcdefghijklmnop", 8)).toBe("abcdefgh\u2026");
  });

  it("returns short IDs unchanged", () => {
    expect(truncateId("abc", 8)).toBe("abc");
  });

  it("returns exact-length IDs unchanged", () => {
    expect(truncateId("abcdefgh", 8)).toBe("abcdefgh");
  });
});
