import { describe, it, expect } from "vitest";
import { can, assertCan, type PolicyContext, type Role } from "./index.js";
import { tenantId, userId } from "@afenda/core";

const adminRole: Role = {
  name: "admin",
  permissions: [
    { resource: "journal", action: "create" },
    { resource: "journal", action: "read" },
    { resource: "journal", action: "post" },
    { resource: "journal", action: "void" },
    { resource: "journal", action: "reverse" },
    { resource: "account", action: "read" },
    { resource: "period", action: "read" },
    { resource: "period", action: "update" },
  ],
};

const readerRole: Role = {
  name: "reader",
  permissions: [
    { resource: "journal", action: "read" },
    { resource: "account", action: "read" },
    { resource: "period", action: "read" },
  ],
};

function makeCtx(roles: Role[]): PolicyContext {
  return {
    tenantId: tenantId("t-1"),
    userId: userId("u-1"),
    roles,
  };
}

// ─── can() ─────────────────────────────────────────────────────────────────────

describe("can()", () => {
  it("returns true when role has matching permission", () => {
    expect(can(makeCtx([adminRole]), "journal", "create")).toBe(true);
  });

  it("returns false when role lacks permission", () => {
    expect(can(makeCtx([readerRole]), "journal", "create")).toBe(false);
  });

  it("returns true if any role grants permission", () => {
    expect(can(makeCtx([readerRole, adminRole]), "journal", "post")).toBe(true);
  });

  it("returns false for unknown resource", () => {
    expect(can(makeCtx([adminRole]), "unknown", "read")).toBe(false);
  });

  it("returns false for unknown action", () => {
    expect(can(makeCtx([adminRole]), "journal", "delete")).toBe(false);
  });

  it("returns false with no roles", () => {
    expect(can(makeCtx([]), "journal", "read")).toBe(false);
  });
});

// ─── assertCan() ───────────────────────────────────────────────────────────────

describe("assertCan()", () => {
  it("does not throw when permitted", () => {
    expect(() => assertCan(makeCtx([adminRole]), "journal", "create")).not.toThrow();
  });

  it("throws when not permitted", () => {
    expect(() => assertCan(makeCtx([readerRole]), "journal", "void")).toThrow(
      "Forbidden: void on journal",
    );
  });

  it("throws with descriptive message", () => {
    expect(() => assertCan(makeCtx([]), "period", "update")).toThrow(
      "Forbidden: update on period",
    );
  });
});
