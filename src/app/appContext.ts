/**
 * Context shape and the `useApp` hook. Kept separate from the provider
 * component so the hook can be imported anywhere without dragging React
 * Fast-Refresh boundaries through a component file.
 */

import { createContext, useContext } from 'react';
import type {
  FoodProfile,
  FootprintResult,
  FootprintSnapshot,
  Goal,
  GoodsProfile,
  HomeProfile,
  ProgressSummary,
  Recommendation,
  TransportProfile,
  UserProfile,
} from '../domain';

export interface AppContextValue {
  /** Single source of truth for everything the user has entered. */
  profile: UserProfile;
  /** Derived footprint for the current profile. */
  result: FootprintResult;
  /** Personalised, prioritised recommendations for the current profile. */
  recommendations: Recommendation[];
  /** Subset of `recommendations` the user has committed to. */
  committedRecommendations: Recommendation[];
  committedRecommendationIds: string[];
  goal: Goal | null;
  /** Derived projection toward any goal, given committed actions. */
  progress: ProgressSummary;
  history: FootprintSnapshot[];

  updateTransport: (patch: Partial<TransportProfile>) => void;
  updateHome: (patch: Partial<HomeProfile>) => void;
  updateFood: (patch: Partial<FoodProfile>) => void;
  updateGoods: (patch: Partial<GoodsProfile>) => void;
  setGoal: (goal: Goal | null) => void;
  toggleCommitment: (id: string) => void;
  isCommitted: (id: string) => boolean;
  saveSnapshot: () => void;
  resetAll: () => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

/** Access the app store. Throws if used outside <AppProvider>. */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an <AppProvider>');
  }
  return ctx;
}
