/** Purely-visual metadata for each footprint category (icon + accent colour). */

import type { FootprintCategory } from '../domain';

export interface CategoryMeta {
  /** Decorative emoji icon — always paired with a text label in the UI. */
  icon: string;
  /** Accent colour used for chart fills; text never sits on it. */
  color: string;
}

export const CATEGORY_META: Record<FootprintCategory, CategoryMeta> = {
  transport: { icon: '🚗', color: '#2563eb' },
  home: { icon: '🏠', color: '#d97706' },
  food: { icon: '🍽️', color: '#16a34a' },
  goods: { icon: '🛒', color: '#7c3aed' },
};
