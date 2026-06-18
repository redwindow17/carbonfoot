/**
 * The personalised action list. Each item is generated and ranked by the
 * recommendation engine; ticking one records a commitment that the Progress tab
 * projects forward. Checkboxes are described by their card heading so screen
 * readers announce which action is being committed to.
 */

import { type EffortLevel } from '../domain';
import { useApp } from '../app/appContext';
import { formatKg } from '../utils/format';

const EFFORT_META: Record<EffortLevel, { label: string; className: string }> = {
  easy: { label: 'Easy win', className: 'badge--easy' },
  medium: { label: 'Some effort', className: 'badge--medium' },
  committed: { label: 'Bigger commitment', className: 'badge--committed' },
};

export function Recommendations() {
  const { recommendations, isCommitted, toggleCommitment } = useApp();

  if (recommendations.length === 0) {
    return (
      <section className="card recommendations" aria-labelledby="recs-heading">
        <h3 className="card__title" id="recs-heading">
          Your action plan
        </h3>
        <p className="recommendations__empty">
          🎉 Your footprint is already low across the board — there are no high-impact actions to
          suggest right now. Keep it up!
        </p>
      </section>
    );
  }

  const totalPotential = recommendations.reduce((sum, rec) => sum + rec.annualSavingsKg, 0);

  return (
    <section className="card recommendations" aria-labelledby="recs-heading">
      <h3 className="card__title" id="recs-heading">
        Your action plan
      </h3>
      <p className="recommendations__intro">
        Personalised to your footprint and ordered by impact. Tick the actions you&apos;ll try —
        the <strong>Progress</strong> tab tracks them. Together these could save up to about{' '}
        <strong>{formatKg(totalPotential)}</strong> a year.
      </p>

      <ul className="recommendations__list">
        {recommendations.map((rec) => {
          const effort = EFFORT_META[rec.effort];
          const committed = isCommitted(rec.id);
          const titleId = `rec-${rec.id}-title`;
          return (
            <li
              key={rec.id}
              className={`recommendation${committed ? ' recommendation--committed' : ''}`}
            >
              <div className="recommendation__body">
                <h4 className="recommendation__title" id={titleId}>
                  {rec.title}
                </h4>
                <p className="recommendation__rationale">{rec.rationale}</p>
                <div className="recommendation__meta">
                  <span className={`badge ${effort.className}`}>{effort.label}</span>
                  <span className="recommendation__savings">
                    Saves ~{formatKg(rec.annualSavingsKg)} / yr
                  </span>
                </div>
              </div>
              <label className="recommendation__commit">
                <input
                  type="checkbox"
                  checked={committed}
                  aria-describedby={titleId}
                  onChange={() => toggleCommitment(rec.id)}
                />
                <span>{committed ? "I'm doing this" : "I'll try this"}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
