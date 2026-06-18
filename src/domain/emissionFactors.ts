/**
 * Emission factors used by the calculator.
 *
 * All values are expressed in kg CO₂e and are deliberately kept in one place
 * so they can be audited, cited, and adjusted without touching calculation
 * logic. Figures are rounded, real-world averages drawn from public sources
 * (IEA grid intensities, UK DEFRA/BEIS conversion factors, Our World in Data,
 * and Scarborough et al. 2014 for dietary footprints). They are estimates for
 * awareness, not a certified inventory — see README "Assumptions".
 */

import type {
  CarFuel,
  ConsumptionLevel,
  DietType,
  ElectricitySource,
  HeatingFuel,
  RecyclingHabit,
} from './types';

/** Transport emissions in kg CO₂e per passenger-kilometre. */
export const CAR_KG_PER_KM: Record<CarFuel, number> = {
  none: 0,
  petrol: 0.17,
  diesel: 0.171,
  hybrid: 0.11,
  electric: 0.053,
};

/** Blended bus/rail average, kg CO₂e per passenger-kilometre. */
export const TRANSIT_KG_PER_KM = 0.06;

/** Per return-flight estimates, kg CO₂e, including non-CO₂ radiative forcing. */
export const FLIGHT_KG = {
  shortHaul: 500,
  longHaul: 2500,
} as const;

/** Grid electricity intensity, kg CO₂e per kWh, by how green the supply is. */
export const ELECTRICITY_KG_PER_KWH: Record<ElectricitySource, number> = {
  standard: 0.475,
  partialGreen: 0.23,
  fullGreen: 0.04,
};

/**
 * Direct heating-fuel intensity, kg CO₂e per kWh of heat delivered.
 * `electric` and `heatPump` are resolved against the grid factor at
 * calculation time (a heat pump moves ~3 kWh of heat per kWh of electricity).
 */
export const HEATING_KG_PER_KWH: Record<Exclude<HeatingFuel, 'electric' | 'heatPump'>, number> = {
  none: 0,
  gas: 0.184,
  oil: 0.268,
};

/** Coefficient of performance assumed for an electric heat pump. */
export const HEAT_PUMP_COP = 3;

/** Annual food-related emissions, kg CO₂e per person, by diet. */
export const DIET_KG_PER_YEAR: Record<DietType, number> = {
  heavyMeat: 3300,
  mediumMeat: 2500,
  lowMeat: 1950,
  pescatarian: 1850,
  vegetarian: 1700,
  vegan: 1450,
};

/** Annual goods & services emissions, kg CO₂e per person, by consumption level. */
export const CONSUMPTION_KG_PER_YEAR: Record<ConsumptionLevel, number> = {
  low: 800,
  medium: 1600,
  high: 3000,
};

/** Extra annual emissions from sending recyclable waste to landfill, kg CO₂e. */
export const WASTE_PENALTY_KG_PER_YEAR: Record<RecyclingHabit, number> = {
  none: 250,
  some: 100,
  most: 0,
};

/** Weeks per year and months per year, named for readable conversions. */
export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;
