/**
 * A neutral starting profile, roughly representing a typical urban resident.
 * Used to seed the calculator form so first-time users see a meaningful result
 * before they have entered anything.
 */

import type { UserProfile } from './types';

export const DEFAULT_PROFILE: UserProfile = {
  transport: {
    carFuel: 'petrol',
    carKmPerWeek: 150,
    publicTransitKmPerWeek: 20,
    shortHaulFlightsPerYear: 1,
    longHaulFlightsPerYear: 0,
  },
  home: {
    householdSize: 2,
    electricityKwhPerMonth: 300,
    electricitySource: 'standard',
    heatingFuel: 'gas',
    heatingKwhPerMonth: 250,
  },
  food: {
    dietType: 'mediumMeat',
  },
  goods: {
    consumptionLevel: 'medium',
    recyclingHabit: 'some',
  },
};
