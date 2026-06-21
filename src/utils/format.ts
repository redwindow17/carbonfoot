/** Presentation helpers for numbers shown to the user. Locale-aware, pure. */

const LOCALE = 'en-US';

/** Whole number with thousands separators, e.g. 7219 → "7,219". */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString(LOCALE);
}

/** e.g. 7219 → "7,219 kg". */
export function formatKg(kg: number): string {
  return `${formatNumber(kg)} kg`;
}

/** e.g. 7219 → "7.2 t" (one decimal). */
export function formatTonnes(kg: number): string {
  const tonnes = kg / 1000;
  return `${tonnes.toLocaleString(LOCALE, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} t`;
}

/** Whole-number percentage, e.g. 20 → "20%". */
export function formatPercent(pct: number): string {
  return `${Math.round(pct)}%`;
}

/**
 * Signed percentage with a true minus sign for negatives, e.g.
 * 15 → "+15%", -10 → "−10%", 0 → "0%".
 */
export function formatSignedPercent(pct: number): string {
  const rounded = Math.round(pct);
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `−${Math.abs(rounded)}%`;
  return '0%';
}
