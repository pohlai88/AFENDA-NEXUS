/**
 * Cross-slice ports for FX rate access and conversion.
 * Slices that need FX rates or currency conversion import from here
 * instead of directly from the FX slice.
 */
export type { IFxRateRepo } from "../../slices/fx/ports/fx-rate-repo.js";
export type { FxRate } from "../../slices/fx/entities/fx-rate.js";
export { convertAmount } from "../../slices/fx/entities/fx-rate.js";
