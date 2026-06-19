import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, ZoomIn, ZoomOut, Check, RotateCw, RotateCcw } from 'lucide-react';

interface Props {
  src: string;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}

const BOX = 280;
const OUTPUT = 512;
const MAX_ZOOM_FACTOR = 4;

export function AvatarCropper({ src, onCancel, onConfirm }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [rotation, setRotation] = useState(0);

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gestureRef = useRef<{
    startTx: number; startTy: number;
    startScale: number;
    startDist?: number;
    startMidX?: number; startMidY?: number;
  } | null>(null);

  useEffect(() => {
    const i = new Image();
    i.onload = () => {
      const m = BOX / Math.min(i.width, i.height);
      setMinScale(m);
      setScale(m);
      setTx(0);
      setTy(0);
      setRotation(0);
      setImg(i);
    };
    i.src = src;
  }, [src]);

  const effectiveSize = (s: number) => {
    if (!img) return { w: 0, h: 0 };
    const rotated = rotation % 180 !== 0;
    const w = (rotated ? img.height : img.width) * s;
    const h = (rotated ? img.width : img.height) * s;
    return { w, h };
  };

  const clamp = (s: number, x: number, y: number) => {
    const { w, h } = effectiveSize(s);
    const maxX = Math.max(0, (w - BOX) / 2);
    const maxY = Math.max(0, (h - BOX) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const setScaleClamped = (s: number) => {
    const next = Math.max(minScale, Math.min(minScale * MAX_ZOOM_FACTOR, s));
    setScale(next);
    const c = clamp(next, tx, ty);
    setTx(c.x); setTy(c.y);
  };

  const beginGesture = () => {
    const ps = Array.from(pointers.current.values());
    if (ps.length === 1) {
      gestureRef.current = { startTx: tx, startTy: ty, startScale: scale, startMidX: ps[0].x, startMidY: ps[0].y };
    } else if (ps.length >= 2) {
      const [a, b] = ps;
      gestureRef.current = {
        startTx: tx, startTy: ty, startScale: scale,
        startDist: Math.hypot(b.x - a.x, b.y - a.y),
        startMidX: (a.x + b.x) / 2,
        startMidY: (a.y + b.y) / 2,
      };
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    beginGesture();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gestureRef.current;
    if (!g) return;
    const ps = Array.from(pointers.current.values());

    if (ps.length >= 2 && g.startDist) {
      const [a, b] = ps;
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const factor = dist / g.startDist;
      const next = Math.max(minScale, Math.min(minScale * MAX_ZOOM_FACTOR, g.startScale * factor));
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const dxMid = midX - (g.startMidX ?? midX);
      const dyMid = midY - (g.startMidY ?? midY);
      const c = clamp(next, g.startTx + dxMid, g.startTy + dyMid);
      setScale(next);
      setTx(c.x); setTy(c.y);
    } else if (ps.length === 1 && g.startMidX !== undefined && g.startMidY !== undefined) {
      const only = ps[0];
      const c = clamp(scale, g.startTx + (only.x - g.startMidX), g.startTy + (only.y - g.startMidY));
      setTx(c.x); setTy(c.y);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      gestureRef.current = null;
    } else {
      beginGesture();
    }
  };

  const rotate = (delta: number) => {
    const next = ((rotation + delta) % 360 + 360) % 360;
    setRotation(next);
    const c = (() => {
      // recompute clamp using next rotation
      if (!img) return { x: tx, y: ty };
      const rotated = next % 180 !== 0;
      const w = (rotated ? img.height : img.width) * scale;
      const h = (rotated ? img.width : img.height) * scale;
      const maxX = Math.max(0, (w - BOX) / 2);
      const maxY = Math.max(0, (h - BOX) / 2);
      return { x: Math.max(-maxX, Math.min(maxX, tx)), y: Math.max(-maxY, Math.min(maxY, ty)) };
    })();
    setTx(c.x); setTy(c.y);
  };

  const confirm = () => {
    if (!img) return;
    const c = document.createElement('canvas');
    c.width = OUTPUT; c.height = OUTPUT;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const k = OUTPUT / BOX;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.save();
    ctx.translate(OUTPUT / 2 + tx * k, OUTPUT / 2 + ty * k);
    ctx.rotate((rotation * Math.PI) / 180);
    const drawW = img.width * scale * k;
    const drawH = img.height * scale * k;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
    onConfirm(c.toDataURL('image/jpeg', 0.88));
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 flex items-end sm:items-center justify-center" onClick={onCancel}>
      <motion.div
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white"
        style={{ borderRadius: '14px 14px 0 0' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0]">
          <div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
              Recadrer la photo
            </div>
            <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
              Glisser · pincer pour zoomer · pivoter
            </div>
          </div>
          <button onClick={onCancel} className="w-9 h-9 flex items-center justify-center" aria-label="Annuler">
            <X size={18} className="text-[#717182]" />
          </button>
        </div>

        <div className="flex flex-col items-center px-4 py-5">
          <div
            className="relative bg-[#0F0A1F] overflow-hidden touch-none select-none"
            style={{ width: BOX, height: BOX, borderRadius: 999, cursor: 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {img && (
              <img
                src={src}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%', top: '50%',
                  width: img.width, height: img.height,
                  transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) rotate(${rotation}deg) scale(${scale})`,
                  transformOrigin: 'center center',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            )}
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)', borderRadius: 999 }} />
          </div>

          <div className="w-full flex items-center gap-3 mt-5">
            <button
              onClick={() => setScaleClamped(scale - 0.1)}
              className="w-9 h-9 bg-[#F4F4F6] flex items-center justify-center"
              style={{ borderRadius: 999 }}
              aria-label="Réduire"
            >
              <ZoomOut size={15} />
            </button>
            <input
              type="range"
              min={minScale}
              max={minScale * MAX_ZOOM_FACTOR}
              step={0.01}
              value={scale}
              onChange={(e) => setScaleClamped(parseFloat(e.target.value))}
              className="flex-1 accent-[#0066FF]"
            />
            <button
              onClick={() => setScaleClamped(scale + 0.1)}
              className="w-9 h-9 bg-[#F4F4F6] flex items-center justify-center"
              style={{ borderRadius: 999 }}
              aria-label="Agrandir"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          <div className="w-full flex items-center justify-between gap-2 mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => rotate(-90)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#F4F4F6]"
                style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#1a1a1a' }}
                aria-label="Pivoter à gauche"
              >
                <RotateCcw size={13} /> -90°
              </button>
              <button
                onClick={() => rotate(90)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#F4F4F6]"
                style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#1a1a1a' }}
                aria-label="Pivoter à droite"
              >
                <RotateCw size={13} /> +90°
              </button>
            </div>
            <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 600 }}>
              {rotation}°
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 pb-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-[#F4F4F6] text-[#1a1a1a]"
            style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem' }}
          >
            Annuler
          </button>
          <button
            onClick={confirm}
            className="flex-1 py-3 bg-[#0066FF] text-white flex items-center justify-center gap-2"
            style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}
          >
            <Check size={15} /> Valider
          </button>
        </div>
      </motion.div>
    </div>
  );
}
