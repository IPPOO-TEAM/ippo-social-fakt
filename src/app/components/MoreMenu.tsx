import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Search, User, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { SectionKey } from '../data/sections';
import { useResolvedSections } from '../lib/admin-overrides';
import { useT } from '../lib/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (key: SectionKey, rubric?: string) => void;
  current?: SectionKey;
}

export function MoreMenu({ open, onClose, onPick, current }: Props) {
  const t = useT();
  const navigate = useNavigate();
  const resolved = useResolvedSections();
  const items = resolved.filter((s) => !s.hidden && !['home', 'search', 'profile'].includes(s.key));
  const [expanded, setExpanded] = useState<SectionKey | null>(null);

  const go = (k: SectionKey, rubric?: string) => { onPick(k, rubric); onClose(); };
  const goPoetryWall = () => { navigate('/bien-etre'); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[58] bg-black/60"
          />
          <motion.aside
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 left-0 bottom-0 z-[59] w-[88%] max-w-sm bg-white flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0] flex-shrink-0">
              <button onClick={onClose} aria-label={t('common.close')} className="w-9 h-9 flex items-center justify-center -ml-2">
                <X size={22} className="text-[#1a1a1a]"/>
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => go('search')} className="w-9 h-9 flex items-center justify-center" aria-label={t('common.search')}>
                  <Search size={18} className="text-[#1a1a1a]"/>
                </button>
                <button onClick={() => go('profile')} className="w-9 h-9 bg-[#0066FF] text-white flex items-center justify-center" aria-label={t('common.profile')} style={{ borderRadius: 999 }}>
                  <User size={16} />
                </button>
              </div>
            </div>

            {/* Sections list */}
            <nav className="overflow-y-auto flex-1">
              <div className="border-b border-[#F0F0F0]">
                <button
                  onClick={goPoetryWall}
                  className="w-full text-left px-5 py-4 flex items-center gap-2.5"
                >
                  <span className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: '#FAFAFA', color: '#1a1a1a', borderRadius: 999 }}>
                    <Sparkles size={15} />
                  </span>
                  <span
                    style={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: '#1a1a1a',
                      letterSpacing: '-0.01em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Quietly Deep Mind of Poetry Wall
                  </span>
                </button>
              </div>
              {items.map((s) => {
                const o = expanded === s.key;
                const active = current === s.key;
                const hasRubrics = s.rubrics.length > 0;
                return (
                  <div key={s.key} className="border-b border-[#F0F0F0]">
                    <div className="flex items-stretch">
                      <button
                        onClick={() => go(s.key)}
                        className="flex-1 text-left px-5 py-4"
                      >
                        <span
                          style={{
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: 800,
                            fontSize: '1.05rem',
                            color: active ? '#0066FF' : '#1a1a1a',
                            letterSpacing: '-0.01em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {s.label}
                        </span>
                      </button>
                      {hasRubrics && (
                        <button
                          onClick={() => setExpanded(o ? null : s.key)}
                          className="px-5 flex items-center border-l border-[#F0F0F0]"
                          aria-label={o ? t('menu.collapse') : t('menu.expand')}
                        >
                          {o ? <Minus size={18} className="text-[#1a1a1a]"/> : <Plus size={18} className="text-[#1a1a1a]"/>}
                        </button>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {o && hasRubrics && (
                        <motion.div
                          key="content"
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pb-3">
                            {s.rubrics.map((r) => (
                              <button
                                key={r.label}
                                onClick={() => go(s.key, r.label)}
                                className="w-full text-left px-5 py-2 hover:bg-[#FAFAFA] transition-colors"
                                style={{
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '0.92rem',
                                  fontWeight: 500,
                                  color: '#1a1a1a',
                                }}
                              >
                                {r.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            <div className="px-5 py-3 border-t border-[#F0F0F0] flex-shrink-0">
              <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                IPPOO Social-Fact · v1.0.0
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
