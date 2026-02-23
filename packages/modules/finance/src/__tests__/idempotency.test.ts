import { describe, it, expect } from "vitest";
import { mockIdempotencyStore } from "./helpers.js";

describe("IIdempotencyStore (mock contract)", () => {
  it("first claim succeeds", async () => {
    const store = mockIdempotencyStore();
    const result = await store.claimOrGet({
      tenantId: "t1",
      key: "k1",
      commandType: "POST_JOURNAL",
    });
    expect(result.claimed).toBe(true);
  });

  it("second claim with same key is rejected", async () => {
    const store = mockIdempotencyStore();
    await store.claimOrGet({ tenantId: "t1", key: "k1", commandType: "POST_JOURNAL" });
    const result = await store.claimOrGet({ tenantId: "t1", key: "k1", commandType: "POST_JOURNAL" });
    expect(result.claimed).toBe(false);
  });

  it("same key with different commandType succeeds", async () => {
    const store = mockIdempotencyStore();
    await store.claimOrGet({ tenantId: "t1", key: "k1", commandType: "POST_JOURNAL" });
    const result = await store.claimOrGet({ tenantId: "t1", key: "k1", commandType: "REVERSE_JOURNAL" });
    expect(result.claimed).toBe(true);
  });

  it("same key with different tenantId succeeds", async () => {
    const store = mockIdempotencyStore();
    await store.claimOrGet({ tenantId: "t1", key: "k1", commandType: "POST_JOURNAL" });
    const result = await store.claimOrGet({ tenantId: "t2", key: "k1", commandType: "POST_JOURNAL" });
    expect(result.claimed).toBe(true);
  });

  it("pre-claimed keys are rejected immediately", async () => {
    const claimed = new Set(["t1:k1:POST_JOURNAL"]);
    const store = mockIdempotencyStore(claimed);
    const result = await store.claimOrGet({ tenantId: "t1", key: "k1", commandType: "POST_JOURNAL" });
    expect(result.claimed).toBe(false);
  });

  it("concurrent claims — only first wins", async () => {
    const store = mockIdempotencyStore();
    const [r1, r2, r3] = await Promise.all([
      store.claimOrGet({ tenantId: "t1", key: "race", commandType: "POST_JOURNAL" }),
      store.claimOrGet({ tenantId: "t1", key: "race", commandType: "POST_JOURNAL" }),
      store.claimOrGet({ tenantId: "t1", key: "race", commandType: "POST_JOURNAL" }),
    ]);
    const claimed = [r1, r2, r3].filter((r) => r.claimed);
    const rejected = [r1, r2, r3].filter((r) => !r.claimed);
    expect(claimed.length).toBe(1);
    expect(rejected.length).toBe(2);
  });
});
