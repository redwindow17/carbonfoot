import { describe, expect, it } from 'vitest';
import { compareToBenchmark, getBenchmark } from './benchmarks';

describe('getBenchmark', () => {
  it('returns the requested benchmark', () => {
    expect(getBenchmark('usa').label).toBe('USA average');
  });

  it('falls back to the first benchmark for an unknown id', () => {
    expect(getBenchmark('does-not-exist').id).toBe('world');
  });
});

describe('compareToBenchmark', () => {
  const benchmark = { id: 'test', label: 'Test', kgPerYear: 1000 };

  it('flags clearly higher footprints as "above"', () => {
    const c = compareToBenchmark(2000, benchmark);
    expect(c.verdict).toBe('above');
    expect(c.differencePct).toBe(100);
  });

  it('flags clearly lower footprints as "below"', () => {
    const c = compareToBenchmark(500, benchmark);
    expect(c.verdict).toBe('below');
    expect(c.differencePct).toBe(-50);
  });

  it('treats near-equal footprints as "similar"', () => {
    expect(compareToBenchmark(1050, benchmark).verdict).toBe('similar');
    expect(compareToBenchmark(950, benchmark).verdict).toBe('similar');
  });

  it('never divides by zero', () => {
    const c = compareToBenchmark(500, { id: 'z', label: 'Zero', kgPerYear: 0 });
    expect(Number.isFinite(c.ratio)).toBe(true);
  });
});
