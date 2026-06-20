/**
 * Category breakdown as horizontal bars.
 *
 * Accessibility note: every value is written out as text, so the chart is fully
 * understandable without seeing it. The coloured bars carry no information that
 * the text does not, so they are marked `aria-hidden`.
 */

import { CATEGORY_LABELS, FOOTPRINT_CATEGORIES, type FootprintResult } from '../domain';
import { CATEGORY_META } from '../ui/categoryMeta';
import { formatKg, formatPercent } from '../utils/format';

export function BreakdownChart({ result }: { result: FootprintResult }) {
  const total = result.totalKgPerYear;
  const rows = [...FOOTPRINT_CATEGORIES].sort(
    (a, b) => result.byCategory[b] - result.byCategory[a],
  );

  return (
    <section className="card breakdown" aria-labelledby="breakdown-heading">
      <h2 className="card__title" id="breakdown-heading">
        Where it comes from
      </h2>
      <ul className="breakdown__list">
        {rows.map((category) => {
          const kg = result.byCategory[category];
          const pct = total > 0 ? (kg / total) * 100 : 0;
          const meta = CATEGORY_META[category];
          return (
            <li key={category} className="breakdown__row">
              <div className="breakdown__head">
                <span className="breakdown__label">
                  <span aria-hidden="true">{meta.icon}</span> {CATEGORY_LABELS[category]}
                </span>
                <span className="breakdown__value">
                  {formatKg(kg)} <span className="breakdown__pct">({formatPercent(pct)})</span>
                </span>
              </div>
              <div className="breakdown__track" aria-hidden="true">
                <div
                  className="breakdown__bar"
                  style={{ width: `${Math.min(100, pct)}%`, backgroundColor: meta.color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
