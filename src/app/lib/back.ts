import { useEffect, useRef } from 'react';

/**
 * Wires the browser/phone native back gesture to in-app overlay closers.
 * Pass an ordered stack of [isOpen, close] entries — innermost overlay LAST.
 * When the stack grows, a history entry is pushed; popstate closes the topmost.
 */
export function useNativeBack(stack: Array<[boolean, () => void]>) {
  const depth = stack.filter(([open]) => open).length;
  const prevDepth = useRef(0);
  const closersRef = useRef<Array<() => void>>([]);

  closersRef.current = stack.filter(([open]) => open).map(([, close]) => close);

  useEffect(() => {
    if (depth > prevDepth.current) {
      window.history.pushState({ ippoo: depth }, '');
    }
    prevDepth.current = depth;
  }, [depth]);

  useEffect(() => {
    const onPop = () => {
      const closers = closersRef.current;
      const top = closers[closers.length - 1];
      if (top) {
        top();
        prevDepth.current = Math.max(0, prevDepth.current - 1);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}
