/**
 * @afenda/industry-fnb — Public API surface.
 */

export interface FnbOverlayConfig {
  readonly enableBatchTracking: boolean;
  readonly enableExpiryManagement: boolean;
}

export function fnbOverlay(config?: Partial<FnbOverlayConfig>): FnbOverlayConfig {
  return {
    enableBatchTracking: config?.enableBatchTracking ?? true,
    enableExpiryManagement: config?.enableExpiryManagement ?? true,
  };
}
