import { ImageWithFallback } from '../figma/ImageWithFallback';
import {
 ChevronLeft, Trash2, Bookmark, Newspaper, Mic, Video, History as HistoryIcon,
 Search, X, GripVertical, ArrowDownUp, Check, CheckCheck, Square, CheckSquare,
 Share2, Undo2,
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform, useSpring } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFavorites, useHistory, SavedItem } from '../../lib/storage';
import { EmptyState } from '../EmptyState';
import { useT } from '../../lib/i18n';

function AnimatedCount({ value }: { value: number }) {
 const spring = useSpring(value, { damping: 22, stiffness: 260 });
 const [display, setDisplay] = useState(value);
 useEffect(() => { spring.set(value); }, [value, spring]);
 useEffect(() => spring.on('change', (v) => setDisplay(Math.round(v))), [spring]);
 return <>{display}</>;
}

interface Props {
 kind: 'favorites' | 'history';
 onBack: () => void;
}

type Sort = 'recent' | 'oldest' | 'type';
type TypeFilter = 'all' | 'article' | 'episode' | 'video';

const iconMap = { article: Newspaper, episode: Mic, video: Video };

function vibrate(p: number | number[]) {
 if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
 try { navigator.vibrate(p); } catch {}
 }
}

export function SavedListView({ kind, onBack }: Props) {
 const t = useT();
 const typeLabels: Record<SavedItem['kind'], string> = {
   article: t('saved.type.article'), episode: t('saved.type.episode'), video: t('saved.type.video'),
 };
 const tabs: { key: TypeFilter; label: string }[] = [
   { key: 'all', label: t('saved.tab.all') },
   { key: 'article', label: t('saved.tab.article') },
   { key: 'episode', label: t('saved.tab.episode') },
   { key: 'video', label: t('saved.tab.video') },
 ];
 const sortLabels: Record<Sort, string> = {
   recent: t('saved.sort.recent'),
   oldest: t('saved.sort.oldest'),
   type: t('saved.sort.type'),
 };
 const fav = useFavorites();
 const hist = useHistory();
 const items = kind === 'favorites' ? fav.items : hist.items;
 const restore = kind === 'favorites' ? fav.restore : hist.restore;

 const [undo, setUndo] = useState<{ items: SavedItem[]; t: number } | null>(null);
 const undoTimer = useRef<number | null>(null);

 const clearUndoTimer = () => {
 if (undoTimer.current) { clearTimeout(undoTimer.current); undoTimer.current = null; }
 };

 const removeIds = (ids: string[]) => {
 const removed = items.filter((i) => ids.includes(i.id));
 if (removed.length === 0) return;
 vibrate([10, 20, 30]);
 ids.forEach((id) => (kind === 'favorites' ? fav.remove(id) : hist.remove(id)));
 clearUndoTimer();
 setUndo({ items: removed, t: Date.now() });
 undoTimer.current = window.setTimeout(() => setUndo(null), 5000);
 };

 const undoDelete = () => {
 if (!undo) return;
 restore(undo.items);
 clearUndoTimer();
 setUndo(null);
 vibrate(12);
 };

 useEffect(() => () => clearUndoTimer(), []);

 const onShare = async () => {
 vibrate(10);
 const lines = items.map((i) => `• ${i.title}${i.meta ? ` · ${i.meta}` : ''}`).join('\n');
 const text = `${kind === 'favorites' ? t('saved.title.fav') : t('saved.title.hist')} IPPOO Social-Fact (${items.length})\n\n${lines}`;
 try {
 const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }) : null;
 if (nav?.share) {
 await nav.share({ title: kind === 'favorites' ? t('saved.share.fav') : t('saved.share.hist'), text });
 } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
 await navigator.clipboard.writeText(text);
 setUndo(null);
 setShareToast(true);
 window.setTimeout(() => setShareToast(false), 2200);
 }
 } catch {}
 };
 const [shareToast, setShareToast] = useState(false);

 const [query, setQuery] = useState('');
 const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
 const [sort, setSort] = useState<Sort>('recent');
 const [sortOpen, setSortOpen] = useState(false);
 const [selectMode, setSelectMode] = useState(false);
 const [selected, setSelected] = useState<Set<string>>(new Set());

 const filtered = useMemo(() => {
 const q = query.trim().toLowerCase();
 let arr = items.filter((i) => {
 if (typeFilter !== 'all' && i.kind !== typeFilter) return false;
 if (!q) return true;
 return i.title.toLowerCase().includes(q) || (i.meta || '').toLowerCase().includes(q);
 });
 if (sort === 'recent') arr = [...arr].sort((a, b) => b.savedAt - a.savedAt);
 else if (sort === 'oldest') arr = [...arr].sort((a, b) => a.savedAt - b.savedAt);
 else arr = [...arr].sort((a, b) => a.kind.localeCompare(b.kind) || b.savedAt - a.savedAt);
 return arr;
 }, [items, query, typeFilter, sort]);

 const counts = useMemo(() => ({
 all: items.length,
 article: items.filter((i) => i.kind === 'article').length,
 episode: items.filter((i) => i.kind === 'episode').length,
 video: items.filter((i) => i.kind === 'video').length,
 }), [items]);

 const showSearch = items.length >= 6;
 const allSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));

 const toggleSelect = (id: string) => {
 vibrate(8);
 setSelected((prev) => {
 const next = new Set(prev);
 if (next.has(id)) next.delete(id); else next.add(id);
 return next;
 });
 };

 const toggleAll = () => {
 vibrate(12);
 if (allSelected) setSelected(new Set());
 else setSelected(new Set(filtered.map((i) => i.id)));
 };

 const deleteSelected = () => {
 if (selected.size === 0) return;
 removeIds(Array.from(selected));
 setSelected(new Set());
 setSelectMode(false);
 };

 const enterSelectMode = (initialId?: string) => {
 vibrate(20);
 setSelectMode(true);
 if (initialId) setSelected(new Set([initialId]));
 };

 const exitSelectMode = () => {
 setSelectMode(false);
 setSelected(new Set());
 };

 const title = kind === 'favorites' ? t('saved.title.fav') : t('saved.title.hist');
 const empty = kind === 'favorites' ? t('saved.empty.fav') : t('saved.empty.hist');
 const emptyHint = kind === 'favorites' ? t('saved.empty.fav_hint') : t('saved.empty.hist_hint');

 return (
 <motion.div
 initial={{ y: '100%' }}
 animate={{ y: 0 }}
 exit={{ y: '100%' }}
 transition={{ type: 'spring', damping: 32, stiffness: 320 }}
 className="fixed inset-0 z-[60] bg-white max-w-2xl mx-auto flex flex-col"
 >
 <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-[#F0F0F0]">
 <div className="px-4 py-3 flex items-center gap-3">
 {selectMode ? (
 <button onClick={exitSelectMode} className="px-3 py-2 text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 600 }}>
 {t('saved.cancel')}
 </button>
 ) : (
 <button onClick={onBack} className="w-10 h-10 bg-[#FAFAFA] flex items-center justify-center" aria-label={t('common.back')}>
 <ChevronLeft size={20} className="text-[#1a1a1a]"/>
 </button>
 )}
 <div className="flex-1">
 <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
 {selectMode ? `${selected.size} sélectionné${selected.size > 1 ? 's' : ''}` : title}
 </h1>
 <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
 {selectMode
 ? `sur ${filtered.length} affiché${filtered.length > 1 ? 's' : ''}`
 : `${items.length} élément${items.length > 1 ? 's' : ''}${query ? ` · ${filtered.length} résultat${filtered.length > 1 ? 's' : ''}` : ''}`}
 </div>
 </div>
 {!selectMode && items.length > 0 && kind === 'favorites' && (
 <button
 onClick={onShare}
 className="w-10 h-10 bg-[#FAFAFA] flex items-center justify-center"
 aria-label={t('common.share')}
 >
 <Share2 size={17} className="text-[#1a1a1a]"/>
 </button>
 )}
 {!selectMode && items.length > 0 && (
 <button
 onClick={() => setSelectMode(true)}
 className="px-3 py-2 text-[#0066FF]"
 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 600 }}
 >
 {t('saved.select')}
 </button>
 )}
 {selectMode && (
 <button
 onClick={toggleAll}
 className="flex items-center gap-1.5 px-3 py-2 text-[#0066FF]"
 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 600 }}
 >
 {allSelected ? <Check size={14} /> : <CheckCheck size={14} />}
 {allSelected ? t('saved.none') : t('saved.all')}
 </button>
 )}
 </div>

 {showSearch && !selectMode && (
 <div className="px-4 pb-2.5">
 <div className="relative">
 <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717182]"/>
 <input
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder={kind === 'favorites' ? t('saved.search.fav') : t('saved.search.hist')}
 className="w-full pl-10 pr-10 py-2.5 bg-[#FAFAFA] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0066FF]/20 transition-all"
 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}
 />
 {query && (
 <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#E5E5E5] flex items-center justify-center" aria-label={t('common.close')}>
 <X size={12} />
 </button>
 )}
 </div>
 </div>
 )}

 {items.length > 0 && !selectMode && (
 <div className="px-4 pb-3 flex items-center gap-2">
 <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide">
 {tabs.map((tb) => {
 const c = counts[tb.key];
 const active = typeFilter === tb.key;
 if (tb.key !== 'all' && c === 0) return null;
 return (
 <button
 key={tb.key}
 onClick={() => setTypeFilter(tb.key)}
 className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 transition-all ${
 active ? 'bg-[#1a1a1a] text-white' : 'bg-[#FAFAFA] text-[#717182]'
 }`}
 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600, borderRadius: 'var(--r-pill)' }}
 >
 {tb.label}
 <span className={active ? 'opacity-70' : 'opacity-100'} style={{ fontSize: '0.7rem' }}>
 <AnimatedCount value={c} />
 </span>
 </button>
 );
 })}
 </div>
 <div className="relative">
 <button
 onClick={() => setSortOpen((o) => !o)}
 className="flex items-center gap-1 px-3 py-1.5 bg-[#FAFAFA] text-[#1a1a1a]"
 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600, borderRadius: 'var(--r-pill)' }}
 aria-label={t('saved.sort.button')}
 >
 <ArrowDownUp size={13} />
 {t('saved.sort.button')}
 </button>
 <AnimatePresence>
 {sortOpen && (
 <>
 <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
 <motion.div
 initial={{ opacity: 0, y: -6, scale: 0.96 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -6, scale: 0.96 }}
 transition={{ duration: 0.15 }}
 className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-[#F0F0F0] shadow-xl py-1.5 w-48 overflow-hidden"
 style={{ borderRadius: 'var(--r-md)' }}
 >
 {(Object.keys(sortLabels) as Sort[]).map((s) => (
 <button
 key={s}
 onClick={() => { setSort(s); setSortOpen(false); vibrate(8); }}
 className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#FAFAFA] transition ${
 sort === s ? 'text-[#0066FF]' : 'text-[#1a1a1a]'
 }`}
 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: sort === s ? 600 : 500 }}
 >
 {sortLabels[s]}
 {sort === s && <Check size={14} />}
 </button>
 ))}
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 </div>
 )}
 </header>

 <div className="flex-1 overflow-y-auto" style={{ paddingBottom: selectMode ? 80 : 0 }}>
 {items.length === 0 ? (
 <EmptyState
 icon={kind === 'favorites' ? Bookmark : HistoryIcon}
 title={empty}
 description={emptyHint}
 />
 ) : filtered.length === 0 ? (
 <EmptyState
 icon={Search}
 title={`${t('saved.no_results')}${query ? ` « ${query} »` : ''}`}
 description={t('saved.no_results_hint')}
 />
 ) : (
 <ul className="px-4 py-3 space-y-2">
 <AnimatePresence initial={false}>
 {filtered.map((item) => (
 <Row
 key={item.id}
 item={item}
 selectMode={selectMode}
 selected={selected.has(item.id)}
 onToggleSelect={() => toggleSelect(item.id)}
 onLongPress={() => !selectMode && enterSelectMode(item.id)}
 onDelete={() => removeIds([item.id])}
 />
 ))}
 </AnimatePresence>
 </ul>
 )}
 </div>

 {/* Undo + share toast */}
 <AnimatePresence>
 {(undo || shareToast) && (
 <motion.div
 key={undo ? 'undo' : 'share'}
 initial={{ y: 80, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 exit={{ y: 80, opacity: 0 }}
 transition={{ type: 'spring', damping: 28, stiffness: 320 }}
 className="absolute left-4 right-4 z-20"
 style={{ bottom: selectMode ? 84 : 'calc(env(safe-area-inset-bottom) + 16px)' }}
 >
 <div className="bg-[#1a1a1a] text-white shadow-2xl px-4 py-3 flex items-center gap-3" style={{ borderRadius: 'var(--r-lg)' }}>
 {undo ? (
 <>
 <div className="w-8 h-8 bg-white/10 flex items-center justify-center flex-shrink-0">
 <Trash2 size={15} />
 </div>
 <div className="flex-1 min-w-0" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 500 }}>
 {undo.items.length} {undo.items.length > 1 ? t('saved.deleted_p') : t('saved.deleted')}
 </div>
 <button
 onClick={undoDelete}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#1a1a1a]"
 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}
 >
 <Undo2 size={13} /> {t('saved.undo')}
 </button>
 </>
 ) : (
 <>
 <div className="w-8 h-8 bg-white/10 flex items-center justify-center flex-shrink-0">
 <Check size={15} />
 </div>
 <div className="flex-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 500 }}>
 {t('saved.copied')}
 </div>
 </>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Selection action bar */}
 <AnimatePresence>
 {selectMode && (
 <motion.div
 initial={{ y: 100 }}
 animate={{ y: 0 }}
 exit={{ y: 100 }}
 transition={{ type: 'spring', damping: 26, stiffness: 320 }}
 className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#F0F0F0] px-4 py-3 flex items-center gap-3"
 style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
 >
 <button
 onClick={toggleAll}
 className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FAFAFA] text-[#1a1a1a]"
 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 600, borderRadius: 'var(--r-md)' }}
 >
 {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
 {allSelected ? t('saved.deselect_all') : t('saved.select_all')}
 </button>
 <button
 onClick={deleteSelected}
 disabled={selected.size === 0}
 className={`flex-1 flex items-center justify-center gap-2 py-3 transition-all ${
 selected.size === 0
 ? 'bg-[#FFE5E3] text-[#0066FF]/50 cursor-not-allowed'
 : 'bg-[#0066FF] text-white shadow-[0_8px_20px_-8px_rgba(255,68,54,0.6)]'
 }`}
 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: 700, borderRadius: 'var(--r-md)' }}
 >
 <Trash2 size={16} />
 {t('saved.delete')}{selected.size > 0 && ` (${selected.size})`}
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
}

