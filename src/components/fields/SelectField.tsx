/**
 * Accessible select built from a list of options. The native `<select>` is used
 * deliberately — it is keyboard- and screen-reader-friendly out of the box.
 */

import { useId } from 'react';
import type { SelectOption } from './options';

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<SelectOption<T>>;
  onChange: (value: T) => void;
  help?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  help,
}: SelectFieldProps<T>) {
  const id = useId();
  const helpId = `${id}-help`;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="field__input field__input--select"
        value={value}
        aria-describedby={help ? helpId : undefined}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {help ? (
        <p className="field__help" id={helpId}>
          {help}
        </p>
      ) : null}
    </div>
  );
}
