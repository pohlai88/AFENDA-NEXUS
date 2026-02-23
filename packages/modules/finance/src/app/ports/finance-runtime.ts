/**
 * FinanceDeps — composed from per-slice deps interfaces.
 *
 * Each slice defines its own narrow deps (GlDeps, FxDeps, etc.).
 * Services receive only their slice's deps + SharedDeps.
 * FinanceDeps is the union used by the runtime composition root.
 */
import type { GlDeps } from "../../slices/gl/ports/gl-deps.js";
import type { FxDeps } from "../../slices/fx/ports/fx-deps.js";
import type { IcDeps } from "../../slices/ic/ports/ic-deps.js";
import type { HubDeps } from "../../slices/hub/ports/hub-deps.js";
import type { SharedDeps } from "../../shared/ports/shared-deps.js";

export interface FinanceDeps extends GlDeps, FxDeps, IcDeps, HubDeps, SharedDeps { }

export type { GlDeps, FxDeps, IcDeps, HubDeps, SharedDeps };

export interface FinanceRuntime {
  withTenant<T>(
    ctx: { tenantId: string; userId: string },
    fn: (deps: FinanceDeps) => Promise<T>,
  ): Promise<T>;
}
