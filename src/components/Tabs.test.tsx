import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tabs, type TabDefinition } from './Tabs';

const tabs: TabDefinition[] = [
  { id: 'a', label: 'Alpha', render: () => <p>Panel Alpha</p> },
  { id: 'b', label: 'Beta', render: () => <p>Panel Beta</p> },
  { id: 'c', label: 'Gamma', render: () => <p>Panel Gamma</p> },
];

describe('Tabs (accessibility)', () => {
  it('selects the first tab and exposes correct ARIA state', () => {
    render(<Tabs tabs={tabs} ariaLabel="Demo" />);

    expect(screen.getByRole('tablist', { name: 'Demo' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Alpha');
  });

  it('supports arrow, Home and End keyboard navigation with wrap-around', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} ariaLabel="Demo" />);

    screen.getByRole('tab', { name: 'Alpha' }).focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Beta');

    // Beta → Alpha → wrap to Gamma
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true');
  });
});
