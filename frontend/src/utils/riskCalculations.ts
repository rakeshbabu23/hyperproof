import type { Severity } from '../types';

/** UI-only preview helpers. Backend remains the source of truth for scores. */

export function calculateInherentRisk(likelihood: number, impact: number): number {
  return likelihood * impact;
}

export function getSeverityBand(score: number): Severity {
  if (score >= 1 && score <= 5) return 'Low';
  if (score >= 6 && score <= 12) return 'Medium';
  if (score >= 13 && score <= 19) return 'High';
  if (score >= 20 && score <= 25) return 'Critical';
  throw new Error(`Score ${score} is outside the valid range 1–25`);
}
