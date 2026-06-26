import { useState } from 'react';
import { Trash2, Loader2, X, Check } from 'lucide-react';
import { deleteContent, getAdminToken, type Resource } from '../lib/api';
import { emitToast } from './Toast';

/**
 * Bouton de suppression CONTEXTUEL réservé à l'admin.
 *
 * S'affiche uniquement si un jeton admin est présent (getAdminToken). Permet à
 * l'admin de supprimer n'importe quel contenu directement depuis la page
 * publique — utile pour corriger une erreur sans passer par le back-office.
 * La suppression est persistée serveur (deleteContent → DELETE /content/:r/:id)
 * et propagée (Realtime / refetch des vues server-only).
 *
 * Confirmation en deux temps (clic → Confirmer/Annuler) pour éviter les
 * suppressions accidentelles.
 */
export function AdminQuickDelete({
  resource,
  id,
  label,
  onDeleted,
  variant = 'overlay',
}: {
  resource: Resource;
  id: string;
  label?: string;
  onDeleted?: () => void;
  /** overlay = pastille flottante sombre (sur média) ; inline = bouton clair. */
  variant?: 'overlay' | 'inline';
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  // Pas d'admin connecté → rien (invisible côté utilisateur normal).
  if (!getAdminToken()) return null;

  const doDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await deleteContent(resource, id);
      emitToast(`${label ?? 'Élément'} supprimé`, 'success');
      onDeleted?.();
    } catch (e) {
      emitToast(e instanceof Error ? e.message : 'Suppression impossible', 'error');
      setBusy(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div
        className="inline-flex items-center gap-1 px-1.5 py-1 backdrop-blur"
        style={{ background: variant === 'overlay' ? 'rgba(0,0,0,0.6)' : '#FFF', borderRadius: 999, border: variant === 'inline' ? '1px solid #EAEAEE' : 'none' }}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
      >
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: variant === 'overlay' ? '#fff' : '#1a1a1a', paddingLeft: 6 }}>
          Supprimer ?
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); void doDelete(); }}
          disabled={busy}
          aria-label="Confirmer la suppression"
          className="w-7 h-7 flex items-center justify-center text-white"
          style={{ background: '#D32F2F', borderRadius: 999 }}
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setConfirming(false); }}
          disabled={busy}
          aria-label="Annuler"
          className="w-7 h-7 flex items-center justify-center"
          style={{ background: variant === 'overlay' ? 'rgba(255,255,255,0.2)' : '#F4F4F6', color: variant === 'overlay' ? '#fff' : '#1a1a1a', borderRadius: 999 }}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); setConfirming(true); }}
      aria-label="Supprimer (admin)"
      title="Supprimer (admin)"
      className="inline-flex items-center justify-center transition-colors"
      style={
        variant === 'overlay'
          ? { width: 36, height: 36, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 999, backdropFilter: 'blur(8px)' }
          : { width: 36, height: 36, background: '#FFE5E5', color: '#D32F2F', borderRadius: 999 }
      }
    >
      <Trash2 size={16} />
    </button>
  );
}
