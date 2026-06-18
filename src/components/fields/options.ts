/** Option helpers for select controls (kept out of component files so React
 *  Fast Refresh boundaries stay clean). */

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

/** Builds typed options from a `Record<value, label>` map, preserving order. */
export function optionsFromLabels<T extends string>(
  labels: Record<T, string>,
): SelectOption<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}