function Row({
 item, selectMode, selected, onToggleSelect, onLongPress, onDelete,
}: {
 item: SavedItem;
 selectMode: boolean;
 selected: boolean;
 onToggleSelect: () => void;
 onLongPress: () => void;
 onDelete: () => void;
}) {
 const t = useT();
 const typeLabels: Record<SavedItem['kind'], string> = {
   article: t('saved.type.article'), episode: t('saved.type.episode'), video: t('saved.type.video'),
 };
 const Icon = iconMap[item.kind] || Newspaper;
 const x = useMotionValue(0);
 const dragHandleOpacity = useTransform(x, [-30, 0], [0, 0.5]);
 const trashScale = useTransform(x, [-100, -60, 0], [1.15, 1, 0.85]);
 const trashOpacity = useTransform(x, [-100, -30, 0], [1, 0.6, 0.3]);
 const armed = useRef(false);
 const pressTimer = useRef<number | null>(null);

 const formatDate = (ts: number) => {
 const diff = Date.now() - ts;
 const mins = Math.floor(diff / 60000);
 if (mins < 1) return t('saved.row.now');
 const prefix = t('saved.row.min');
 if (mins < 60) return `${prefix ? prefix + ' ' : ''}${mins} ${t('saved.row.min_suf')}`.trim();
 const hours = Math.floor(mins / 60);
 if (hours < 24) return `${prefix ? prefix + ' ' : ''}${hours}${t('saved.row.h')}`.trim();
 const days = Math.floor(hours / 24);
 return `${prefix ? prefix + ' ' : ''}${days}${t('saved.row.d')}`.trim();
 };

 const onDrag = (_: unknown, info: PanInfo) => {
 if (info.offset.x < -90 && !armed.current) {
 armed.current = true;
 vibrate(15);
 } else if (info.offset.x > -90 && armed.current) {
 armed.current = false;
 }
 };

 const onDragEnd = (_: unknown, info: PanInfo) => {
 if (info.offset.x < -100) onDelete();
 armed.current = false;
 };

 const startPress = () => {
 if (selectMode) return;
 pressTimer.current = window.setTimeout(() => onLongPress(), 450);
 };
 const endPress = () => {
 if (pressTimer.current) {
 clearTimeout(pressTimer.current);
 pressTimer.current = null;
 }
 };

 const handleClick = () => {
 if (selectMode) onToggleSelect();
 };

 return (
 <motion.li
 layout
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, x: -300, height: 0, marginTop: 0, transition: { duration: 0.25 } }}
 className="relative overflow-hidden"
 >
 {!selectMode && (
 <div className="absolute inset-0 bg-[#0066FF] flex items-center justify-end pr-6">
 <motion.div style={{ scale: trashScale, opacity: trashOpacity }} className="flex items-center gap-2 text-white">
 <Trash2 size={18} />
 <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{t('saved.delete')}</span>
 </motion.div>
 </div>
 )}
 <motion.div
 drag={selectMode ? false : 'x'}
 dragConstraints={{ left: -120, right: 0 }}
 dragElastic={0.12}
 onDrag={onDrag}
 onDragEnd={onDragEnd}
 onPointerDown={startPress}
 onPointerUp={endPress}
 onPointerLeave={endPress}
 onClick={handleClick}
 whileTap={selectMode ? { scale: 0.98 } : { cursor: 'grabbing' }}
 className={`relative bg-white border p-3 flex items-center gap-2.5 touch-pan-y transition-colors ${
 selected ? 'border-[#0066FF] bg-[#FFF5F4]' : 'border-[#F0F0F0]'
 } ${selectMode ? 'cursor-pointer' : ''}`}
 style={{ borderRadius: 'var(--r-md)', x }}
 >
 {selectMode && (
 <motion.div
 initial={{ scale: 0, width: 0, marginRight: 0 }}
 animate={{ scale: 1, width: 24, marginRight: 4 }}
 exit={{ scale: 0, width: 0, marginRight: 0 }}
 className="flex-shrink-0"
 >
 <div className={`w-6 h-6 flex items-center justify-center transition-all ${
 selected ? 'bg-[#0066FF] border-2 border-[#0066FF]' : 'border-2 border-[#D5D5DC] bg-white'
 }`}>
 {selected && <Check size={14} className="text-white" strokeWidth={3} />}
 </div>
 </motion.div>
 )}

 {!selectMode && (
 <motion.div
 style={{ opacity: dragHandleOpacity }}
 className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
 animate={{ opacity: [0.25, 0.6, 0.25] }}
 transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
 >
 <GripVertical size={14} className="text-[#717182]"/>
 </motion.div>
 )}

 <div className="w-14 h-14 overflow-hidden flex-shrink-0">
 <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover"/>
 </div>
 <div className="flex-1 min-w-0 pr-4">
 <div className="flex items-center gap-1.5 mb-0.5">
 <Icon size={11} className="text-[#717182]"/>
 <span className="text-[#717182] uppercase" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em' }}>
 {typeLabels[item.kind]}{item.meta && ` · ${item.meta}`}
 </span>
 </div>
 <div className="line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a', lineHeight: 1.3 }}>
 {item.title}
 </div>
 <div className="text-[#717182] mt-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
 {formatDate(item.savedAt)}
 </div>
 </div>
 {!selectMode && (
 <button
 onClick={(e) => { e.stopPropagation(); onDelete(); }}
 className="w-9 h-9 hover:bg-[#FFE5E3] flex items-center justify-center text-[#717182] hover:text-[#0066FF] flex-shrink-0 transition-colors"
 aria-label={t('saved.delete')}
 >
 <Trash2 size={15} />
 </button>
 )}
 </motion.div>
 </motion.li>
 );
}
