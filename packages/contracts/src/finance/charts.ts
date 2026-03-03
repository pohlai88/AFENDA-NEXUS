import { z } from 'zod';

// ─── Dashboard Chart View-Model Schemas (finance feature) ───────────────────
// Centralised so the gate:contract-response-drift CI gate can verify these
// against @afenda/contracts rather than allowing local query-file types.

/** A single period data point for the tax liability bar-chart */
export const TaxLiabilityDataPointSchema = z.object({
  period: z.string(),
  outputTax: z.number(),
  inputTax: z.number(),
  netTax: z.number(),
});
export type TaxLiabilityDataPoint = z.infer<typeof TaxLiabilityDataPointSchema>;

/** A single period data point for the working capital band-chart */
export const WorkingCapitalDataPointSchema = z.object({
  period: z.string(),
  currentAssets: z.number(),
  currentLiabilities: z.number(),
  netWorkingCapital: z.number(),
});
export type WorkingCapitalDataPoint = z.infer<typeof WorkingCapitalDataPointSchema>;

/** A node in a Sankey flow diagram */
export const SankeyNodeSchema = z.object({
  name: z.string(),
});
export type SankeyNode = z.infer<typeof SankeyNodeSchema>;

/** A directed link (edge) between two nodes in a Sankey diagram */
export const SankeyLinkSchema = z.object({
  source: z.number().int().nonnegative(),
  target: z.number().int().nonnegative(),
  value: z.number().nonnegative(),
});
export type SankeyLink = z.infer<typeof SankeyLinkSchema>;

/** Complete dataset for a Sankey flow diagram */
export const SankeyDataSchema = z.object({
  nodes: z.array(SankeyNodeSchema),
  links: z.array(SankeyLinkSchema),
});
export type SankeyData = z.infer<typeof SankeyDataSchema>;
