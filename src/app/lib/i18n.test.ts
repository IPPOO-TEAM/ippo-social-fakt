import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useT, dict } from './i18n';
import { useUser } from './user';

describe('i18n dictionary', () => {
  it('exposes navigation keys for all 13 languages where defined', () => {
    expect(dict['nav.home'].fr).toBe('Accueil');
    expect(dict['nav.home'].en).toBe('Home');
    expect(dict['nav.home'].wo).toBeDefined();
  });

  it('falls back to French when current language is missing', () => {
    const { result } = renderHook(() => useT());
    expect(result.current('nav.podcast')).toBe('Podcasts');
  });

  it('returns translated value when language is set', () => {
    const { result: user } = renderHook(() => useUser());
    act(() => user.current.update({ language: 'en' }));
    const { result } = renderHook(() => useT());
    expect(result.current('nav.home')).toBe('Home');
    expect(result.current('common.back')).toBe('Back');
  });

  it('returns key when neither translation nor fallback exists', () => {
    const { result } = renderHook(() => useT());
    expect(result.current('does.not.exist')).toBe('does.not.exist');
    expect(result.current('does.not.exist', 'oops')).toBe('oops');
  });

  it('switches across multiple African languages', () => {
    const { result: user } = renderHook(() => useUser());
    for (const lang of ['wo', 'yo', 'bm'] as const) {
      act(() => user.current.update({ language: lang }));
      const { result } = renderHook(() => useT());
      expect(result.current('nav.home')).toBe(dict['nav.home'][lang]);
    }
  });
});
