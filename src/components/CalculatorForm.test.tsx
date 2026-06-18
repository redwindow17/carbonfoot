import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalculatorForm } from './CalculatorForm';
import { renderWithProvider } from '../test/utils';

beforeEach(() => {
  window.localStorage.clear();
});

describe('CalculatorForm', () => {
  it('shows the live total for the default profile', () => {
    renderWithProvider(<CalculatorForm />);
    expect(screen.getByText(/7,219 kg/)).toBeInTheDocument();
  });

  it('recalculates and disables driving distance when the car is removed', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CalculatorForm />);

    await user.selectOptions(screen.getByLabelText('Main car fuel'), 'none');

    expect(screen.getByLabelText('Distance you drive')).toBeDisabled();
    // 7,219 − 1,326 (car) = 5,893
    expect(screen.getByText(/5,893 kg/)).toBeInTheDocument();
  });
});
