import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { renderWithProvider } from '../test/utils';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// The reset control lives in the Header; these exercise both confirm outcomes
// through the real App so the store wiring is covered end to end.
describe('Header reset', () => {
  it('clears the profile back to defaults when the user confirms', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithProvider(<App />);

    await user.selectOptions(screen.getByLabelText('Your diet'), 'vegan');
    expect(screen.getByLabelText('Your diet')).toHaveValue('vegan');

    await user.click(screen.getByRole('button', { name: 'Reset data' }));
    expect(window.confirm).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Your diet')).toHaveValue('mediumMeat');
  });

  it('keeps the profile when the user cancels the confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWithProvider(<App />);

    await user.selectOptions(screen.getByLabelText('Your diet'), 'vegan');
    await user.click(screen.getByRole('button', { name: 'Reset data' }));

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Your diet')).toHaveValue('vegan');
  });
});
