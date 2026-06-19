import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: string; kind: ToastKind; message: string; }

interface Ctx {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastCtx = createContext<Ctx>({ show: () => {} });

export function useToast() { return useContext(ToastCtx); }

const TOAST_EVENT = 'app:toast';
export function emitToast(message: string, kind: ToastKind = 'success') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, kind } }));
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ message: string; kind?: ToastKind }>;
      show(ce.detail.message, ce.detail.kind);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, [show]);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="fixed left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-[92%] max-w-sm" style={{ bottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertTriangle : Info;
            const tone = t.kind === 'success' ? '#00C853' : t.kind === 'error' ? '#FF3B30' : '#0066FF';
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                className="pointer-events-auto bg-[#1a1a1a] text-white px-4 py-3 flex items-center gap-3 shadow-2xl"
              >
                <Icon size={18} style={{ color: tone }}/>
                <span className="flex-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 500 }}>
                  {t.message}
                </span>
                <button onClick={() => setToasts((arr) => arr.filter((x) => x.id !== t.id))} aria-label="Fermer">
                  <X size={14} className="opacity-70"/>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
