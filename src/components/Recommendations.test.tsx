import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { Recommendations } from './Recommendations';
import { renderWithProvider } from '../test/utils';

beforeEach(() => {
  window.localStorage.clear();
});

/** A profile already optimal across the board, so no advice can be generated. */
const OPTIMAL_PROFILE = {
  transport: {
    carFuel: 'none',
    carKmPerWeek: 0,
    publicTransitKmPerWeek: 0,
    shortHaulFlightsPerYear: 0,
    longHaulFlightsPerYear: 0,
  },
  home: {
    householdSize: 1,
    electricityKwhPerMonth: 50,
    electricitySource: 'fullGreen',
    heatingFuel: 'none',
    heatingKwhPerMonth: 0,
  },
  food: { dietType: 'vegan' },
  goods: { consumptionLevel: 'low', recyclingHabit: 'most' },
};

describe('Recommendations', () => {
  it('lists personalised actions with commit checkboxes', () => {
    renderWithProvider(<Recommendations />);
    expect(screen.getByRole('heading', { name: 'Your action plan' })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
  });

  it('records a commitment when an action is ticked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Recommendations />);

    const [firstCheckbox] = screen.getAllByRole('checkbox');
    expect(firstCheckbox).toBeDefined();
    expect(firstCheckbox).not.toBeChecked();

    await user.click(firstCheckbox as HTMLElement);
    expect(firstCheckbox).toBeChecked();
  });

  it('celebrates and offers nothing when the footprint is already low', () => {
    window.localStorage.setItem(
      'ecotrack:state',
      JSON.stringify({
        schemaVersion: 1,
        profile: OPTIMAL_PROFILE,
        goal: null,
        committedRecommendationIds: [],
        history: [],
      }),
    );
    renderWithProvider(<Recommendations />);

    expect(screen.getByText(/already low across the board/)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
