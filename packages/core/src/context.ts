/**
 * Request context — AsyncLocalStorage helpers for automatic
 * correlationId / tenantId / userId / requestId propagation.
 *
 * Lives in @afenda/core so that any layer (infrastructure, platform, module,
 * app) can read context without pulling in higher-layer packages.
 */
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  correlationId: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
}

const requestContextStore = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return requestContextStore.run(ctx, fn);
}

export function getContext(): RequestContext | undefined {
  return requestContextStore.getStore();
}
