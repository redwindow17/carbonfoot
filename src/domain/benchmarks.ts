/**
 * Reference footprints for context. Comparing a single number against a
 * familiar yardstick ("how do I stack up against the world average?") is one of
 * the clearest ways to make an abstract figure feel real.
 *
 * Figures are approximate annual per-capita CO₂ values (Our World in Data); the
 * science-based target reflects the ~2.3 t/person needed by 2030 to stay on a
 * 1.5 °C pathway (IPCC). See README "Assumptions" for the caveats.
 */

export interface Benchmark {
  id: string;
  label: string;
  kgPerYear: number;
}

export const BENCHMARKS: readonly Benchmark[] = [
  { id: 'world', label: 'World average', kgPerYear: 4700 },
  { id: 'india', label: 'India average', kgPerYear: 1900 },
  { id: 'china', label: 'China average', kgPerYear: 7600 },
  { id: 'uk', label: 'UK average', kgPerYear: 5500 },
  { id: 'eu', label: 'EU average', kgPerYear: 7000 },
  { id: 'usa', label: 'USA average', kgPerYear: 16000 },
];

export const DEFAULT_BENCHMARK_ID = 'world';

/** Per-person annual budget consistent with limiting warming to 1.5 °C. */
export const PARIS_TARGET_KG_PER_YEAR = 2300;

export type BenchmarkVerdict = 'below' | 'similar' | 'above';

export interface BenchmarkComparison {
  benchmark: Benchmark;
  /** User total divided by the benchmark (1 = identical). */
  ratio: number;
  /** Signed difference vs the benchmark, as a percentage. */
  differencePct: number;
  verdict: BenchmarkVerdict;
}

export function getBenchmark(id: string): Benchmark {
  return BENCHMARKS.find((b) => b.id === id) ?? BENCHMARKS[0];
}

export function compareToBenchmark(
  totalKgPerYear: number,
  benchmark: Benchmark,
): BenchmarkComparison {
  // Guard against a zero/!finite benchmark to avoid division blow-ups.
  const reference = benchmark.kgPerYear > 0 ? benchmark.kgPerYear : 1;
  const ratio = totalKgPerYear / reference;
  const differencePct = Math.round((ratio - 1) * 100);

  let verdict: BenchmarkVerdict;
  if (ratio < 0.9) {
    verdict = 'below';
  } else if (ratio <= 1.1) {
    verdict = 'similar';
  } else {
    verdict = 'above';
  }

  return { benchmark, ratio, differencePct, verdict };
}
