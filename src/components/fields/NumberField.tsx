/**
 * Accessible numeric input.
 *
 * - The `<label>` is always rendered and associated via `htmlFor`.
 * - Help text and the unit are linked with `aria-describedby` so screen
 *   readers announce them with the field.
 * - A focus-aware internal draft lets users clear/retype freely without the
 *   store snapping the value back mid-edit; values are clamped on the way out.
 */

import { useEffect, useId, useRef, useState } from 'react';
import type { NumberLimit } from '../../domain';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  limit: NumberLimit;
  unit?: string;
  help?: string;
  step?: number;
  integer?: boolean;
  disabled?: boolean;
}

function clamp(n: number, { min, max }: NumberLimit): number {
  return Math.min(max, Math.max(min, n));
}

export function NumberField({
  label,
  value,
  onChange,
  limit,
  unit,
  help,
  step = 1,
  integer = false,
  disabled = false,
}: NumberFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const unitId = `${id}-unit`;
  const [draft, setDraft] = useState(() => String(value));
  const focused = useRef(false);

  // Sync from the store only while the user is not actively editing.
  useEffect(() => {
    if (!focused.current) setDraft(String(value));
  }, [value]);

  const describedBy = [help ? helpId : null, unit ? unitId : null].filter(Boolean).join(' ');

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__control">
        <input
          id={id}
          className="field__input"
          type="number"
          inputMode={integer ? 'numeric' : 'decimal'}
          value={draft}
          min={limit.min}
          max={limit.max}
          step={step}
          disabled={disabled}
          aria-describedby={describedBy || undefined}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            setDraft(String(value));
          }}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (next.trim() === '') {
              onChange(clamp(0, limit));
              return;
            }
            const parsed = Number(next);
            if (Number.isFinite(parsed)) {
              onChange(clamp(integer ? Math.round(parsed) : parsed, limit));
            }
          }}
        />
        {unit ? (
          <span className="field__unit" id={unitId}>
            {unit}
          </span>
        ) : null}
      </div>
      {help ? (
        <p className="field__help" id={helpId}>
          {help}
        </p>
      ) : null}
    </div>
  );
}
