import { useEffect, useRef, useState, type ReactNode, type ChangeEvent, type DragEvent } from 'react';
import { ConfirmDialog } from './AdminToast';
import { useFocusTrap } from '../lib/focus-trap';
import { uploadPublicMedia } from '../lib/api';
import { Search, Plus, Trash2, Pencil, RotateCcw, Upload, Image as ImageIcon, X, Music, Film, Download } from 'lucide-react';

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : Array.isArray(v) ? v.join(' | ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportCsv<T extends Record<string, unknown>>(filename: string, rows: T[], columns: { key: keyof T & string; label: string; get?: (r: T) => unknown }[]) {
  const header = columns.map((c) => csvEscape(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => csvEscape(c.get ? c.get(r) : r[c.key])).join(',')).join('\n');
  const csv = '\uFEFF' + header + '\n' + body;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function Toolbar({ search, onSearch, onCreate, onReset, onExport, createLabel = 'Nouveau' }: {
  search: string; onSearch: (v: string) => void; onCreate?: () => void; onReset?: () => void; onExport?: () => void; createLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex-1 relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717182]" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Rechercher…"
          className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAEAEE] focus:border-[#0066FF] outline-none"
          style={{ borderRadius: 8, fontSize: '0.85rem' }}
        />
      </div>
      {onExport && (
        <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#EAEAEE] hover:bg-[#F7F7FA]" style={{ borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, color: '#1a1a1a' }} title="Exporter en CSV">
          <Download size={13} /> Export CSV
        </button>
      )}
      {onReset && (
        <button onClick={onReset} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#EAEAEE] hover:bg-[#F7F7FA]" style={{ borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, color: '#1a1a1a' }}>
          <RotateCcw size={13} /> Réinitialiser
        </button>
      )}
      {onCreate && (
        <button onClick={onCreate} className="flex items-center gap-1.5 px-3 py-2 bg-[#0066FF] text-white hover:bg-[#0052CC]" style={{ borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>
          <Plus size={14} /> {createLabel}
        </button>
      )}
    </div>
  );
}

export interface Column<T> {
  key: string;
  label: string;
  render: (it: T) => ReactNode;
  width?: string;
}

export function Table<T extends { id: string }>({ rows, columns, onEdit, onDelete, deleteLabel }: {
  rows: T[]; columns: Column<T>[]; onEdit?: (it: T) => void; onDelete?: (it: T) => void; deleteLabel?: (it: T) => string;
}) {
  const [confirmItem, setConfirmItem] = useState<T | null>(null);
  return (
    <div className="bg-white border border-[#EAEAEE] overflow-hidden" style={{ borderRadius: 12 }}>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ fontSize: '0.85rem' }}>
          <thead className="bg-[#F7F7FA] border-b border-[#EAEAEE]">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 text-left" style={{ width: c.width, fontSize: '0.7rem', fontWeight: 700, color: '#717182', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {c.label}
                </th>
              ))}
              {(onEdit || onDelete) && <th style={{ width: 110 }}></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEAEE]">
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center" style={{ color: '#717182' }}>Aucun élément.</td></tr>
            )}
            {rows.map((it) => (
              <tr key={it.id} className="hover:bg-[#F7F7FA] transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3" style={{ color: '#1a1a1a' }}>
                    {c.render(it)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {onEdit && (
                        <button onClick={() => onEdit(it)} className="w-8 h-8 flex items-center justify-center hover:bg-[#E5EFFF] text-[#0066FF]" style={{ borderRadius: 6 }} title="Modifier">
                          <Pencil size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => setConfirmItem(it)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[#FEEAEA] text-[#D32F2F]"
                          style={{ borderRadius: 6 }}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!confirmItem}
        title="Supprimer cet élément ?"
        message={confirmItem && deleteLabel ? `${deleteLabel(confirmItem)} sera définitivement supprimé.` : 'Cette action est irréversible.'}
        confirmLabel="Supprimer"
        danger
        onCancel={() => setConfirmItem(null)}
        onConfirm={() => { if (confirmItem && onDelete) onDelete(confirmItem); setConfirmItem(null); }}
      />
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div className="mt-1" style={{ fontSize: '0.7rem', color: '#717182' }}>{hint}</div>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 bg-white border border-[#EAEAEE] focus:border-[#0066FF] outline-none"
      style={{ borderRadius: 8, fontSize: '0.85rem' }}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full px-3 py-2 bg-white border border-[#EAEAEE] focus:border-[#0066FF] outline-none resize-y"
      style={{ borderRadius: 8, fontSize: '0.85rem', minHeight: 80 }}
    />
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-white border border-[#EAEAEE] focus:border-[#0066FF] outline-none"
      style={{ borderRadius: 8, fontSize: '0.85rem' }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Modal({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  useFocusTrap(panelRef, open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-y-auto bg-black/40" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div ref={panelRef} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-2xl my-8" style={{ borderRadius: 14 }}>
        <div className="px-6 py-4 border-b border-[#EAEAEE]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#1a1a1a' }}>
          {title}
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-[#EAEAEE] flex items-center justify-end gap-2 bg-[#F7F7FA]" style={{ borderRadius: '0 0 14px 14px' }}>{footer}</div>}
      </div>
    </div>
  );
}

// Downscale large images client-side to a JPEG/PNG Blob before upload so we
// don't ship 12 Mo originals to Storage. SVG/GIF/WebP pass through untouched.
async function downscaleImage(file: File, maxSize = 1600, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return new Promise<Blob>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
      if (ratio === 1) return resolve(file);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, w, h);
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((b) => resolve(b ?? file), mime, quality);
    };
    img.onerror = () => resolve(file);
    img.src = dataUrl;
  });
}

export function ImageUpload({ value, onChange, aspect = '16/9' }: {
  value: string; onChange: (url: string) => void; aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    setError(null);
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Format non supporté.'); return; }
    if (file.size > 12 * 1024 * 1024) { setError('Image trop volumineuse (max 12 Mo).'); return; }
    setBusy(true);
    try {
      const blob = await downscaleImage(file);
      const namedFile = blob instanceof File ? blob : new File([blob], file.name, { type: blob.type || file.type });
      const { url } = await uploadPublicMedia(namedFile);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload impossible.');
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className="relative bg-[#F7F7FA] border-2 border-dashed transition-colors overflow-hidden"
        style={{ borderRadius: 10, borderColor: drag ? '#0066FF' : '#EAEAEE', aspectRatio: aspect }}
      >
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
              style={{ borderRadius: 999 }}
              title="Retirer"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#717182] hover:text-[#0066FF] transition-colors"
          >
            {busy ? (
              <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>Chargement…</div>
            ) : (
              <>
                <div className="w-11 h-11 bg-white border border-[#EAEAEE] flex items-center justify-center" style={{ borderRadius: 10 }}>
                  <ImageIcon size={18} />
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Cliquez ou glissez une image</div>
                <div style={{ fontSize: '0.7rem' }}>PNG, JPG, WebP · aucune limite</div>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#EAEAEE] hover:bg-[#F7F7FA]"
          style={{ borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, color: '#1a1a1a' }}
        >
          <Upload size={13} /> {value ? 'Remplacer' : 'Importer'}
        </button>
        <input
          type="text"
          value={value.startsWith('data:') ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…ou collez une URL d'image"
          className="flex-1 px-3 py-2 bg-white border border-[#EAEAEE] focus:border-[#0066FF] outline-none"
          style={{ borderRadius: 8, fontSize: '0.8rem' }}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => { handleFiles(e.target.files); e.target.value = ''; }}
      />

      {error && <div style={{ fontSize: '0.72rem', color: '#D32F2F' }}>{error}</div>}
    </div>
  );
}

export function MediaUpload({ kind, value, onChange }: {
  kind: 'audio' | 'video'; value: string; onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const accept = kind === 'audio' ? 'audio/*' : 'video/*';
  const Icon = kind === 'audio' ? Music : Film;
  const label = kind === 'audio' ? 'audio' : 'vidéo';

  const handleFiles = async (files: FileList | null) => {
    setError(null);
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith(`${kind}/`)) { setError('Format non supporté.'); return; }
    const maxMb = kind === 'audio' ? 30 : 80;
    if (file.size > maxMb * 1024 * 1024) { setError(`Fichier trop volumineux (max ${maxMb} Mo).`); return; }
    setBusy(true);
    try {
      const { url } = await uploadPublicMedia(file);
      setFileName(file.name);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload impossible.');
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  };

  const isData = value.startsWith('data:');
  const isUploaded = !isData && (value.includes('/storage/v1/object/public/') || value.includes(`/${'make-506b7b3b-public'}/`));

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className="relative bg-[#F7F7FA] border-2 border-dashed transition-colors"
        style={{ borderRadius: 10, borderColor: drag ? '#0066FF' : '#EAEAEE', padding: value ? 12 : 24 }}
      >
        {value ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 bg-white border border-[#EAEAEE] flex items-center justify-center flex-shrink-0" style={{ borderRadius: 9 }}>
                  <Icon size={16} className="text-[#0066FF]" />
                </div>
                <div className="min-w-0">
                  <div className="truncate" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a1a1a' }}>
                    {fileName ?? (isData ? `Fichier ${label} importé` : value)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#717182' }}>
                    {isData ? 'Stocké localement (base64)' : isUploaded ? 'Hébergé sur Supabase Storage' : 'URL externe'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { onChange(''); setFileName(null); }}
                className="w-8 h-8 bg-white border border-[#EAEAEE] hover:bg-[#FEEAEA] hover:text-[#D32F2F] text-[#717182] flex items-center justify-center flex-shrink-0"
                style={{ borderRadius: 999 }}
                title="Retirer"
              >
                <X size={14} />
              </button>
            </div>
            {kind === 'audio' ? (
              <audio src={value} controls className="w-full" style={{ height: 36 }} />
            ) : (
              <video src={value} controls className="w-full bg-black" style={{ borderRadius: 8, maxHeight: 220 }} />
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 text-[#717182] hover:text-[#0066FF] transition-colors py-3"
          >
            {busy ? (
              <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>Chargement…</div>
            ) : (
              <>
                <div className="w-11 h-11 bg-white border border-[#EAEAEE] flex items-center justify-center" style={{ borderRadius: 10 }}>
                  <Icon size={18} />
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Cliquez ou glissez un fichier {label}</div>
                <div style={{ fontSize: '0.7rem' }}>{kind === 'audio' ? 'MP3, WAV, OGG' : 'MP4, WebM'} · aucune limite</div>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#EAEAEE] hover:bg-[#F7F7FA]"
          style={{ borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, color: '#1a1a1a' }}
        >
          <Upload size={13} /> {value ? 'Remplacer' : 'Importer'}
        </button>
        <input
          type="text"
          value={isData ? '' : value}
          onChange={(e) => { onChange(e.target.value); setFileName(null); }}
          placeholder={`…ou collez une URL ${label}`}
          className="flex-1 px-3 py-2 bg-white border border-[#EAEAEE] focus:border-[#0066FF] outline-none"
          style={{ borderRadius: 8, fontSize: '0.8rem' }}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => { handleFiles(e.target.files); e.target.value = ''; }}
      />

      {error && <div style={{ fontSize: '0.72rem', color: '#D32F2F' }}>{error}</div>}
    </div>
  );
}

export function Btn({ variant = 'default', children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'danger' }) {
  const styles = {
    default: { background: 'white', color: '#1a1a1a', border: '1px solid #EAEAEE' },
    primary: { background: '#0066FF', color: 'white', border: '1px solid #0066FF' },
    danger: { background: '#D32F2F', color: 'white', border: '1px solid #D32F2F' },
  }[variant];
  return (
    <button {...props} className="px-3.5 py-2 transition-opacity hover:opacity-90" style={{ ...styles, borderRadius: 8, fontSize: '0.83rem', fontWeight: 600 }}>
      {children}
    </button>
  );
}
