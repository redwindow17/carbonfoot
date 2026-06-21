/**
 * Goal tracking and projection.
 *
 * "Reducing" a footprint means committing to actions and watching the projected
 * number fall toward a target. These helpers turn a baseline plus a set of
 * committed recommendations into the numbers the dashboard renders. All pure —
 * timestamps and ids are passed in by the caller so the logic stays testable.
 */

import type {
  FootprintResult,
  FootprintSnapshot,
  Goal,
  Recommendation,
} from './types';

/**
 * Sum of savings from committed actions, capped so the projection can never
 * imply a negative footprint. (Savings are not strictly additive, so this is a
 * deliberately optimistic upper bound — see the note in recommendations.ts.)
 */
export function totalCommittedSavings(
  baselineKg: number,
  committed: readonly Recommendation[],
): number {
  const raw = committed.reduce((sum, rec) => sum + Math.max(0, rec.annualSavingsKg), 0);
  return Math.min(raw, Math.max(0, baselineKg));
}

export interface ProgressSummary {
  baselineKg: number;
  committedSavingsKg: number;
  /** Footprint if every committed action is adopted. */
  projectedKg: number;
  goal: Goal | null;
  /** Absolute target footprint implied by the goal, or null if no goal set. */
  targetKg: number | null;
  /** Progress toward the goal's required reduction, 0–100 (clamped). */
  goalProgressPct: number;
  goalMet: boolean;
}

export function summarizeProgress(
  baselineKg: number,
  committed: readonly Recommendation[],
  goal: Goal | null,
): ProgressSummary {
  const committedSavingsKg = totalCommittedSavings(baselineKg, committed);
  const projectedKg = Math.max(0, baselineKg - committedSavingsKg);

  if (!goal || goal.targetReductionPct <= 0) {
    return {
      baselineKg,
      committedSavingsKg,
      projectedKg,
      goal,
      targetKg: null,
      goalProgressPct: 0,
      goalMet: false,
    };
  }

  const requiredReductionKg = (baselineKg * goal.targetReductionPct) / 100;
  const targetKg = Math.max(0, baselineKg - requiredReductionKg);
  const rawProgress =
    requiredReductionKg > 0 ? (committedSavingsKg / requiredReductionKg) * 100 : 0;
  const goalProgressPct = Math.max(0, Math.min(100, Math.round(rawProgress)));

  return {
    baselineKg,
    committedSavingsKg,
    projectedKg,
    goal,
    targetKg,
    goalProgressPct,
    goalMet: projectedKg <= targetKg,
  };
}

/** Builds a point-in-time snapshot for the history log. */
export function createSnapshot(
  result: FootprintResult,
  id: string,
  dateISO: string,
): FootprintSnapshot {
  return {
    id,
    dateISO,
    totalKgPerYear: result.totalKgPerYear,
    byCategory: { ...result.byCategory },
  };
}

/** Signed % change from the first to the most recent snapshot (negative = down). */
export function trendPct(history: readonly FootprintSnapshot[]): number | null {
  if (history.length < 2) return null;
  const first = history[0];
  const last = history[history.length - 1];
  // The length check guarantees both endpoints exist; bail only if the baseline
  // is non-positive (no sensible percentage to report).
  if (first.totalKgPerYear <= 0) return null;
  return Math.round(((last.totalKgPerYear - first.totalKgPerYear) / first.totalKgPerYear) * 100);
}
