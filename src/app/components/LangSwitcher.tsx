import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Globe } from 'lucide-react';
import { useUser, type UserProfile } from '../lib/user';

// Only languages with sufficient dictionary coverage are exposed in the UI.
// African-language entries currently fall back to French via the i18n helper
// when no override is supplied, which misleads users who pick e.g. Wolof and
// then see a French interface. Re-add a language here once its dictionary
// pass is complete — the dict + type infra remain ready to receive them.
const LANGUAGES: { code: UserProfile['language']; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
];

function CodePill({ code, active }: { code: string; active?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 28, padding: '2px 6px',
        background: active ? '#0066FF' : '#F4F4F6',
        color: active ? 'white' : '#1a1a1a',
        fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em',
        borderRadius: 6,
      }}
    >
      {code.toUpperCase()}
    </span>
  );
}

export function LangSwitcher() {
  const { user, update } = useUser();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === user.language) ?? LANGUAGES[0];

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 bg-[#FAFAFA] flex items-center justify-center gap-1"
        aria-label="Choisir la langue"
        title={current.label}
      >
        <CodePill code={current.code} active />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 bg-black/30"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-3 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white shadow-xl border border-[#F0F0F0] z-40"
            >
              <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center gap-2">
                <Globe size={14} className="text-[#0066FF]"/>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>Langue</span>
              </div>
              <div className="max-h-80 overflow-y-auto py-1">
                {LANGUAGES.map((l) => {
                  const active = l.code === user.language;
                  return (
                    <button
                      key={l.code}
                      onClick={() => { update({ language: l.code }); setOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#FAFAFA] text-left ${active ? 'bg-[#0066FF]/5' : ''}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <CodePill code={l.code} active={active} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: active ? 700 : 500, fontSize: '0.85rem', color: '#1a1a1a' }}>
                          {l.label}
                        </span>
                      </span>
                      {active && <Check size={14} className="text-[#0066FF]"/>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
