/** App banner: branding, the privacy promise, and a reset control. */

import { useApp } from '../app/appContext';

export function Header() {
  const { resetAll } = useApp();

  function handleReset() {
    const confirmed = window.confirm(
      'Reset everything? This clears your profile, goal and saved history on this device.',
    );
    if (confirmed) resetAll();
  }

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo" aria-hidden="true">
          🌱
        </span>
        <div>
          <p className="header__title">EcoTrack</p>
          <p className="header__tagline">Understand, track and shrink your carbon footprint.</p>
        </div>
      </div>
      <div className="header__actions">
        <span className="header__privacy">🔒 Private — your data never leaves this device</span>
        <button type="button" className="button button--ghost" onClick={handleReset}>
          Reset data
        </button>
      </div>
    </header>
  );
}
