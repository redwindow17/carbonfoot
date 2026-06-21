import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from './AppProvider';
import { useApp } from './appContext';

describe('useApp', () => {
  it('throws a helpful error when used outside <AppProvider>', () => {
    // React logs the thrown render error; silence it to keep test output clean.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useApp())).toThrow('useApp must be used within an <AppProvider>');
    errorSpy.mockRestore();
  });

  it('exposes the store when rendered within the provider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <AppProvider>{children}</AppProvider>;
    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current.profile).toBeDefined();
    expect(result.current.result.totalKgPerYear).toBeGreaterThan(0);
    expect(typeof result.current.updateTransport).toBe('function');
  });
});
