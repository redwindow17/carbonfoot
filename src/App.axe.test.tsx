import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import * as axeMatchers from 'vitest-axe/matchers';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { renderWithProvider } from './test/utils';

expect.extend(axeMatchers);

// vitest-axe ships its matcher typings for an older Vitest; declare the one we
// use against the current Assertion interface.
declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void;
  }
}

// Run only the standard WCAG 2.0/2.1 A & AA rules — the criteria the platform
// is actually assessed against — rather than axe's optional best-practice set.
// color-contrast needs a canvas to sample pixels, which jsdom does not provide;
// contrast is instead handled deliberately via the design tokens in styles.css.
const WCAG = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } },
};

beforeEach(() => {
  window.localStorage.clear();
});

describe('App (automated WCAG checks)', () => {
  it('has no violations on the Calculate tab', async () => {
    const { container } = renderWithProvider(<App />);
    expect(await axe(container, WCAG)).toHaveNoViolations();
  }, 20000);

  it('has no violations on the Insights tab', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProvider(<App />);
    await user.click(screen.getByRole('tab', { name: /Insights/ }));
    expect(await axe(container, WCAG)).toHaveNoViolations();
  }, 20000);

  it('has no violations on the Progress tab', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProvider(<App />);
    await user.click(screen.getByRole('tab', { name: /Progress/ }));
    expect(await axe(container, WCAG)).toHaveNoViolations();
  }, 20000);
});
