export interface IdempotencyClaimInput {
  readonly tenantId: string;
  readonly key: string;
  readonly commandType: string;
  readonly resultRef?: string;
}

export type IdempotencyResult =
  | { readonly claimed: true }
  | { readonly claimed: false; readonly resultRef?: string };

export interface IIdempotencyStore {
  claimOrGet(input: IdempotencyClaimInput): Promise<IdempotencyResult>;
  /** A-08: Record the outcome reference (e.g. journal ID) after successful processing */
  recordOutcome?(
    tenantId: string,
    key: string,
    commandType: string,
    resultRef: string
  ): Promise<void>;
}
