/**
 * Core domain types for EcoTrack.
 *
 * This module is intentionally framework-agnostic: it contains no React or
 * browser dependencies so the business logic can be unit-tested in isolation
 * and reused anywhere.
 */

/** The four high-level areas a personal footprint is split into. */
export type FootprintCategory = 'transport' | 'home' | 'food' | 'goods';

/** Stable iteration/display order for the categories. */
export const FOOTPRINT_CATEGORIES: readonly FootprintCategory[] = [
  'transport',
  'home',
  'food',
  'goods',
];

// --- User-selectable options -------------------------------------------------

export type CarFuel = 'none' | 'petrol' | 'diesel' | 'hybrid' | 'electric';

export type DietType =
  | 'heavyMeat'
  | 'mediumMeat'
  | 'lowMeat'
  | 'pescatarian'
  | 'vegetarian'
  | 'vegan';

export type ElectricitySource = 'standard' | 'partialGreen' | 'fullGreen';

export type HeatingFuel = 'none' | 'gas' | 'oil' | 'electric' | 'heatPump';

export type ConsumptionLevel = 'low' | 'medium' | 'high';

export type RecyclingHabit = 'none' | 'some' | 'most';

// --- Profile sub-sections ----------------------------------------------------

export interface TransportProfile {
  carFuel: CarFuel;
  /** Distance personally driven by car each week, in kilometres. */
  carKmPerWeek: number;
  /** Distance travelled by bus/train/metro each week, in kilometres. */
  publicTransitKmPerWeek: number;
  /** Number of return short-haul flights per year (under ~3 hours). */
  shortHaulFlightsPerYear: number;
  /** Number of return long-haul flights per year (over ~6 hours). */
  longHaulFlightsPerYear: number;
}

export interface HomeProfile {
  /** People sharing the home; shared energy is divided across them. */
  householdSize: number;
  /** Whole-home electricity use, in kWh per month. */
  electricityKwhPerMonth: number;
  electricitySource: ElectricitySource;
  heatingFuel: HeatingFuel;
  /** Whole-home heating/hot-water energy, in kWh per month. */
  heatingKwhPerMonth: number;
}

export interface FoodProfile {
  dietType: DietType;
}

export interface GoodsProfile {
  consumptionLevel: ConsumptionLevel;
  recyclingHabit: RecyclingHabit;
}

/** Everything the calculator needs to estimate a yearly footprint. */
export interface UserProfile {
  transport: TransportProfile;
  home: HomeProfile;
  food: FoodProfile;
  goods: GoodsProfile;
}

// --- Calculation results -----------------------------------------------------

/** A single, transparent contributor to the total (e.g. "Car travel"). */
export interface FootprintLineItem {
  key: string;
  category: FootprintCategory;
  label: string;
  kgPerYear: number;
}

export interface FootprintResult {
  /** Total estimated emissions, in kg CO₂e per year. */
  totalKgPerYear: number;
  /** Emissions summed per category, in kg CO₂e per year. */
  byCategory: Record<FootprintCategory, number>;
  /** Granular contributors, useful for charts and recommendations. */
  lineItems: FootprintLineItem[];
}

// --- Recommendations ---------------------------------------------------------

export type EffortLevel = 'easy' | 'medium' | 'committed';

export interface Recommendation {
  id: string;
  category: FootprintCategory;
  title: string;
  /** Personalised explanation referencing the user's own numbers. */
  rationale: string;
  /** Estimated reduction if adopted, in kg CO₂e per year. */
  annualSavingsKg: number;
  effort: EffortLevel;
}

// --- Goals, progress & history ----------------------------------------------

export interface Goal {
  /** Target reduction relative to the baseline, as a percentage (1–100). */
  targetReductionPct: number;
}

export interface FootprintSnapshot {
  id: string;
  /** ISO-8601 timestamp of when the snapshot was taken. */
  dateISO: string;
  totalKgPerYear: number;
  byCategory: Record<FootprintCategory, number>;
}
