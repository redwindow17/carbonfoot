import { beforeEach, describe, expect, it } from 'vitest';
import { clearPersistedState, loadPersistedState, savePersistedState } from './storage';
import { DEFAULT_PROFILE } from '../domain';

const STORAGE_KEY = 'ecotrack:state';

beforeEach(() => {
  window.localStorage.clear();
});

describe('persistence round-trip', () => {
  it('saves and reloads state', () => {
    savePersistedState({
      profile: DEFAULT_PROFILE,
      goal: { targetReductionPct: 25 },
      committedRecommendationIds: ['car-ev'],
      history: [
        {
          id: 's1',
          dateISO: '2026-01-01T00:00:00.000Z',
          totalKgPerYear: 7000,
          byCategory: { transport: 1800, home: 1200, food: 2500, goods: 1500 },
        },
      ],
    });

    const loaded = loadPersistedState();
    expect(loaded?.profile).toEqual(DEFAULT_PROFILE);
    expect(loaded?.goal).toEqual({ targetReductionPct: 25 });
    expect(loaded?.committedRecommendationIds).toEqual(['car-ev']);
    expect(loaded?.history).toHaveLength(1);
  });

  it('clears state', () => {
    savePersistedState({
      profile: DEFAULT_PROFILE,
      goal: null,
      committedRecommendationIds: [],
      history: [],
    });
    clearPersistedState();
    expect(loadPersistedState()).toBeNull();
  });
});

describe('defensive reads', () => {
  it('returns null when nothing is stored', () => {
    expect(loadPersistedState()).toBeNull();
  });

  it('returns null on corrupt JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{ not valid json');
    expect(loadPersistedState()).toBeNull();
  });

  it('discards data from an unknown schema version', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 999, profile: DEFAULT_PROFILE }),
    );
    expect(loadPersistedState()).toBeNull();
  });

  it('sanitises a tampered profile rather than trusting it', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        profile: { transport: { carFuel: 'rocket', carKmPerWeek: -999 } },
        goal: { targetReductionPct: 'lots' },
        committedRecommendationIds: ['ok', 42, null],
        history: 'not-an-array',
      }),
    );

    const loaded = loadPersistedState();
    expect(loaded?.profile.transport.carFuel).toBe(DEFAULT_PROFILE.transport.carFuel);
    expect(loaded?.profile.transport.carKmPerWeek).toBe(0);
    expect(loaded?.goal).toBeNull();
    expect(loaded?.committedRecommendationIds).toEqual(['ok']); // non-strings dropped
    expect(loaded?.history).toEqual([]);
  });

  it('drops malformed history entries', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        profile: DEFAULT_PROFILE,
        goal: null,
        committedRecommendationIds: [],
        history: [
          { id: 'good', dateISO: '2026-01-01T00:00:00.000Z', totalKgPerYear: 100, byCategory: {} },
          { missing: 'id and date' },
        ],
      }),
    );

    const loaded = loadPersistedState();
    expect(loaded?.history).toHaveLength(1);
    expect(loaded?.history[0]?.id).toBe('good');
    // Missing category totals are backfilled with zeros, not left undefined.
    expect(loaded?.history[0]?.byCategory.transport).toBe(0);
  });
});
