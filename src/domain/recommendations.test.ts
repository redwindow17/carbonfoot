import { describe, expect, it } from 'vitest';
import { calculateFootprint } from './calculator';
import { DEFAULT_PROFILE } from './defaults';
import { CONSUMPTION_KG_PER_YEAR, FLIGHT_KG } from './emissionFactors';
import {
  generateRecommendations,
  savingFromFactorSwap,
  tierStepDownSaving,
} from './recommendations';
import type { ConsumptionLevel, UserProfile } from './types';

function recommendIds(profile: UserProfile): string[] {
  return generateRecommendations(profile, calculateFootprint(profile)).map((r) => r.id);
}

describe('generateRecommendations', () => {
  it('returns context-relevant actions for the default profile', () => {
    const ids = recommendIds(DEFAULT_PROFILE);
    expect(ids).toContain('electricity-renewable');
    expect(ids).toContain('diet-step-down');
    expect(ids).toContain('car-ev');
    // No long-haul flights in the default profile → no such suggestion.
    expect(ids).not.toContain('flights-long-reduce');
  });

  it('orders recommendations by estimated saving, largest first', () => {
    const recs = generateRecommendations(DEFAULT_PROFILE, calculateFootprint(DEFAULT_PROFILE));
    for (let i = 1; i < recs.length; i += 1) {
      const prev = recs[i - 1];
      const curr = recs[i];
      expect(prev && curr && prev.annualSavingsKg >= curr.annualSavingsKg).toBe(true);
    }
  });

  it('only ever proposes actions with a meaningful saving', () => {
    const recs = generateRecommendations(DEFAULT_PROFILE, calculateFootprint(DEFAULT_PROFILE));
    expect(recs.every((r) => r.annualSavingsKg >= 25)).toBe(true);
  });

  it('suppresses car advice for someone without a car', () => {
    const ids = recommendIds({
      ...DEFAULT_PROFILE,
      transport: { ...DEFAULT_PROFILE.transport, carFuel: 'none', carKmPerWeek: 0 },
    });
    expect(ids).not.toContain('car-reduce');
    expect(ids).not.toContain('car-ev');
  });

  it('does not suggest a renewable tariff to someone already on one', () => {
    const ids = recommendIds({
      ...DEFAULT_PROFILE,
      home: { ...DEFAULT_PROFILE.home, electricitySource: 'fullGreen' },
    });
    expect(ids).not.toContain('electricity-renewable');
  });

  it('does not nudge the diet of an existing vegan', () => {
    const ids = recommendIds({ ...DEFAULT_PROFILE, food: { dietType: 'vegan' } });
    expect(ids).not.toContain('diet-step-down');
  });

  it('does not suggest recycling more to a thorough recycler', () => {
    const ids = recommendIds({
      ...DEFAULT_PROFILE,
      goods: { ...DEFAULT_PROFILE.goods, recyclingHabit: 'most' },
    });
    expect(ids).not.toContain('recycle-more');
  });

  it('suggests cutting a long-haul flight, valued from the flight factor', () => {
    const profile = {
      ...DEFAULT_PROFILE,
      transport: { ...DEFAULT_PROFILE.transport, longHaulFlightsPerYear: 1 },
    };
    const recs = generateRecommendations(profile, calculateFootprint(profile));
    const longHaul = recs.find((r) => r.id === 'flights-long-reduce');
    expect(longHaul?.annualSavingsKg).toBe(FLIGHT_KG.longHaul);
  });

  it('values short-haul-to-rail from the flight factor less the train trip', () => {
    const recs = generateRecommendations(DEFAULT_PROFILE, calculateFootprint(DEFAULT_PROFILE));
    const rail = recs.find((r) => r.id === 'flights-short-to-rail');
    // Default profile takes one short-haul flight: 500 (flight) − 40 (train) = 460.
    expect(rail?.annualSavingsKg).toBe(FLIGHT_KG.shortHaul - 40);
  });

  it('frames the final diet step as going fully plant-based', () => {
    const profile: UserProfile = { ...DEFAULT_PROFILE, food: { dietType: 'vegetarian' } };
    const recs = generateRecommendations(profile, calculateFootprint(profile));
    const diet = recs.find((r) => r.id === 'diet-step-down');
    expect(diet?.title).toBe('Try a fully plant-based diet');
  });

  it('treats missing line items as zero (defensive against an empty result)', () => {
    // A result with no line items must not crash the line-item lookups.
    const recs = generateRecommendations(DEFAULT_PROFILE, {
      totalKgPerYear: 0,
      byCategory: { transport: 0, home: 0, food: 0, goods: 0 },
      lineItems: [],
    });
    expect(Array.isArray(recs)).toBe(true);
    // Rules that depend on line items (car, electricity, heating) drop out at zero.
    expect(recs.map((r) => r.id)).not.toContain('car-reduce');
  });

  it('breaks a tie in saving by preferring the lower-effort action', () => {
    // lowMeat→vegetarian and recycling 'none' both save exactly 250 kg/yr.
    const profile: UserProfile = {
      ...DEFAULT_PROFILE,
      food: { dietType: 'lowMeat' },
      goods: { ...DEFAULT_PROFILE.goods, recyclingHabit: 'none' },
    };
    const recs = generateRecommendations(profile, calculateFootprint(profile));
    const diet = recs.find((r) => r.id === 'diet-step-down');
    const recycle = recs.find((r) => r.id === 'recycle-more');

    expect(diet?.annualSavingsKg).toBe(250);
    expect(recycle?.annualSavingsKg).toBe(250);
    // Equal savings → the easier action ('easy' recycle) ranks before the diet ('medium').
    expect(recs.indexOf(recycle as (typeof recs)[number])).toBeLessThan(
      recs.indexOf(diet as (typeof recs)[number]),
    );
  });

  it('is deterministic', () => {
    const a = recommendIds(DEFAULT_PROFILE);
    const b = recommendIds(DEFAULT_PROFILE);
    expect(a).toEqual(b);
  });
});

describe('savingFromFactorSwap', () => {
  it('scales the saving by the relative improvement of the factor', () => {
    // Halving the carbon factor avoids half the emissions.
    expect(savingFromFactorSwap(1000, 0.2, 0.1)).toBeCloseTo(500);
  });

  it('returns zero when there is no current factor to improve on', () => {
    expect(savingFromFactorSwap(1000, 0, 0.1)).toBe(0);
  });
});

describe('tierStepDownSaving', () => {
  const NEXT: Record<ConsumptionLevel, ConsumptionLevel | null> = {
    high: 'medium',
    medium: 'low',
    low: null,
  };

  it('returns the gap down to the next, cleaner tier', () => {
    expect(tierStepDownSaving('high', NEXT, CONSUMPTION_KG_PER_YEAR)).toBe(
      CONSUMPTION_KG_PER_YEAR.high - CONSUMPTION_KG_PER_YEAR.medium,
    );
  });

  it('returns zero at the cleanest tier', () => {
    expect(tierStepDownSaving('low', NEXT, CONSUMPTION_KG_PER_YEAR)).toBe(0);
  });
});
