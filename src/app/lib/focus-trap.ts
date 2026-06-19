import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])', 'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// Traps Tab focus inside `containerRef` while `active` is true. On activation
// it focuses the first tabbable child (or the container itself) and restores
// focus to whatever was active before on cleanup. Pair with an Escape handler
// at the call site — this hook only owns Tab cycling.
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const root = containerRef.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;

    const focusables = () => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter((el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null);

    const initial = focusables()[0] ?? root;
    initial.focus({ preventScroll: true });
    if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '-1');

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) { e.preventDefault(); return; }
      const first = list[0]; const last = list[list.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey && current === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && current === last) { e.preventDefault(); first.focus(); }
    };

    root.addEventListener('keydown', onKey);
    return () => {
      root.removeEventListener('keydown', onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [active, containerRef]);
}
