import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share } from 'lucide-react';
import appIconUrl from '../../imports/SOCIAL_FAKTS.png';
import { safeStorage, STORAGE_KEYS } from '../lib/storage-safe';

// Événement non standard exposé par Chromium pour déclencher l'installation.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const SNOOZE_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours avant de reproposer
const DELAY_MS = 5000; // on attend quelques secondes avant de proposer

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;
}

/**
 * Notification flottante (style push) qui, après quelques secondes, propose
 * d'installer l'application puis déclenche une vraie installation PWA.
 * - Android/Chromium : utilise l'événement `beforeinstallprompt` → installation native.
 * - iOS/Safari : affiche les instructions « Ajouter à l'écran d'accueil ».
 * Masquée si l'app est déjà installée ou récemment refusée.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isStandalone()) return;

    const snoozedAt = safeStorage.get<number>(STORAGE_KEYS.installPrompt, 0);
    if (snoozedAt && Date.now() - snoozedAt < SNOOZE_MS) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      timer = setTimeout(() => setVisible(true), DELAY_MS);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
      safeStorage.set(STORAGE_KEYS.installPrompt, Date.now() + SNOOZE_MS * 52);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // iOS ne déclenche pas beforeinstallprompt : on propose les instructions.
    if (isIOS()) {
      timer = setTimeout(() => {
        setIosMode(true);
        setVisible(true);
      }, DELAY_MS);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const snooze = () => {
    safeStorage.set(STORAGE_KEYS.installPrompt, Date.now());
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') setVisible(false);
      else snooze();
    } catch {
      snooze();
    }
    setDeferred(null);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed left-3 right-3 z-[95] mx-auto max-w-md"
          style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
          role="dialog"
          aria-live="polite"
        >
          <div
            className="flex items-center gap-3 p-3"
            style={{
              background: '#FFFFFF',
              borderRadius: 18,
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
              border: '1px solid rgba(60,60,67,0.12)',
            }}
          >
            <img
              src={appIconUrl}
              alt="IPPOO Social-Fact"
              style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
            />
            <div className="min-w-0 flex-1">
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '0.9rem', color: '#1a1a1a' }}>
                Installer IPPOO Social-Fact
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#717182', lineHeight: 1.3 }}>
                {iosMode
                  ? 'Appuyez sur Partager puis « Sur l’écran d’accueil »'
                  : 'Accès rapide, mode hors-ligne et notifications'}
              </div>
            </div>
            {!iosMode ? (
              <button
                onClick={install}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2"
                style={{
                  background: '#0066FF',
                  color: '#fff',
                  borderRadius: 9999,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                <Download size={15} /> Installer
              </button>
            ) : (
              <Share size={22} style={{ color: '#0066FF', flexShrink: 0 }} />
            )}
            <button onClick={snooze} aria-label="Fermer" className="flex-shrink-0" style={{ color: '#717182' }}>
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
