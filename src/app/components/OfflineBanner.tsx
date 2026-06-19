import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { WifiOff, CloudUpload } from 'lucide-react';
import { useT } from '../lib/i18n';
import { useQueueSize } from '../lib/use-queue-size';

export function OfflineBanner() {
  const t = useT();
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const pending = useQueueSize();

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  const visible = !online || pending > 0;
  const isSyncing = online && pending > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -32, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[80] text-white py-2 px-4 flex items-center justify-center gap-2"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)',
            background: isSyncing ? '#0066FF' : '#FF3B30',
          }}
        >
          {isSyncing ? <CloudUpload size={14} /> : <WifiOff size={14} />}
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 700 }}>
            {isSyncing
              ? t('offline.syncing', `Synchronisation… ${pending} action${pending > 1 ? 's' : ''} en attente`)
              : pending > 0
                ? t('offline.queued', `Hors-ligne — ${pending} action${pending > 1 ? 's' : ''} en attente`)
                : t('offline.banner')}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
