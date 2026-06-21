import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProgressView } from './ProgressView';
import { DEFAULT_PROFILE, type FootprintSnapshot } from '../domain';
import { renderWithProvider } from '../test/utils';

const STORAGE_KEY = 'ecotrack:state';

interface SeedState {
  goal?: { targetReductionPct: number } | null;
  committedRecommendationIds?: string[];
  history?: FootprintSnapshot[];
}

/** Seeds persisted state so a freshly-rendered provider hydrates from it. */
function seed(state: SeedState) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      profile: DEFAULT_PROFILE,
      goal: state.goal ?? null,
      committedRecommendationIds: state.committedRecommendationIds ?? [],
      history: state.history ?? [],
    }),
  );
}

const snap = (totalKgPerYear: number, dateISO: string, id: string): FootprintSnapshot => ({
  id,
  dateISO,
  totalKgPerYear,
  byCategory: { transport: totalKgPerYear, home: 0, food: 0, goods: 0 },
});

beforeEach(() => {
  window.localStorage.clear();
});

describe('ProgressView', () => {
  it('prompts to set a goal and to commit actions before anything is configured', () => {
    renderWithProvider(<ProgressView />);
    expect(screen.getByText(/Set a goal above to track/)).toBeInTheDocument();
    expect(screen.getByText(/Tick actions on the/)).toBeInTheDocument();
    expect(screen.getByText('No snapshots yet.')).toBeInTheDocument();
  });

  it('shows a progress bar after setting a goal and hides it after removing one', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ProgressView />);

    await user.click(screen.getByRole('button', { name: 'Set goal' }));
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar).toHaveAttribute('aria-valuetext', expect.stringContaining('goal'));
    expect(screen.getByText(/of the way to your 20% reduction goal/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove goal' }));
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('updates the draft (and a live goal) as the slider moves', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ProgressView />);
    const slider = screen.getByRole('slider');

    // Before a goal exists, moving the slider only updates the draft label.
    fireEvent.change(slider, { target: { value: '30' } });
    expect(screen.getByText(/Cut my footprint by/)).toHaveTextContent('30%');

    // Once a goal is set, moving the slider updates the goal live.
    await user.click(screen.getByRole('button', { name: 'Set goal' }));
    fireEvent.change(slider, { target: { value: '45' } });
    expect(screen.getByText(/of the way to your 45% reduction goal/)).toBeInTheDocument();
  });

  it('announces and records a snapshot', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ProgressView />);

    await user.click(screen.getByRole('button', { name: 'Save snapshot' }));

    expect(screen.getByRole('status')).toHaveTextContent(/Snapshot saved/);
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows.length).toBeGreaterThanOrEqual(2); // header + at least one snapshot
  });

  it('reports an upward trend, per-row deltas, and unparseable dates from history', () => {
    seed({
      history: [
        snap(5000, 'not-a-real-date', 'a'),
        snap(6000, '2026-02-01T00:00:00.000Z', 'b'),
        snap(5500, '2026-03-01T00:00:00.000Z', 'c'),
      ],
    });
    renderWithProvider(<ProgressView />);

    // First → last: 5000 → 5500 = +10%
    expect(screen.getByText(/\+10% since you started/)).toBeInTheDocument();
    // The unparseable date and the first row's (absent) change both render as an em dash.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('reports a downward trend when the footprint falls overall', () => {
    seed({
      history: [
        snap(7000, '2026-01-01T00:00:00.000Z', 'a'),
        snap(6000, '2026-02-01T00:00:00.000Z', 'b'),
      ],
    });
    renderWithProvider(<ProgressView />);
    // 7000 → 6000 = −14%
    expect(screen.getByText(/−14% since you started/)).toBeInTheDocument();
  });

  it('celebrates a goal that committed actions already reach', () => {
    seed({
      goal: { targetReductionPct: 5 },
      committedRecommendationIds: ['car-ev'],
    });
    renderWithProvider(<ProgressView />);

    expect(screen.getByText(/reach your goal/)).toBeInTheDocument();
    // The committed action is listed in the projection.
    expect(screen.getByText(/Switch your next car to electric/)).toBeInTheDocument();
  });
});
