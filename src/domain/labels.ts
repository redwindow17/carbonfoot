/**
 * Human-readable labels for each enum value. Kept in the domain layer (not the
 * UI) because both the recommendation copy and the form controls need the same
 * wording — a single source of truth avoids drift.
 */

import type {
  CarFuel,
  ConsumptionLevel,
  DietType,
  ElectricitySource,
  FootprintCategory,
  HeatingFuel,
  RecyclingHabit,
} from './types';

export const CATEGORY_LABELS: Record<FootprintCategory, string> = {
  transport: 'Transport',
  home: 'Home energy',
  food: 'Food',
  goods: 'Goods & waste',
};

export const CAR_FUEL_LABELS: Record<CarFuel, string> = {
  none: 'No car',
  petrol: 'Petrol',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
  electric: 'Electric',
};

export const DIET_LABELS: Record<DietType, string> = {
  heavyMeat: 'meat with most meals',
  mediumMeat: 'average meat-eating',
  lowMeat: 'low-meat',
  pescatarian: 'pescatarian',
  vegetarian: 'vegetarian',
  vegan: 'vegan',
};

export const ELECTRICITY_SOURCE_LABELS: Record<ElectricitySource, string> = {
  standard: 'Standard grid',
  partialGreen: 'Partly renewable',
  fullGreen: '100% renewable',
};

export const HEATING_FUEL_LABELS: Record<HeatingFuel, string> = {
  none: 'No heating',
  gas: 'Natural gas',
  oil: 'Heating oil',
  electric: 'Electric (resistive)',
  heatPump: 'Heat pump',
};

export const CONSUMPTION_LABELS: Record<ConsumptionLevel, string> = {
  low: 'Minimal — buy rarely, mostly used/repaired',
  medium: 'Average — occasional new purchases',
  high: 'High — frequent new clothes, gadgets, etc.',
};

export const RECYCLING_LABELS: Record<RecyclingHabit, string> = {
  none: "Rarely or never",
  some: 'Some of my waste',
  most: 'Most of my waste',
};
