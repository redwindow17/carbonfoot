/**
 * Footprint calculation engine.
 *
 * Every function here is pure: same input → same output, no side effects. That
 * makes the numbers easy to reason about, cheap to test, and safe to call on
 * every keystroke in the UI.
 */

import {
  CAR_KG_PER_KM,
  CONSUMPTION_KG_PER_YEAR,
  DIET_KG_PER_YEAR,
  ELECTRICITY_KG_PER_KWH,
  FLIGHT_KG,
  HEATING_KG_PER_KWH,
  HEAT_PUMP_COP,
  MONTHS_PER_YEAR,
  TRANSIT_KG_PER_KM,
  WASTE_PENALTY_KG_PER_YEAR,
  WEEKS_PER_YEAR,
} from './emissionFactors';
import {
  FOOTPRINT_CATEGORIES,
  type FootprintCategory,
  type FootprintLineItem,
  type FootprintResult,
  type GoodsProfile,
  type HeatingFuel,
  type HomeProfile,
  type ElectricitySource,
  type FoodProfile,
  type TransportProfile,
  type UserProfile,
} from './types';

/** Treats blanks, negatives, and NaN as zero so the maths can never explode. */
function nonNeg(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** kg CO₂e per kWh of heat delivered, resolving electric options vs the grid. */
export function resolveHeatingFactor(
  fuel: HeatingFuel,
  electricitySource: ElectricitySource,
): number {
  switch (fuel) {
    case 'none':
      return HEATING_KG_PER_KWH.none;
    case 'gas':
      return HEATING_KG_PER_KWH.gas;
    case 'oil':
      return HEATING_KG_PER_KWH.oil;
    case 'electric':
      return ELECTRICITY_KG_PER_KWH[electricitySource];
    case 'heatPump':
      return ELECTRICITY_KG_PER_KWH[electricitySource] / HEAT_PUMP_COP;
  }
}

export function calculateTransport(p: TransportProfile): FootprintLineItem[] {
  const carKg = nonNeg(p.carKmPerWeek) * WEEKS_PER_YEAR * CAR_KG_PER_KM[p.carFuel];
  const transitKg = nonNeg(p.publicTransitKmPerWeek) * WEEKS_PER_YEAR * TRANSIT_KG_PER_KM;
  const flightKg =
    nonNeg(p.shortHaulFlightsPerYear) * FLIGHT_KG.shortHaul +
    nonNeg(p.longHaulFlightsPerYear) * FLIGHT_KG.longHaul;

  return [
    { key: 'transport.car', category: 'transport', label: 'Car travel', kgPerYear: carKg },
    { key: 'transport.transit', category: 'transport', label: 'Public transit', kgPerYear: transitKg },
    { key: 'transport.flights', category: 'transport', label: 'Flights', kgPerYear: flightKg },
  ];
}

export function calculateHome(p: HomeProfile): FootprintLineItem[] {
  // Energy is a shared household resource, so divide it across the occupants.
  const occupants = Math.max(1, Math.floor(nonNeg(p.householdSize)) || 1);

  const electricityKg =
    nonNeg(p.electricityKwhPerMonth) *
    MONTHS_PER_YEAR *
    ELECTRICITY_KG_PER_KWH[p.electricitySource];

  const heatingKg =
    nonNeg(p.heatingKwhPerMonth) *
    MONTHS_PER_YEAR *
    resolveHeatingFactor(p.heatingFuel, p.electricitySource);

  return [
    {
      key: 'home.electricity',
      category: 'home',
      label: 'Electricity',
      kgPerYear: electricityKg / occupants,
    },
    {
      key: 'home.heating',
      category: 'home',
      label: 'Heating & hot water',
      kgPerYear: heatingKg / occupants,
    },
  ];
}

export function calculateFood(p: FoodProfile): FootprintLineItem[] {
  return [
    { key: 'food.diet', category: 'food', label: 'Diet', kgPerYear: DIET_KG_PER_YEAR[p.dietType] },
  ];
}

export function calculateGoods(p: GoodsProfile): FootprintLineItem[] {
  return [
    {
      key: 'goods.consumption',
      category: 'goods',
      label: 'Shopping & services',
      kgPerYear: CONSUMPTION_KG_PER_YEAR[p.consumptionLevel],
    },
    {
      key: 'goods.waste',
      category: 'goods',
      label: 'Waste & recycling',
      kgPerYear: WASTE_PENALTY_KG_PER_YEAR[p.recyclingHabit],
    },
  ];
}

function emptyCategoryTotals(): Record<FootprintCategory, number> {
  return { transport: 0, home: 0, food: 0, goods: 0 };
}

/**
 * Estimates a complete yearly footprint from a profile.
 *
 * Line items are rounded to whole kilograms first, then totals are summed from
 * those rounded values — so the parts shown in the UI always add up to the
 * displayed total.
 */
export function calculateFootprint(profile: UserProfile): FootprintResult {
  const rawItems: FootprintLineItem[] = [
    ...calculateTransport(profile.transport),
    ...calculateHome(profile.home),
    ...calculateFood(profile.food),
    ...calculateGoods(profile.goods),
  ];

  const lineItems = rawItems.map((item) => ({
    ...item,
    kgPerYear: Math.round(item.kgPerYear),
  }));

  const byCategory = emptyCategoryTotals();
  for (const item of lineItems) {
    byCategory[item.category] += item.kgPerYear;
  }

  const totalKgPerYear = FOOTPRINT_CATEGORIES.reduce(
    (sum, category) => sum + byCategory[category],
    0,
  );

  return { totalKgPerYear, byCategory, lineItems };
}
