import { describe, expect, it } from 'vitest';
import { createSnapshot, summarizeProgress, totalCommittedSavings, trendPct } from './progress';
import type { FootprintResult, FootprintSnapshot, Recommendation } from './types';

function rec(annualSavingsKg: number, id = `r-${annualSavingsKg}`): Recommendation {
  return { id, category: 'transport', title: id, rationale: '', annualSavingsKg, effort: 'easy' };
}

describe('totalCommittedSavings', () => {
  it('sums committed savings', () => {
    expect(totalCommittedSavings(5000, [rec(1000), rec(500)])).toBe(1500);
  });

  it('never exceeds the baseline (savings are not strictly additive)', () => {
    expect(totalCommittedSavings(1000, [rec(800), rec(800)])).toBe(1000);
  });
});

describe('summarizeProgress', () => {
  it('projects the footprint downward from committed actions', () => {
    const p = summarizeProgress(7000, [rec(1000)], null);
    expect(p.projectedKg).toBe(6000);
    expect(p.targetKg).toBeNull();
  });

  it('tracks partial progress toward a goal', () => {
    const p = summarizeProgress(1000, [rec(100)], { targetReductionPct: 20 });
    expect(p.targetKg).toBe(800);
    expect(p.goalProgressPct).toBe(50); // 100 of the 200 required
    expect(p.goalMet).toBe(false);
  });

  it('marks a goal met and clamps progress at 100%', () => {
    const p = summarizeProgress(1000, [rec(300)], { targetReductionPct: 20 });
    expect(p.goalMet).toBe(true);
    expect(p.goalProgressPct).toBe(100);
  });

  it('ignores a non-positive goal', () => {
    const p = summarizeProgress(1000, [], { targetReductionPct: 0 });
    expect(p.targetKg).toBeNull();
  });
});

describe('createSnapshot', () => {
  it('captures the total and a copy of the category totals', () => {
    const result: FootprintResult = {
      totalKgPerYear: 100,
      byCategory: { transport: 40, home: 30, food: 20, goods: 10 },
      lineItems: [],
    };
    const snap = createSnapshot(result, 'id-1', '2026-01-01T00:00:00.000Z');
    expect(snap).toEqual({
      id: 'id-1',
      dateISO: '2026-01-01T00:00:00.000Z',
      totalKgPerYear: 100,
      byCategory: { transport: 40, home: 30, food: 20, goods: 10 },
    });
    // Mutating the source must not affect the snapshot.
    result.byCategory.transport = 999;
    expect(snap.byCategory.transport).toBe(40);
  });
});

describe('trendPct', () => {
  const snap = (total: number, id: string): FootprintSnapshot => ({
    id,
    dateISO: '2026-01-01T00:00:00.000Z',
    totalKgPerYear: total,
    byCategory: { transport: total, home: 0, food: 0, goods: 0 },
  });

  it('returns the percentage change from first to last', () => {
    expect(trendPct([snap(1000, 'a'), snap(900, 'b'), snap(800, 'c')])).toBe(-20);
  });

  it('returns null with fewer than two snapshots', () => {
    expect(trendPct([])).toBeNull();
    expect(trendPct([snap(1000, 'a')])).toBeNull();
  });
});
