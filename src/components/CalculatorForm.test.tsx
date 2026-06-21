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

  it('disables the heating energy field when there is no heating fuel', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CalculatorForm />);

    await user.selectOptions(screen.getByLabelText('Heating fuel'), 'none');
    expect(screen.getByLabelText('Heating & hot water energy')).toBeDisabled();
  });

  it('updates the live total as a numeric field is edited', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CalculatorForm />);

    const electricity = screen.getByLabelText('Electricity use');
    await user.clear(electricity);
    await user.type(electricity, '600');

    expect(electricity).toHaveValue(600);
    // Doubling electricity raises the total above the default 7,219 kg.
    expect(screen.queryByText(/7,219 kg/)).not.toBeInTheDocument();
  });

  it('wires every control to the store', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CalculatorForm />);

    // Selecting non-"none" fuels keeps the dependent distance/energy inputs enabled.
    await user.selectOptions(screen.getByLabelText('Main car fuel'), 'diesel');
    await user.selectOptions(screen.getByLabelText('Electricity source'), 'fullGreen');
    await user.selectOptions(screen.getByLabelText('Heating fuel'), 'oil');
    await user.selectOptions(screen.getByLabelText('Your diet'), 'vegan');
    await user.selectOptions(screen.getByLabelText('Shopping habits'), 'low');
    await user.selectOptions(screen.getByLabelText('How much do you recycle?'), 'most');

    const numbers: ReadonlyArray<readonly [string, string]> = [
      ['Distance you drive', '120'],
      ['Public transport', '30'],
      ['Short-haul flights', '2'],
      ['Long-haul flights', '1'],
      ['People in your home', '3'],
      ['Electricity use', '250'],
      ['Heating & hot water energy', '200'],
    ];
    for (const [label, value] of numbers) {
      const input = screen.getByLabelText(label);
      await user.clear(input);
      await user.type(input, value);
      expect(input).toHaveValue(Number(value));
    }
  });
});
