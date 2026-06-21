import { describe, expect, it } from 'vitest';
import { formatKg, formatNumber, formatPercent, formatSignedPercent, formatTonnes } from './format';

describe('formatNumber', () => {
  it('rounds and groups with thousands separators', () => {
    expect(formatNumber(7219)).toBe('7,219');
    expect(formatNumber(7219.6)).toBe('7,220');
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatKg', () => {
  it('rounds to whole kilograms and appends the unit', () => {
    expect(formatKg(7219.4)).toBe('7,219 kg');
    expect(formatKg(0)).toBe('0 kg');
  });
});

describe('formatTonnes', () => {
  it('shows tonnes to exactly one decimal place', () => {
    expect(formatTonnes(7219)).toBe('7.2 t');
    expect(formatTonnes(1000)).toBe('1.0 t');
    expect(formatTonnes(0)).toBe('0.0 t');
  });
});

describe('formatPercent', () => {
  it('rounds to a whole percentage', () => {
    expect(formatPercent(20)).toBe('20%');
    expect(formatPercent(19.6)).toBe('20%');
  });
});

describe('formatSignedPercent', () => {
  it('prefixes positive values with a plus sign', () => {
    expect(formatSignedPercent(15)).toBe('+15%');
  });

  it('uses a true minus sign (U+2212) for negative values', () => {
    expect(formatSignedPercent(-10)).toBe('−10%');
  });

  it('shows zero without any sign', () => {
    expect(formatSignedPercent(0)).toBe('0%');
    expect(formatSignedPercent(0.4)).toBe('0%'); // rounds down to zero
  });
});
