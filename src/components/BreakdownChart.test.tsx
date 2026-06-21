import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BreakdownChart } from './BreakdownChart';
import type { FootprintResult } from '../domain';

function result(total: number, byCategory: FootprintResult['byCategory']): FootprintResult {
  return { totalKgPerYear: total, byCategory, lineItems: [] };
}

describe('BreakdownChart', () => {
  it('lists each category with its value and share, largest first', () => {
    render(
      <BreakdownChart result={result(100, { transport: 40, home: 30, food: 20, goods: 10 })} />,
    );

    expect(screen.getByRole('heading', { name: 'Where it comes from' })).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('(40%)')).toBeInTheDocument();

    const labels = screen.getAllByText(/Transport|Home energy|Food|Goods & waste/);
    expect(labels[0]).toHaveTextContent('Transport'); // highest share sorts first
  });

  it('renders a zero total without dividing by zero', () => {
    render(<BreakdownChart result={result(0, { transport: 0, home: 0, food: 0, goods: 0 })} />);
    expect(screen.getAllByText('(0%)').length).toBe(4);
  });
});
