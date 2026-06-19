import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContentT } from './mock_translations';
import { useUser } from '../lib/user';

describe('useContentT overlay', () => {
  it('returns fallback when language is FR (no overlay)', () => {
    const { result } = renderHook(() => useContentT());
    expect(result.current.article('a1', 'title', 'Source FR')).toBe('Source FR');
  });

  it('returns English overlay when language is EN', () => {
    const { result: user } = renderHook(() => useUser());
    act(() => user.current.update({ language: 'en' }));
    const { result } = renderHook(() => useContentT());
    const v = result.current.article('a1', 'title', 'Source FR');
    expect(v).not.toBe('Source FR');
    expect(typeof v).toBe('string');
    expect(v.length).toBeGreaterThan(0);
  });

  it('falls back to FR for ids missing in overlay', () => {
    const { result: user } = renderHook(() => useUser());
    act(() => user.current.update({ language: 'en' }));
    const { result } = renderHook(() => useContentT());
    expect(result.current.article('zzz-missing', 'title', 'FR fallback')).toBe('FR fallback');
  });

  it('exposes accessors for all five record kinds', () => {
    const { result } = renderHook(() => useContentT());
    expect(typeof result.current.article).toBe('function');
    expect(typeof result.current.episode).toBe('function');
    expect(typeof result.current.video).toBe('function');
    expect(typeof result.current.opportunity).toBe('function');
    expect(typeof result.current.short).toBe('function');
  });

  it('falls back to FR for non-EN languages without overlay', () => {
    const { result: user } = renderHook(() => useUser());
    act(() => user.current.update({ language: 'wo' }));
    const { result } = renderHook(() => useContentT());
    expect(result.current.episode('p1', 'title', 'FR titre')).toBe('FR titre');
  });
});
