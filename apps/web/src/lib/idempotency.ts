import { nanoid } from 'nanoid';

// ─── Idempotency Key Generation ──────────────────────────────────────────────

export function generateIdempotencyKey(): string {
  return `idem_${nanoid(21)}`;
}

// ─── Idempotency Cache (for preventing duplicate submissions) ────────────────

const processedKeys = new Map<string, { timestamp: number; result: unknown }>();
const KEY_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function isKeyProcessed(key: string): boolean {
  const entry = processedKeys.get(key);
  if (!entry) return false;

  // eslint-disable-next-line no-restricted-syntax
  if (Date.now() - entry.timestamp > KEY_TTL_MS) {
    processedKeys.delete(key);
    return false;
  }

  return true;
}

export function markKeyProcessed<T>(key: string, result: T): void {
  // eslint-disable-next-line no-restricted-syntax
  processedKeys.set(key, { timestamp: Date.now(), result });

  // Cleanup old keys periodically
  if (processedKeys.size > 1000) {
    // eslint-disable-next-line no-restricted-syntax
    const now = Date.now();
    for (const [k, v] of processedKeys) {
      if (now - v.timestamp > KEY_TTL_MS) {
        processedKeys.delete(k);
      }
    }
  }
}

export function getProcessedResult<T>(key: string): T | null {
  const entry = processedKeys.get(key);
  // eslint-disable-next-line no-restricted-syntax
  if (!entry || Date.now() - entry.timestamp > KEY_TTL_MS) {
    return null;
  }
  return entry.result as T;
}

// ─── Action Wrapper with Idempotency ─────────────────────────────────────────

export interface IdempotentActionInput {
  idempotencyKey?: string;
}

export type IdempotentResult<T> =
  | { ok: true; data: T; cached?: boolean }
  | { ok: false; error: string };

export function withIdempotency<TInput extends IdempotentActionInput, TResult>(
  action: (input: TInput) => Promise<IdempotentResult<TResult>>
) {
  return async (input: TInput): Promise<IdempotentResult<TResult>> => {
    const key = input.idempotencyKey;

    // If no key provided, just run the action
    if (!key) {
      return action(input);
    }

    // Check if already processed
    const cached = getProcessedResult<IdempotentResult<TResult>>(key);
    if (cached) {
      return { ...cached, cached: true } as IdempotentResult<TResult>;
    }

    // Process the action
    const result = await action(input);

    // Cache successful results
    if (result.ok) {
      markKeyProcessed(key, result);
    }

    return result;
  };
}
