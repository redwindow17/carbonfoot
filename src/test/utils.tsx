/** Shared test helper: renders UI wrapped in the app store provider. */

import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { AppProvider } from '../app/AppProvider';

export function renderWithProvider(ui: ReactElement) {
  return render(<AppProvider>{ui}</AppProvider>);
}
