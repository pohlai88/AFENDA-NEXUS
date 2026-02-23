/**
 * @afenda/industry-agriculture — Agriculture industry overlay stub.
 */

export interface AgricultureOverlayConfig {
  readonly enableSeasonTracking: boolean;
  readonly enableCropManagement: boolean;
}

export function agricultureOverlay(config?: Partial<AgricultureOverlayConfig>): AgricultureOverlayConfig {
  return {
    enableSeasonTracking: config?.enableSeasonTracking ?? false,
    enableCropManagement: config?.enableCropManagement ?? false,
  };
}
