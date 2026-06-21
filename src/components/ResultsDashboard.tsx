/**
 * The "Insights" overview: the headline number with a relatable equivalence,
 * the category breakdown, and the benchmark comparison.
 */

import { useApp } from '../app/appContext';
import { formatKg, formatNumber, formatTonnes } from '../utils/format';
import { BreakdownChart } from './BreakdownChart';
import { ComparisonCard } from './ComparisonCard';

/** Approx. CO₂ a mature tree absorbs per year — used for a tangible comparison. */
const TREE_CO2_KG_PER_YEAR = 21;

export function ResultsDashboard() {
  const { result } = useApp();
  const trees = Math.max(1, Math.round(result.totalKgPerYear / TREE_CO2_KG_PER_YEAR));

  return (
    <div className="dashboard">
      <section className="card dashboard__hero" aria-labelledby="dashboard-heading">
        <p className="dashboard__eyebrow" id="dashboard-heading">
          Your estimated annual footprint
        </p>
        <p className="dashboard__total">
          {formatKg(result.totalKgPerYear)} <span className="dashboard__unit">CO₂e</span>
        </p>
        <p className="dashboard__sub">
          ≈ {formatTonnes(result.totalKgPerYear)} — roughly the CO₂ that{' '}
          {formatNumber(trees)} trees absorb in a year.
        </p>
      </section>

      <div className="dashboard__grid">
        <BreakdownChart result={result} />
        <ComparisonCard totalKgPerYear={result.totalKgPerYear} />
      </div>
    </div>
  );
}
