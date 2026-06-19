import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUser } from './user';

describe('useUser', () => {
  it('starts with default profile', () => {
    const { result } = renderHook(() => useUser());
    expect(result.current.user.language).toBe('fr');
    expect(result.current.user.zone).toBe('Cotonou');
    expect(result.current.user.onboarded).toBe(false);
  });

  it('updates and persists patches', () => {
    const a = renderHook(() => useUser());
    act(() => a.result.current.update({ firstName: 'Aïcha', language: 'en' }));
    expect(a.result.current.user.firstName).toBe('Aïcha');
    expect(a.result.current.user.language).toBe('en');

    const b = renderHook(() => useUser());
    expect(b.result.current.user.firstName).toBe('Aïcha');
  });

  it('reset returns to defaults', () => {
    const { result } = renderHook(() => useUser());
    act(() => result.current.update({ firstName: 'X', authed: true }));
    act(() => result.current.reset());
    expect(result.current.user.firstName).toBe('');
    expect(result.current.user.authed).toBe(false);
  });
});
