import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { renderWithProvider } from './test/utils';

beforeEach(() => {
  window.localStorage.clear();
});

/**
 * Guards the document's heading structure, which assistive tech relies on to
 * build a navigable outline. There must be exactly one <h1>, and heading levels
 * must never skip (no h1 → h3 jumps) on any tab.
 */
describe('App (heading structure)', () => {
  function assertNoLevelSkips() {
    const levels = screen
      .getAllByRole('heading')
      .map((heading) => Number(heading.tagName[1]));

    const h1s = levels.filter((level) => level === 1);
    expect(h1s).toHaveLength(1);

    levels.reduce((previous, level) => {
      // A heading may stay the same, go shallower, or go exactly one deeper.
      expect(level).toBeLessThanOrEqual(previous + 1);
      return level;
    }, 1);
  }

  it('exposes the app name as the single top-level heading', () => {
    renderWithProvider(<App />);
    const banner = screen.getByRole('banner');
    expect(within(banner).getByRole('heading', { level: 1, name: 'EcoTrack' })).toBeInTheDocument();
  });

  it('keeps headings sequential on every tab', async () => {
    const user = userEvent.setup();
    renderWithProvider(<App />);

    assertNoLevelSkips();

    await user.click(screen.getByRole('tab', { name: /Insights/ }));
    assertNoLevelSkips();

    await user.click(screen.getByRole('tab', { name: /Progress/ }));
    assertNoLevelSkips();
  });
});
