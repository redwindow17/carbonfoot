import { describe, expect, it } from 'vitest';
import { calculateFootprint, resolveHeatingFactor } from './calculator';
import { DEFAULT_PROFILE } from './defaults';
import { FOOTPRINT_CATEGORIES } from './types';
import type { UserProfile } from './types';

function withProfile(overrides: Partial<UserProfile>): UserProfile {
  return { ...DEFAULT_PROFILE, ...overrides };
}

describe('resolveHeatingFactor', () => {
  it('returns fixed factors for combustion fuels', () => {
    expect(resolveHeatingFactor('gas', 'standard')).toBeCloseTo(0.184);
    expect(resolveHeatingFactor('oil', 'standard')).toBeCloseTo(0.268);
    expect(resolveHeatingFactor('none', 'standard')).toBe(0);
  });

  it('uses the grid factor for electric heating', () => {
    expect(resolveHeatingFactor('electric', 'standard')).toBeCloseTo(0.475);
    expect(resolveHeatingFactor('electric', 'fullGreen')).toBeCloseTo(0.04);
  });

  it('divides the grid factor by the COP for a heat pump', () => {
    expect(resolveHeatingFactor('heatPump', 'standard')).toBeCloseTo(0.475 / 3);
  });
});

describe('calculateFootprint', () => {
  it('produces the expected breakdown for the default profile', () => {
    const result = calculateFootprint(DEFAULT_PROFILE);

    expect(result.byCategory.transport).toBe(1888); // 1326 car + 62 transit + 500 flight
    expect(result.byCategory.home).toBe(1131); // (1710 elec + 552 heat) / 2 people
    expect(result.byCategory.food).toBe(2500);
    expect(result.byCategory.goods).toBe(1700); // 1600 goods + 100 waste
    expect(result.totalKgPerYear).toBe(7219);
  });

  it('keeps the parts consistent with the whole', () => {
    const result = calculateFootprint(DEFAULT_PROFILE);
    const sumOfCategories = FOOTPRINT_CATEGORIES.reduce((s, c) => s + result.byCategory[c], 0);
    const sumOfLineItems = result.lineItems.reduce((s, item) => s + item.kgPerYear, 0);

    expect(sumOfCategories).toBe(result.totalKgPerYear);
    expect(sumOfLineItems).toBe(result.totalKgPerYear);
  });

  it('splits shared home energy across the household', () => {
    const solo = calculateFootprint(
      withProfile({ home: { ...DEFAULT_PROFILE.home, householdSize: 1 } }),
    );
    expect(solo.byCategory.home).toBe(2262); // full 1710 + 552, undivided
  });

  it('treats a missing car as zero transport from driving', () => {
    const result = calculateFootprint(
      withProfile({
        transport: { ...DEFAULT_PROFILE.transport, carFuel: 'none', carKmPerWeek: 0 },
      }),
    );
    const car = result.lineItems.find((i) => i.key === 'transport.car');
    expect(car?.kgPerYear).toBe(0);
  });

  it('clamps negative and non-finite inputs to zero', () => {
    const result = calculateFootprint(
      withProfile({
        transport: {
          ...DEFAULT_PROFILE.transport,
          carKmPerWeek: -500,
          publicTransitKmPerWeek: Number.NaN,
        },
      }),
    );
    expect(result.byCategory.transport).toBe(500); // only the one flight remains
  });

  it('never produces NaN even for an all-zero profile', () => {
    const result = calculateFootprint({
      transport: {
        carFuel: 'none',
        carKmPerWeek: 0,
        publicTransitKmPerWeek: 0,
        shortHaulFlightsPerYear: 0,
        longHaulFlightsPerYear: 0,
      },
      home: {
        householdSize: 1,
        electricityKwhPerMonth: 0,
        electricitySource: 'fullGreen',
        heatingFuel: 'none',
        heatingKwhPerMonth: 0,
      },
      food: { dietType: 'vegan' },
      goods: { consumptionLevel: 'low', recyclingHabit: 'most' },
    });
    expect(Number.isFinite(result.totalKgPerYear)).toBe(true);
    expect(result.totalKgPerYear).toBe(1450 + 800); // diet + goods only
  });
});
