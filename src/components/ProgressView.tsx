/**
 * Goal setting and progress tracking.
 *
 * The slider sets a reduction target; committed actions (ticked under Insights)
 * project the footprint downward; and snapshots build a history so users can
 * see real change over time. The goal bar uses role="progressbar" with a
 * descriptive `aria-valuetext`, and saving a snapshot announces via a polite
 * live region.
 */

import { useState } from 'react';
import { INPUT_LIMITS, trendPct } from '../domain';
import { useApp } from '../app/appContext';
import { formatKg, formatPercent, formatSignedPercent } from '../utils/format';

const GOAL_MIN = 5;
const GOAL_MAX = 50;
const GOAL_STEP = 5;

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function ProgressView() {
  const { result, goal, setGoal, progress, committedRecommendations, history, saveSnapshot } =
    useApp();
  const [draftPct, setDraftPct] = useState(goal?.targetReductionPct ?? 20);
  const [status, setStatus] = useState('');

  const overallTrend = trendPct(history);

  function handleSaveSnapshot() {
    saveSnapshot();
    setStatus(`Snapshot saved: ${formatKg(result.totalKgPerYear)} CO₂e per year.`);
  }

  return (
    <div className="progress">
      {/* Goal setting */}
      <section className="card" aria-labelledby="goal-heading">
        <h3 className="card__title" id="goal-heading">
          Set a reduction goal
        </h3>
        <div className="goal__control">
          <label className="field__label" htmlFor="goal-slider">
            Cut my footprint by{' '}
            <strong>
              {formatPercent(draftPct)} ({formatKg((progress.baselineKg * draftPct) / 100)})
            </strong>
          </label>
          <input
            id="goal-slider"
            className="goal__slider"
            type="range"
            min={GOAL_MIN}
            max={GOAL_MAX}
            step={GOAL_STEP}
            value={draftPct}
            aria-valuetext={`${draftPct} percent reduction`}
            onChange={(event) => {
              const pct = Math.min(
                INPUT_LIMITS.targetReductionPct.max,
                Number(event.target.value),
              );
              setDraftPct(pct);
              if (goal) setGoal({ targetReductionPct: pct });
            }}
          />
          <div className="goal__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => setGoal({ targetReductionPct: draftPct })}
            >
              {goal ? 'Update goal' : 'Set goal'}
            </button>
            {goal ? (
              <button type="button" className="button button--ghost" onClick={() => setGoal(null)}>
                Remove goal
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Projection */}
      <section className="card" aria-labelledby="projection-heading">
        <h3 className="card__title" id="projection-heading">
          Your projection
        </h3>
        <dl className="projection__stats">
          <div className="projection__stat">
            <dt>Now</dt>
            <dd>{formatKg(progress.baselineKg)}</dd>
          </div>
          <div className="projection__stat">
            <dt>Committed savings</dt>
            <dd className="projection__savings">−{formatKg(progress.committedSavingsKg)}</dd>
          </div>
          <div className="projection__stat">
            <dt>Projected</dt>
            <dd className="projection__projected">{formatKg(progress.projectedKg)}</dd>
          </div>
        </dl>

        {goal ? (
          <div className="goalbar">
            <div
              className="progressbar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.goalProgressPct}
              aria-valuetext={`${progress.goalProgressPct}% of your ${goal.targetReductionPct}% goal`}
            >
              <div
                className="progressbar__fill"
                style={{ width: `${progress.goalProgressPct}%` }}
                aria-hidden="true"
              />
            </div>
            <p className="goalbar__caption">
              {progress.goalMet
                ? '🎯 Your committed actions reach your goal — now make them happen!'
                : `You're ${progress.goalProgressPct}% of the way to your ${goal.targetReductionPct}% reduction goal.`}
            </p>
          </div>
        ) : (
          <p className="projection__hint">Set a goal above to track your progress toward it.</p>
        )}

        {committedRecommendations.length > 0 ? (
          <ul className="projection__committed">
            {committedRecommendations.map((rec) => (
              <li key={rec.id}>
                <span>{rec.title}</span>
                <span className="projection__savings">−{formatKg(rec.annualSavingsKg)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="projection__hint">
            Tick actions on the <strong>Insights</strong> tab to build your projection.
          </p>
        )}
      </section>

      {/* History */}
      <section className="card" aria-labelledby="history-heading">
        <h3 className="card__title" id="history-heading">
          Track your history
        </h3>
        <p className="history__intro">
          Save a snapshot whenever you update your profile to watch your footprint change over time.
        </p>
        <div className="history__actions">
          <button type="button" className="button button--primary" onClick={handleSaveSnapshot}>
            Save snapshot
          </button>
          {overallTrend !== null ? (
            <span
              className={`history__trend ${overallTrend <= 0 ? 'history__trend--down' : 'history__trend--up'}`}
            >
              {formatSignedPercent(overallTrend)} since you started
            </span>
          ) : null}
        </div>

        <p className="visually-hidden" role="status" aria-live="polite">
          {status}
        </p>

        {history.length === 0 ? (
          <p className="projection__hint">No snapshots yet.</p>
        ) : (
          <table className="history__table">
            <caption className="visually-hidden">Saved footprint snapshots over time</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Footprint</th>
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody>
              {history.map((snapshot, index) => {
                const previous = index > 0 ? history[index - 1] : undefined;
                const delta = previous ? snapshot.totalKgPerYear - previous.totalKgPerYear : 0;
                return (
                  <tr key={snapshot.id}>
                    <td>{formatDate(snapshot.dateISO)}</td>
                    <td>{formatKg(snapshot.totalKgPerYear)}</td>
                    <td>
                      {previous ? (
                        <span className={delta <= 0 ? 'history__trend--down' : 'history__trend--up'}>
                          {delta <= 0 ? '−' : '+'}
                          {formatKg(Math.abs(delta))}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
