/**
 * SP-4003: SLA Calculator — compute SLA deadlines per case category + priority.
 *
 * No I/O. Pure deterministic calculations.
 */

import type { CaseCategory, CasePriority } from './case-state-machine.js';

// ─── SLA Configuration ─────────────────────────────────────────────────────

/**
 * SLA deadlines in hours per category + priority.
 *
 * response_hours: Time to first response/assignment.
 * resolution_hours: Time to final resolution.
 */
export interface SlaConfig {
  readonly responseHours: number;
  readonly resolutionHours: number;
}

const SLA_MATRIX: Record<CasePriority, Record<CaseCategory, SlaConfig>> = {
  CRITICAL: {
    PAYMENT: { responseHours: 2, resolutionHours: 24 },
    INVOICE: { responseHours: 4, resolutionHours: 48 },
    COMPLIANCE: { responseHours: 4, resolutionHours: 48 },
    DELIVERY: { responseHours: 4, resolutionHours: 48 },
    QUALITY: { responseHours: 4, resolutionHours: 48 },
    ONBOARDING: { responseHours: 4, resolutionHours: 24 },
    GENERAL: { responseHours: 8, resolutionHours: 48 },
    ESCALATION: { responseHours: 2, resolutionHours: 24 },
  },
  HIGH: {
    PAYMENT: { responseHours: 8, resolutionHours: 48 },
    INVOICE: { responseHours: 8, resolutionHours: 72 },
    COMPLIANCE: { responseHours: 8, resolutionHours: 72 },
    DELIVERY: { responseHours: 8, resolutionHours: 72 },
    QUALITY: { responseHours: 8, resolutionHours: 72 },
    ONBOARDING: { responseHours: 8, resolutionHours: 48 },
    GENERAL: { responseHours: 16, resolutionHours: 72 },
    ESCALATION: { responseHours: 4, resolutionHours: 48 },
  },
  MEDIUM: {
    PAYMENT: { responseHours: 24, resolutionHours: 120 },
    INVOICE: { responseHours: 24, resolutionHours: 120 },
    COMPLIANCE: { responseHours: 24, resolutionHours: 120 },
    DELIVERY: { responseHours: 24, resolutionHours: 120 },
    QUALITY: { responseHours: 24, resolutionHours: 120 },
    ONBOARDING: { responseHours: 24, resolutionHours: 96 },
    GENERAL: { responseHours: 48, resolutionHours: 120 },
    ESCALATION: { responseHours: 8, resolutionHours: 72 },
  },
  LOW: {
    PAYMENT: { responseHours: 48, resolutionHours: 240 },
    INVOICE: { responseHours: 48, resolutionHours: 240 },
    COMPLIANCE: { responseHours: 48, resolutionHours: 240 },
    DELIVERY: { responseHours: 48, resolutionHours: 240 },
    QUALITY: { responseHours: 48, resolutionHours: 240 },
    ONBOARDING: { responseHours: 48, resolutionHours: 168 },
    GENERAL: { responseHours: 72, resolutionHours: 240 },
    ESCALATION: { responseHours: 24, resolutionHours: 120 },
  },
};

/**
 * Get SLA configuration for a case category + priority.
 */
export function getSlaConfig(priority: CasePriority, category: CaseCategory): SlaConfig {
  return SLA_MATRIX[priority][category];
}

/**
 * Compute the SLA deadline from a start time.
 * Returns the deadline as a Date.
 */
export function computeSlaDeadline(startTime: Date, slaHours: number): Date {
  return new Date(startTime.getTime() + slaHours * 60 * 60 * 1000);
}

/**
 * Check if an SLA has been breached.
 */
export function isSlaBreached(startTime: Date, slaHours: number, now: Date = new Date()): boolean {
  const deadline = computeSlaDeadline(startTime, slaHours);
  return now > deadline;
}

/**
 * Compute remaining time until SLA breach.
 * Returns negative if already breached.
 */
export function slaRemainingMs(startTime: Date, slaHours: number, now: Date = new Date()): number {
  const deadline = computeSlaDeadline(startTime, slaHours);
  return deadline.getTime() - now.getTime();
}

/**
 * Compute SLA progress as a percentage (0–100+).
 * > 100 means SLA is breached.
 */
export function slaProgressPercent(
  startTime: Date,
  slaHours: number,
  now: Date = new Date()
): number {
  const totalMs = slaHours * 60 * 60 * 1000;
  const elapsedMs = now.getTime() - startTime.getTime();
  return Math.round((elapsedMs / totalMs) * 100);
}
