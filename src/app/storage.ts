/**
 * localStorage persistence.
 *
 * Everything is wrapped in try/catch because storage can be unavailable
 * (private mode, disabled cookies) or full, and reads are fully re-validated
 * because the stored JSON is attacker-editable. A bad read degrades to "start
 * fresh" rather than crashing the app.
 */

import { coerceGoal, coerceProfile, FOOTPRINT_CATEGORIES } from '../domain';
import type { FootprintCategory, FootprintSnapshot, Goal, UserProfile } from '../domain';

const STORAGE_KEY = 'ecotrack:state';
const SCHEMA_VERSION = 1;
const MAX_HISTORY = 50;

export interface PersistedState {
  profile: UserProfile;
  goal: Goal | null;
  committedRecommendationIds: string[];
  history: FootprintSnapshot[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function finiteOrZero(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function coerceCategoryTotals(raw: unknown): Record<FootprintCategory, number> {
  const o = isObject(raw) ? raw : {};
  const totals = {} as Record<FootprintCategory, number>;
  for (const category of FOOTPRINT_CATEGORIES) {
    totals[category] = finiteOrZero(o[category]);
  }
  return totals;
}

function coerceSnapshot(raw: unknown): FootprintSnapshot | null {
  if (!isObject(raw)) return null;
  if (typeof raw.id !== 'string' || typeof raw.dateISO !== 'string') return null;
  return {
    id: raw.id,
    dateISO: raw.dateISO,
    totalKgPerYear: finiteOrZero(raw.totalKgPerYear),
    byCategory: coerceCategoryTotals(raw.byCategory),
  };
}

function coerceStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string');
}

/** Reads and fully re-validates persisted state; returns null on any problem. */
export function loadPersistedState(): PersistedState | null {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(parsed)) return null;

  // Unknown/older schema versions are discarded rather than mis-read.
  if (parsed.schemaVersion !== SCHEMA_VERSION) return null;

  const history = Array.isArray(parsed.history)
    ? parsed.history
        .map(coerceSnapshot)
        .filter((s): s is FootprintSnapshot => s !== null)
        .slice(-MAX_HISTORY)
    : [];

  return {
    profile: coerceProfile(parsed.profile),
    goal: coerceGoal(parsed.goal),
    committedRecommendationIds: coerceStringArray(parsed.committedRecommendationIds),
    history,
  };
}

/** Writes state, silently no-op'ing if storage is unavailable or full. */
export function savePersistedState(state: PersistedState): void {
  try {
    const payload = JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      ...state,
      history: state.history.slice(-MAX_HISTORY),
    });
    window.localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // Persistence is a best-effort enhancement, not a requirement.
  }
}

export function clearPersistedState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — nothing more we can do.
  }
}

export { MAX_HISTORY };
