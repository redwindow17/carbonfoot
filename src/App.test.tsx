import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { renderWithProvider } from './test/utils';

beforeEach(() => {
  window.localStorage.clear();
});

describe('App (integration)', () => {
  it('renders the banner and the calculator tab by default', () => {
    renderWithProvider(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText(/Understand, track and shrink/)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Calculate/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates to Insights and Progress and renders their content', async () => {
    const user = userEvent.setup();
    renderWithProvider(<App />);

    await user.click(screen.getByRole('tab', { name: /Insights/ }));
    expect(screen.getByRole('heading', { name: 'Where it comes from' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How you compare' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your action plan' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Progress/ }));
    expect(screen.getByRole('heading', { name: 'Set a reduction goal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Track your history' })).toBeInTheDocument();
  });
});
