/**
 * The application store: a typed reducer plus derived state, wired to
 * localStorage. Components read everything through `useApp()`.
 */

import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import {
  calculateFootprint,
  createSnapshot,
  DEFAULT_PROFILE,
  generateRecommendations,
  summarizeProgress,
  type FoodProfile,
  type FootprintSnapshot,
  type Goal,
  type GoodsProfile,
  type HomeProfile,
  type TransportProfile,
  type UserProfile,
} from '../domain';
import { createId } from '../utils/id';
import { AppContext, type AppContextValue } from './appContext';
import { loadPersistedState, MAX_HISTORY, savePersistedState } from './storage';

interface State {
  profile: UserProfile;
  goal: Goal | null;
  committedRecommendationIds: string[];
  history: FootprintSnapshot[];
}

type Action =
  | { type: 'patchTransport'; patch: Partial<TransportProfile> }
  | { type: 'patchHome'; patch: Partial<HomeProfile> }
  | { type: 'patchFood'; patch: Partial<FoodProfile> }
  | { type: 'patchGoods'; patch: Partial<GoodsProfile> }
  | { type: 'setGoal'; goal: Goal | null }
  | { type: 'toggleCommitment'; id: string }
  | { type: 'addSnapshot'; snapshot: FootprintSnapshot }
  | { type: 'reset' };

function freshState(): State {
  return {
    profile: DEFAULT_PROFILE,
    goal: null,
    committedRecommendationIds: [],
    history: [],
  };
}

function createInitialState(): State {
  const persisted = loadPersistedState();
  if (!persisted) return freshState();
  return {
    profile: persisted.profile,
    goal: persisted.goal,
    committedRecommendationIds: persisted.committedRecommendationIds,
    history: persisted.history,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'patchTransport':
      return { ...state, profile: { ...state.profile, transport: { ...state.profile.transport, ...action.patch } } };
    case 'patchHome':
      return { ...state, profile: { ...state.profile, home: { ...state.profile.home, ...action.patch } } };
    case 'patchFood':
      return { ...state, profile: { ...state.profile, food: { ...state.profile.food, ...action.patch } } };
    case 'patchGoods':
      return { ...state, profile: { ...state.profile, goods: { ...state.profile.goods, ...action.patch } } };
    case 'setGoal':
      return { ...state, goal: action.goal };
    case 'toggleCommitment': {
      const exists = state.committedRecommendationIds.includes(action.id);
      return {
        ...state,
        committedRecommendationIds: exists
          ? state.committedRecommendationIds.filter((id) => id !== action.id)
          : [...state.committedRecommendationIds, action.id],
      };
    }
    case 'addSnapshot':
      return { ...state, history: [...state.history, action.snapshot].slice(-MAX_HISTORY) };
    case 'reset':
      return freshState();
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  // Derived values — recomputed only when their inputs change.
  const result = useMemo(() => calculateFootprint(state.profile), [state.profile]);
  const recommendations = useMemo(
    () => generateRecommendations(state.profile, result),
    [state.profile, result],
  );
  const committedRecommendations = useMemo(
    () => recommendations.filter((rec) => state.committedRecommendationIds.includes(rec.id)),
    [recommendations, state.committedRecommendationIds],
  );
  const progress = useMemo(
    () => summarizeProgress(result.totalKgPerYear, committedRecommendations, state.goal),
    [result.totalKgPerYear, committedRecommendations, state.goal],
  );

  // Persist whenever the stored slice changes.
  useEffect(() => {
    savePersistedState({
      profile: state.profile,
      goal: state.goal,
      committedRecommendationIds: state.committedRecommendationIds,
      history: state.history,
    });
  }, [state]);

  const updateTransport = useCallback((patch: Partial<TransportProfile>) => dispatch({ type: 'patchTransport', patch }), []);
  const updateHome = useCallback((patch: Partial<HomeProfile>) => dispatch({ type: 'patchHome', patch }), []);
  const updateFood = useCallback((patch: Partial<FoodProfile>) => dispatch({ type: 'patchFood', patch }), []);
  const updateGoods = useCallback((patch: Partial<GoodsProfile>) => dispatch({ type: 'patchGoods', patch }), []);
  const setGoal = useCallback((goal: Goal | null) => dispatch({ type: 'setGoal', goal }), []);
  const toggleCommitment = useCallback((id: string) => dispatch({ type: 'toggleCommitment', id }), []);
  const isCommitted = useCallback(
    (id: string) => state.committedRecommendationIds.includes(id),
    [state.committedRecommendationIds],
  );
  const resetAll = useCallback(() => dispatch({ type: 'reset' }), []);
  const saveSnapshot = useCallback(() => {
    dispatch({
      type: 'addSnapshot',
      snapshot: createSnapshot(result, createId(), new Date().toISOString()),
    });
  }, [result]);

  const value = useMemo<AppContextValue>(
    () => ({
      profile: state.profile,
      result,
      recommendations,
      committedRecommendations,
      committedRecommendationIds: state.committedRecommendationIds,
      goal: state.goal,
      progress,
      history: state.history,
      updateTransport,
      updateHome,
      updateFood,
      updateGoods,
      setGoal,
      toggleCommitment,
      isCommitted,
      saveSnapshot,
      resetAll,
    }),
    [
      state.profile,
      state.committedRecommendationIds,
      state.goal,
      state.history,
      result,
      recommendations,
      committedRecommendations,
      progress,
      updateTransport,
      updateHome,
      updateFood,
      updateGoods,
      setGoal,
      toggleCommitment,
      isCommitted,
      saveSnapshot,
      resetAll,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
