/** Top-level layout: skip link, banner, tabbed sections, and a footer note. */

import { Header } from './components/Header';
import { Tabs, type TabDefinition } from './components/Tabs';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { Recommendations } from './components/Recommendations';
import { ProgressView } from './components/ProgressView';

const TABS: TabDefinition[] = [
  { id: 'calculate', label: 'Calculate', icon: '📝', render: () => <CalculatorForm /> },
  {
    id: 'insights',
    label: 'Insights',
    icon: '📊',
    render: () => (
      <>
        <ResultsDashboard />
        <Recommendations />
      </>
    ),
  },
  { id: 'progress', label: 'Progress', icon: '📈', render: () => <ProgressView /> },
];

export function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <div className="app">
        <Header />
        <main id="main" className="app__main" tabIndex={-1}>
          <Tabs tabs={TABS} ariaLabel="EcoTrack sections" />
        </main>
        <footer className="app__footer">
          <p>
            EcoTrack gives science-based estimates for awareness, not a certified inventory. All
            calculations run locally in your browser.
          </p>
        </footer>
      </div>
    </>
  );
}
