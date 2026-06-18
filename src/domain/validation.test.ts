import { describe, expect, it } from 'vitest';
import { asNumber, coerceGoal, coerceProfile, INPUT_LIMITS } from './validation';
import { DEFAULT_PROFILE } from './defaults';

describe('asNumber', () => {
  const limit = { min: 0, max: 10 };

  it('falls back when the value is not a number', () => {
    expect(asNumber('abc', 5, limit)).toBe(5);
    expect(asNumber(undefined, 5, limit)).toBe(5);
    expect(asNumber('', 5, limit)).toBe(5);
  });

  it('clamps to the allowed range', () => {
    expect(asNumber(20, 0, limit)).toBe(10);
    expect(asNumber(-3, 0, limit)).toBe(0);
  });

  it('parses numeric strings and can round to integers', () => {
    expect(asNumber('7.6', 0, limit)).toBeCloseTo(7.6);
    expect(asNumber('7.6', 0, limit, true)).toBe(8);
  });
});

describe('coerceProfile', () => {
  it('returns the defaults for empty/garbage input', () => {
    expect(coerceProfile({})).toEqual(DEFAULT_PROFILE);
    expect(coerceProfile(null)).toEqual(DEFAULT_PROFILE);
    expect(coerceProfile('not an object')).toEqual(DEFAULT_PROFILE);
  });

  it('repairs invalid enums and out-of-range numbers field by field', () => {
    const profile = coerceProfile({
      transport: { carFuel: 'rocket', carKmPerWeek: -50, shortHaulFlightsPerYear: 2.7 },
      home: { householdSize: 0, electricityKwhPerMonth: 9_999_999 },
      food: { dietType: 'carnivore' },
      goods: { recyclingHabit: 'sometimes' },
    });

    expect(profile.transport.carFuel).toBe(DEFAULT_PROFILE.transport.carFuel); // bad enum → default
    expect(profile.transport.carKmPerWeek).toBe(0); // negative → clamped
    expect(profile.transport.shortHaulFlightsPerYear).toBe(3); // rounded to integer
    expect(profile.home.householdSize).toBe(INPUT_LIMITS.householdSize.min); // 0 → min of 1
    expect(profile.home.electricityKwhPerMonth).toBe(INPUT_LIMITS.electricityKwhPerMonth.max);
    expect(profile.food.dietType).toBe(DEFAULT_PROFILE.food.dietType);
    expect(profile.goods.recyclingHabit).toBe(DEFAULT_PROFILE.goods.recyclingHabit);
  });
});

describe('coerceGoal', () => {
  it('accepts a valid goal', () => {
    expect(coerceGoal({ targetReductionPct: 30 })).toEqual({ targetReductionPct: 30 });
  });

  it('clamps an over-large goal', () => {
    expect(coerceGoal({ targetReductionPct: 200 })).toEqual({ targetReductionPct: 100 });
  });

  it('rejects missing, zero, or non-object goals', () => {
    expect(coerceGoal({})).toBeNull();
    expect(coerceGoal({ targetReductionPct: 0 })).toBeNull();
    expect(coerceGoal(null)).toBeNull();
    expect(coerceGoal('20%')).toBeNull();
  });
});
