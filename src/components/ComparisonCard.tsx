/**
 * Puts the user's total in context against a chosen regional average and the
 * per-person target consistent with 1.5 °C. Bars are decorative; the figures
 * and the verdict sentence carry the meaning for assistive tech.
 */

import { useId, useState } from 'react';
import {
  BENCHMARKS,
  compareToBenchmark,
  DEFAULT_BENCHMARK_ID,
  getBenchmark,
  PARIS_TARGET_KG_PER_YEAR,
} from '../domain';
import { formatKg, formatSignedPercent } from '../utils/format';

const VERDICT_TEXT: Record<'below' | 'similar' | 'above', string> = {
  below: 'below',
  similar: 'about the same as',
  above: 'above',
};

interface ComparisonBarProps {
  label: string;
  kg: number;
  max: number;
  color: string;
}

function ComparisonBar({ label, kg, max, color }: ComparisonBarProps) {
  const pct = max > 0 ? (kg / max) * 100 : 0;
  return (
    <li className="comparison__row">
      <span className="comparison__label">{label}</span>
      <div className="comparison__track" aria-hidden="true">
        <div
          className="comparison__bar"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
        />
      </div>
      <span className="comparison__value">{formatKg(kg)}</span>
    </li>
  );
}

export function ComparisonCard({ totalKgPerYear }: { totalKgPerYear: number }) {
  const selectId = useId();
  const [benchmarkId, setBenchmarkId] = useState(DEFAULT_BENCHMARK_ID);
  const benchmark = getBenchmark(benchmarkId);
  const comparison = compareToBenchmark(totalKgPerYear, benchmark);
  const max = Math.max(totalKgPerYear, benchmark.kgPerYear, PARIS_TARGET_KG_PER_YEAR);

  return (
    <section className="card comparison" aria-labelledby="comparison-heading">
      <h3 className="card__title" id="comparison-heading">
        How you compare
      </h3>

      <div className="field comparison__picker">
        <label className="field__label" htmlFor={selectId}>
          Compare against
        </label>
        <select
          id={selectId}
          className="field__input field__input--select"
          value={benchmarkId}
          onChange={(event) => setBenchmarkId(event.target.value)}
        >
          {BENCHMARKS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      <p className="comparison__verdict">
        Your footprint is{' '}
        <strong>
          {formatSignedPercent(comparison.differencePct)} ({VERDICT_TEXT[comparison.verdict]})
        </strong>{' '}
        the {benchmark.label.toLowerCase()} of {formatKg(benchmark.kgPerYear)} per person.
      </p>

      <ul className="comparison__list">
        <ComparisonBar label="You" kg={totalKgPerYear} max={max} color="var(--accent)" />
        <ComparisonBar label={benchmark.label} kg={benchmark.kgPerYear} max={max} color="var(--muted-bar)" />
        <ComparisonBar
          label="1.5 °C target"
          kg={PARIS_TARGET_KG_PER_YEAR}
          max={max}
          color="var(--target-bar)"
        />
      </ul>
      <p className="comparison__note">
        The 1.5 °C target (~{formatKg(PARIS_TARGET_KG_PER_YEAR)}) is the per-person budget needed by
        2030 to keep global warming in check.
      </p>
    </section>
  );
}
