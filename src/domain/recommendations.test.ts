import { describe, expect, it } from 'vitest';
import { calculateFootprint } from './calculator';
import { DEFAULT_PROFILE } from './defaults';
import { generateRecommendations } from './recommendations';
import type { UserProfile } from './types';

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

  it('suggests cutting a long-haul flight when the user takes one', () => {
    const recs = generateRecommendations(
      { ...DEFAULT_PROFILE, transport: { ...DEFAULT_PROFILE.transport, longHaulFlightsPerYear: 1 } },
      calculateFootprint({
        ...DEFAULT_PROFILE,
        transport: { ...DEFAULT_PROFILE.transport, longHaulFlightsPerYear: 1 },
      }),
    );
    const longHaul = recs.find((r) => r.id === 'flights-long-reduce');
    expect(longHaul?.annualSavingsKg).toBe(2500);
  });

  it('is deterministic', () => {
    const a = recommendIds(DEFAULT_PROFILE);
    const b = recommendIds(DEFAULT_PROFILE);
    expect(a).toEqual(b);
  });
});
