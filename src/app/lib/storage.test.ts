import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavorites, useHistory, useComments } from './storage';

const item = (id: string) => ({
  id, kind: 'article' as const, title: `T${id}`, image: 'x.jpg', meta: 'meta',
});

describe('useFavorites', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.items).toEqual([]);
    expect(result.current.has('a1')).toBe(false);
  });

  it('toggles an item on/off', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle(item('a1')));
    expect(result.current.has('a1')).toBe(true);
    expect(result.current.items).toHaveLength(1);
    act(() => result.current.toggle(item('a1')));
    expect(result.current.has('a1')).toBe(false);
  });

  it('removes by id', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle(item('a1')));
    act(() => result.current.toggle(item('a2')));
    act(() => result.current.remove('a1'));
    expect(result.current.has('a1')).toBe(false);
    expect(result.current.has('a2')).toBe(true);
  });

  it('persists across hook instances via storage event', () => {
    const a = renderHook(() => useFavorites());
    const b = renderHook(() => useFavorites());
    act(() => a.result.current.toggle(item('a1')));
    expect(b.result.current.has('a1')).toBe(true);
  });

  it('restore merges without duplicating existing ids', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle(item('a1')));
    act(() => result.current.restore([
      { ...item('a1'), savedAt: 1 },
      { ...item('a2'), savedAt: 2 },
    ]));
    expect(result.current.items).toHaveLength(2);
  });
});

describe('useHistory', () => {
  it('pushes most-recent first and dedupes', () => {
    const { result } = renderHook(() => useHistory());
    act(() => result.current.push(item('a1')));
    act(() => result.current.push(item('a2')));
    act(() => result.current.push(item('a1')));
    expect(result.current.items.map((i) => i.id)).toEqual(['a1', 'a2']);
  });

  it('caps at 50 entries', () => {
    const { result } = renderHook(() => useHistory());
    act(() => {
      for (let i = 0; i < 60; i++) result.current.push(item(`a${i}`));
    });
    expect(result.current.items.length).toBeLessThanOrEqual(50);
  });

  it('clear empties history', () => {
    const { result } = renderHook(() => useHistory());
    act(() => result.current.push(item('a1')));
    act(() => result.current.clear());
    expect(result.current.items).toEqual([]);
  });
});

describe('useComments', () => {
  it('starts empty (server-backed; fetch resolves to [] in tests)', () => {
    const { result } = renderHook(() => useComments('a1'));
    expect(result.current.count).toBe(0);
  });

  it('adds and trims a new comment', () => {
    const { result } = renderHook(() => useComments('xyz'));
    expect(result.current.count).toBe(0);
    act(() => result.current.add('Alice', '  hello  '));
    expect(result.current.count).toBe(1);
    expect(result.current.list[0].text).toBe('hello');
    expect(result.current.list[0].author).toBe('Alice');
  });

  it('ignores empty comments', () => {
    const { result } = renderHook(() => useComments('xyz'));
    act(() => result.current.add('A', '   '));
    expect(result.current.count).toBe(0);
  });

  it('toggles like count', () => {
    const { result } = renderHook(() => useComments('xyz'));
    act(() => result.current.add('A', 'hi'));
    const id = result.current.list[0].id;
    const before = result.current.list[0].likes;
    act(() => result.current.toggleLike(id));
    expect(result.current.list[0].likes).toBe(before + 1);
    act(() => result.current.toggleLike(id));
    expect(result.current.list[0].likes).toBe(before);
  });

  it('removes a comment', () => {
    const { result } = renderHook(() => useComments('xyz'));
    act(() => result.current.add('A', 'hi'));
    const id = result.current.list[0].id;
    act(() => result.current.remove(id));
    expect(result.current.count).toBe(0);
  });
});
