/**
 * Input sanitisation for untrusted data.
 *
 * Two sources of input can never be trusted: what a user types into a form, and
 * whatever happens to be sitting in localStorage (which a user — or a malicious
 * script — can edit freely). Both are funnelled through these coercers, which
 * always return a valid, in-range domain object, falling back field-by-field to
 * sensible defaults rather than throwing or propagating `NaN`.
 */

import { DEFAULT_PROFILE } from './defaults';
import {
  CAR_FUEL_LABELS,
  CONSUMPTION_LABELS,
  DIET_LABELS,
  ELECTRICITY_SOURCE_LABELS,
  HEATING_FUEL_LABELS,
  RECYCLING_LABELS,
} from './labels';
import type {
  ConsumptionLevel,
  DietType,
  FoodProfile,
  Goal,
  GoodsProfile,
  RecyclingHabit,
  TransportProfile,
  HomeProfile,
  UserProfile,
} from './types';

export interface NumberLimit {
  min: number;
  max: number;
}

/**
 * Validation bounds shared by the form controls and the sanitiser, so the UI
 * constraints and the data guarantees can never drift apart.
 */
export const INPUT_LIMITS = {
  carKmPerWeek: { min: 0, max: 20_000 },
  publicTransitKmPerWeek: { min: 0, max: 20_000 },
  flightsPerYear: { min: 0, max: 200 },
  householdSize: { min: 1, max: 20 },
  electricityKwhPerMonth: { min: 0, max: 100_000 },
  heatingKwhPerMonth: { min: 0, max: 100_000 },
  targetReductionPct: { min: 1, max: 100 },
} as const satisfies Record<string, NumberLimit>;

const keysOf = <T extends string>(record: Record<T, unknown>): T[] =>
  Object.keys(record) as T[];

const CAR_FUELS = keysOf(CAR_FUEL_LABELS);
const DIETS = keysOf(DIET_LABELS);
const ELECTRICITY_SOURCES = keysOf(ELECTRICITY_SOURCE_LABELS);
const HEATING_FUELS = keysOf(HEATING_FUEL_LABELS);
const CONSUMPTION_LEVELS = keysOf(CONSUMPTION_LABELS);
const RECYCLING_HABITS = keysOf(RECYCLING_LABELS);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/** Coerces anything to a finite number clamped to `limit`; blanks → fallback. */
export function asNumber(
  value: unknown,
  fallback: number,
  limit: NumberLimit,
  integer = false,
): number {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : NaN;
  if (!Number.isFinite(n)) return fallback;
  const clamped = Math.min(limit.max, Math.max(limit.min, n));
  return integer ? Math.round(clamped) : clamped;
}

function coerceTransport(raw: unknown): TransportProfile {
  const d = DEFAULT_PROFILE.transport;
  const o = isObject(raw) ? raw : {};
  return {
    carFuel: asEnum(o.carFuel, CAR_FUELS, d.carFuel),
    carKmPerWeek: asNumber(o.carKmPerWeek, d.carKmPerWeek, INPUT_LIMITS.carKmPerWeek),
    publicTransitKmPerWeek: asNumber(
      o.publicTransitKmPerWeek,
      d.publicTransitKmPerWeek,
      INPUT_LIMITS.publicTransitKmPerWeek,
    ),
    shortHaulFlightsPerYear: asNumber(
      o.shortHaulFlightsPerYear,
      d.shortHaulFlightsPerYear,
      INPUT_LIMITS.flightsPerYear,
      true,
    ),
    longHaulFlightsPerYear: asNumber(
      o.longHaulFlightsPerYear,
      d.longHaulFlightsPerYear,
      INPUT_LIMITS.flightsPerYear,
      true,
    ),
  };
}

function coerceHome(raw: unknown): HomeProfile {
  const d = DEFAULT_PROFILE.home;
  const o = isObject(raw) ? raw : {};
  return {
    householdSize: asNumber(o.householdSize, d.householdSize, INPUT_LIMITS.householdSize, true),
    electricityKwhPerMonth: asNumber(
      o.electricityKwhPerMonth,
      d.electricityKwhPerMonth,
      INPUT_LIMITS.electricityKwhPerMonth,
    ),
    electricitySource: asEnum(o.electricitySource, ELECTRICITY_SOURCES, d.electricitySource),
    heatingFuel: asEnum(o.heatingFuel, HEATING_FUELS, d.heatingFuel),
    heatingKwhPerMonth: asNumber(
      o.heatingKwhPerMonth,
      d.heatingKwhPerMonth,
      INPUT_LIMITS.heatingKwhPerMonth,
    ),
  };
}

function coerceFood(raw: unknown): FoodProfile {
  const o = isObject(raw) ? raw : {};
  return { dietType: asEnum<DietType>(o.dietType, DIETS, DEFAULT_PROFILE.food.dietType) };
}

function coerceGoods(raw: unknown): GoodsProfile {
  const d = DEFAULT_PROFILE.goods;
  const o = isObject(raw) ? raw : {};
  return {
    consumptionLevel: asEnum<ConsumptionLevel>(o.consumptionLevel, CONSUMPTION_LEVELS, d.consumptionLevel),
    recyclingHabit: asEnum<RecyclingHabit>(o.recyclingHabit, RECYCLING_HABITS, d.recyclingHabit),
  };
}

/** Always returns a complete, valid profile, repairing/replacing bad fields. */
export function coerceProfile(raw: unknown): UserProfile {
  const o = isObject(raw) ? raw : {};
  return {
    transport: coerceTransport(o.transport),
    home: coerceHome(o.home),
    food: coerceFood(o.food),
    goods: coerceGoods(o.goods),
  };
}

/** Returns a valid goal, or null when the input does not describe one. */
export function coerceGoal(raw: unknown): Goal | null {
  if (!isObject(raw)) return null;
  const pct = raw.targetReductionPct;
  if (typeof pct !== 'number' && typeof pct !== 'string') return null;
  const n = Number(pct);
  if (!Number.isFinite(n) || n < INPUT_LIMITS.targetReductionPct.min) return null;
  return { targetReductionPct: asNumber(n, INPUT_LIMITS.targetReductionPct.min, INPUT_LIMITS.targetReductionPct, true) };
}

// Re-export the option keys so the UI can build controls from the same lists.
export {
  CAR_FUELS,
  DIETS,
  ELECTRICITY_SOURCES,
  HEATING_FUELS,
  CONSUMPTION_LEVELS,
  RECYCLING_HABITS,
};
