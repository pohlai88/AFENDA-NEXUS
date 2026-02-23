/**
 * @afenda/industry-manufacturing — Manufacturing industry overlay stub.
 */

export interface ManufacturingOverlayConfig {
  readonly enableBOM: boolean;
  readonly enableWorkOrders: boolean;
}

export function manufacturingOverlay(config?: Partial<ManufacturingOverlayConfig>): ManufacturingOverlayConfig {
  return {
    enableBOM: config?.enableBOM ?? false,
    enableWorkOrders: config?.enableWorkOrders ?? false,
  };
}
