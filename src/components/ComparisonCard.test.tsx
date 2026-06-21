import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ComparisonCard } from './ComparisonCard';

describe('ComparisonCard', () => {
  it('reports a footprint well under the benchmark as "below"', () => {
    render(<ComparisonCard totalKgPerYear={1000} />);
    expect(screen.getByText(/below/)).toBeInTheDocument();
  });

  it('reports a footprint near the benchmark as "about the same as"', () => {
    render(<ComparisonCard totalKgPerYear={4700} />);
    expect(screen.getByText(/about the same as/)).toBeInTheDocument();
  });

  it('reports a footprint well over the benchmark as "above"', () => {
    render(<ComparisonCard totalKgPerYear={12000} />);
    expect(screen.getByText(/above/)).toBeInTheDocument();
  });

  it('recomputes the comparison when the benchmark is switched', async () => {
    const user = userEvent.setup();
    render(<ComparisonCard totalKgPerYear={5000} />);

    await user.selectOptions(screen.getByLabelText('Compare against'), 'usa');
    expect(screen.getByLabelText('Compare against')).toHaveValue('usa');
    expect(screen.getByText(/16,000 kg per person/)).toBeInTheDocument();
  });
});
