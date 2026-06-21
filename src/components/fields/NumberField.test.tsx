import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NumberField } from './NumberField';

describe('NumberField', () => {
  it('renders with no aria-describedby when neither help nor unit is given', () => {
    render(<NumberField label="Bare" value={1} onChange={() => {}} limit={{ min: 0, max: 10 }} />);
    expect(screen.getByLabelText('Bare')).not.toHaveAttribute('aria-describedby');
  });

  it('links help text and unit through aria-describedby', () => {
    render(
      <NumberField
        label="Power"
        value={1}
        onChange={() => {}}
        limit={{ min: 0, max: 10 }}
        unit="kWh"
        help="From your bill"
      />,
    );
    const input = screen.getByLabelText('Power');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(describedBy?.split(' ')).toHaveLength(2);
  });

  it('clamps to the maximum and rounds when integer-only', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <NumberField
        label="Count"
        value={2}
        onChange={onChange}
        limit={{ min: 0, max: 5 }}
        integer
      />,
    );
    const input = screen.getByLabelText('Count');

    await user.clear(input);
    await user.type(input, '9'); // above the max of 5
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('treats an emptied field as the clamped minimum and resyncs on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <NumberField label="Distance" value={50} onChange={onChange} limit={{ min: 0, max: 100 }} />,
    );
    const input = screen.getByLabelText('Distance');

    await user.clear(input);
    expect(onChange).toHaveBeenLastCalledWith(0); // empty → clamped minimum
    expect(input).toHaveValue(null);

    await user.tab(); // blur resets the visible draft to the stored value
    expect(input).toHaveValue(50);
  });
});
