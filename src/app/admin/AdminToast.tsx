import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { subscribeWriteError } from './store';

type Kind = 'success' | 'error' | 'info';
interface Item { id: number; kind: Kind; message: string }

const Ctx = createContext<{ show: (m: string, k?: Kind) => void } | null>(null);

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, kind: Kind = 'info') => {
    const id = ++idRef.current;
    setItems((p) => [...p, { id, kind, message }]);
    setTimeout(() => setItems((p) => p.filter((it) => it.id !== id)), 3500);
  }, []);

  useEffect(() => subscribeWriteError((e) => {
    if (e === 'quota') show('Stockage local saturé : retirez des médias volumineux ou exportez puis nettoyez.', 'error');
    else if (e === 'unknown') show('Échec d\'enregistrement local.', 'error');
  }), [show]);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none" style={{ fontFamily: 'Inter, sans-serif' }}>
        {items.map((it) => {
          const Icon = it.kind === 'success' ? CheckCircle2 : it.kind === 'error' ? AlertCircle : Info;
          const color = it.kind === 'success' ? '#0F9D58' : it.kind === 'error' ? '#D32F2F' : '#0066FF';
          const bg = it.kind === 'success' ? '#E6F4EA' : it.kind === 'error' ? '#FEEAEA' : '#E5EFFF';
          return (
            <div key={it.id} className="pointer-events-auto flex items-start gap-2 px-3 py-2.5 bg-white border shadow-md min-w-[280px] max-w-sm" style={{ borderColor: bg, borderRadius: 10 }}>
              <Icon size={16} style={{ color }} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1" style={{ fontSize: '0.85rem', color: '#1a1a1a' }}>{it.message}</div>
              <button onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))} className="text-[#717182] hover:text-[#1a1a1a]">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useAdminToast() {
  const v = useContext(Ctx);
  if (!v) return { show: () => {} };
  return v;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = false, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      else if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-6 bg-black/40" onClick={onCancel} style={{ fontFamily: 'Inter, sans-serif' }}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-sm" style={{ borderRadius: 12 }}>
        <div className="px-5 pt-5">
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>{title}</div>
          <div className="mt-1.5" style={{ fontSize: '0.85rem', color: '#717182', lineHeight: 1.5 }}>{message}</div>
        </div>
        <div className="px-5 py-4 mt-4 bg-[#F7F7FA] flex items-center justify-end gap-2" style={{ borderRadius: '0 0 12px 12px' }}>
          <button onClick={onCancel} className="px-3.5 py-2 bg-white border border-[#EAEAEE] hover:bg-[#F0F0F4]" style={{ borderRadius: 8, fontSize: '0.83rem', fontWeight: 600, color: '#1a1a1a' }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="px-3.5 py-2 text-white" style={{ background: danger ? '#D32F2F' : '#0066FF', borderRadius: 8, fontSize: '0.83rem', fontWeight: 600 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
