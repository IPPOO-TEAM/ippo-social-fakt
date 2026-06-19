import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './theme';

describe('useTheme', () => {
  it('defaults to auto mode', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe('auto');
    expect(typeof result.current.isDark).toBe('boolean');
  });

  it('forces dark when set to dark', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setMode('dark'));
    expect(result.current.mode).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('forces light when set to light', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setMode('light'));
    expect(result.current.isDark).toBe(false);
  });

  it('propagates across instances via storage event', () => {
    const a = renderHook(() => useTheme());
    const b = renderHook(() => useTheme());
    act(() => a.result.current.setMode('dark'));
    expect(b.result.current.mode).toBe('dark');
  });
});
