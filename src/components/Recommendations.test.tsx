import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { Recommendations } from './Recommendations';
import { renderWithProvider } from '../test/utils';

beforeEach(() => {
  window.localStorage.clear();
});

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
});
