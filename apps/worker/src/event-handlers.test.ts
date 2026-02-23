import { describe, it, expect, vi } from "vitest";
import type { OutboxRow } from "@afenda/db";
import type { Logger } from "@afenda/platform";
import {
  createEventHandlerRegistry,
  registerFinanceHandlers,
} from "./event-handlers.js";

function mockLogger(): Logger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  } as unknown as Logger;
}

function makeOutboxRow(overrides: Partial<OutboxRow> = {}): OutboxRow {
  return {
    id: "outbox-1",
    tenantId: "t1",
    eventType: "JOURNAL_POSTED",
    payload: { journalId: "j1" },
    createdAt: new Date("2025-06-01"),
    processedAt: null,
    ...overrides,
  };
}

describe("EventHandlerRegistry", () => {
  it("dispatches to registered handler", async () => {
    const logger = mockLogger();
    const registry = createEventHandlerRegistry(logger);
    const handler = vi.fn();

    registry.register("JOURNAL_POSTED", handler);
    await registry.dispatch(makeOutboxRow());

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ eventType: "JOURNAL_POSTED" }));
  });

  it("logs warning for unregistered event type", async () => {
    const logger = mockLogger();
    const registry = createEventHandlerRegistry(logger);

    await registry.dispatch(makeOutboxRow({ eventType: "UNKNOWN_EVENT" }));

    expect(logger.warn).toHaveBeenCalledOnce();
    expect((logger.warn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toContain("No handler registered");
  });

  it("supports multiple event types", async () => {
    const logger = mockLogger();
    const registry = createEventHandlerRegistry(logger);
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    registry.register("JOURNAL_POSTED", handler1);
    registry.register("GL_BALANCE_CHANGED", handler2);

    await registry.dispatch(makeOutboxRow({ eventType: "JOURNAL_POSTED" }));
    await registry.dispatch(makeOutboxRow({ eventType: "GL_BALANCE_CHANGED" }));

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it("overwrites handler for same event type", async () => {
    const logger = mockLogger();
    const registry = createEventHandlerRegistry(logger);
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    registry.register("JOURNAL_POSTED", handler1);
    registry.register("JOURNAL_POSTED", handler2);

    await registry.dispatch(makeOutboxRow());

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledOnce();
  });
});

describe("registerFinanceHandlers", () => {
  it("registers handlers for all known finance events", async () => {
    const logger = mockLogger();
    const registry = createEventHandlerRegistry(logger);
    registerFinanceHandlers(registry, logger);

    const eventTypes = [
      "JOURNAL_POSTED",
      "GL_BALANCE_CHANGED",
      "JOURNAL_REVERSED",
      "JOURNAL_VOIDED",
      "IC_TRANSACTION_CREATED",
    ];

    for (const eventType of eventTypes) {
      await registry.dispatch(makeOutboxRow({ eventType }));
    }

    // All 5 events should have been handled (no warnings)
    expect(logger.warn).not.toHaveBeenCalled();
    // Each handler logs an info message
    expect(logger.info).toHaveBeenCalledTimes(5);
  });
});
