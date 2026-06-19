import { useEffect, useState } from 'react';
import { queueSize, QUEUE_CHANGE_EVENT } from './offline-queue';

export function useQueueSize(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void queueSize().then((c) => { if (!cancelled) setN(c); });
    };
    refresh();
    window.addEventListener(QUEUE_CHANGE_EVENT, refresh);
    window.addEventListener('online', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(QUEUE_CHANGE_EVENT, refresh);
      window.removeEventListener('online', refresh);
    };
  }, []);
  return n;
}
