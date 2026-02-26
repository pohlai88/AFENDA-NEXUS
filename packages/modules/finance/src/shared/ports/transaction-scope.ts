/**
 * W3-9: Transaction scope port.
 *
 * Provides an explicit transaction boundary for multi-write operations.
 * The runtime composition root provides the Drizzle implementation;
 * services use only this interface.
 */
export interface ITransactionScope {
  /** Execute fn inside an explicit BEGIN...COMMIT boundary. Rolls back on throw. */
  runInTransaction<T>(fn: () => Promise<T>): Promise<T>;
}
