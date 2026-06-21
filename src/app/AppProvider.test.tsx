import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProvider } from './AppProvider';
import { useApp } from './appContext';
import { loadPersistedState } from './storage';

const wrapper = ({ children }: { children: ReactNode }) => <AppProvider>{children}</AppProvider>;
const setup = () => renderHook(() => useApp(), { wrapper });

beforeEach(() => {
  window.localStorage.clear();
});

describe('AppProvider store', () => {
  it('patches each profile section and recomputes the footprint', () => {
    const { result } = setup();
    const before = result.current.result.totalKgPerYear;

    act(() => {
      result.current.updateTransport({ carKmPerWeek: 0 });
      result.current.updateHome({ householdSize: 4 });
      result.current.updateFood({ dietType: 'vegan' });
      result.current.updateGoods({ recyclingHabit: 'most' });
    });

    expect(result.current.profile.transport.carKmPerWeek).toBe(0);
    expect(result.current.profile.home.householdSize).toBe(4);
    expect(result.current.profile.food.dietType).toBe('vegan');
    expect(result.current.profile.goods.recyclingHabit).toBe('most');
    expect(result.current.result.totalKgPerYear).toBeLessThan(before);
  });

  it('adds and removes commitments', () => {
    const { result } = setup();
    const id = result.current.recommendations[0]?.id;
    expect(id).toBeDefined();

    act(() => result.current.toggleCommitment(id as string));
    expect(result.current.isCommitted(id as string)).toBe(true);
    expect(result.current.committedRecommendations.some((r) => r.id === id)).toBe(true);

    act(() => result.current.toggleCommitment(id as string));
    expect(result.current.isCommitted(id as string)).toBe(false);
  });

  it('sets and clears the reduction goal', () => {
    const { result } = setup();
    act(() => result.current.setGoal({ targetReductionPct: 30 }));
    expect(result.current.goal).toEqual({ targetReductionPct: 30 });

    act(() => result.current.setGoal(null));
    expect(result.current.goal).toBeNull();
  });

  it('records snapshots with distinct ids and the current total', () => {
    const { result } = setup();
    act(() => result.current.saveSnapshot());
    act(() => result.current.saveSnapshot());

    expect(result.current.history).toHaveLength(2);
    const [first, second] = result.current.history;
    expect(first?.id).not.toBe(second?.id);
    expect(first?.totalKgPerYear).toBe(result.current.result.totalKgPerYear);
  });

  it('resets everything back to defaults', () => {
    const { result } = setup();
    act(() => {
      result.current.updateFood({ dietType: 'vegan' });
      result.current.setGoal({ targetReductionPct: 40 });
      result.current.saveSnapshot();
    });

    act(() => result.current.resetAll());

    expect(result.current.goal).toBeNull();
    expect(result.current.history).toHaveLength(0);
    expect(result.current.profile.food.dietType).not.toBe('vegan');
  });

  it('persists changes to localStorage and rehydrates a fresh provider', () => {
    const first = setup();
    act(() => first.result.current.setGoal({ targetReductionPct: 35 }));

    expect(loadPersistedState()?.goal).toEqual({ targetReductionPct: 35 });
    first.unmount();

    const second = setup();
    expect(second.result.current.goal).toEqual({ targetReductionPct: 35 });
  });
});
