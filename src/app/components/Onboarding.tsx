import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, MapPin, Sparkles, Check, Search } from 'lucide-react';
import { useUser } from '../lib/user';
import { useResolvedSections } from '../lib/admin-overrides';
import { AFRICA } from '../data/countries';
import logoUrl from '../../imports/social_fact_logo.png';
import logoDarkUrl from '../../imports/social_fact_logo_drak_mode.png';
import { useTheme } from '../lib/theme';
import { useT } from '../lib/i18n';

const STEPS = 3;

export function Onboarding() {
  const { user, update } = useUser();
  const { isDark } = useTheme();
  const t = useT();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [zone, setZone] = useState("Bénin");
  const [countryQuery, setCountryQuery] = useState('');
  const [followed, setFollowed] = useState<string[]>(['actu', 'opportunities', 'consommation']);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.toLowerCase().trim();
    return q ? AFRICA.filter((c) => c.name.toLowerCase().includes(q)) : AFRICA;
  }, [countryQuery]);

  if (user.onboarded) return null;

  const last = STEPS - 1;
  const next = () => setStep((s) => s + 1);
  const finish = () => update({
    firstName: name.trim() || 'ami(e)',
    zone, followedSections: followed, onboarded: true,
  });

  const pickable = useResolvedSections().filter((s) => !s.hidden && !['home', 'search', 'profile'].includes(s.key));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[90] bg-white max-w-2xl mx-auto flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} className={`h-1 transition-all ${i <= step ? 'bg-[#0066FF]' : 'bg-[#F0F0F0]'}`} style={{ width: i === step ? 24 : 12 }}/>
          ))}
        </div>
        {step < last && (
          <button onClick={finish} className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600 }}>
            {t('onb.skip')}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="pt-6 text-center">
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <img src={isDark ? logoDarkUrl : logoUrl} alt="" className="w-full h-full object-contain"/>
              </div>
              <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                {t('onb.welcome')}
              </h1>
              <p className="text-[#717182] mt-3 max-w-sm mx-auto" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.92rem', lineHeight: 1.5 }}>
                {t('onb.intro')}
              </p>
              <div className="mt-8">
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder={t('onb.firstname_ph')}
                  className="w-full px-4 py-3 bg-[#FAFAFA] border-0 outline-none text-center"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', fontWeight: 600 }}
                />
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="pt-4">
              <div className="w-12 h-12 bg-[#FF3FA4]/10 flex items-center justify-center mb-4">
                <MapPin size={20} className="text-[#FF3FA4]"/>
              </div>
              <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
                {t('onb.zone_title')}
              </h2>
              <p className="text-[#717182] mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem' }}>
                Choisissez votre pays parmi les 54 États d'Afrique
              </p>
              <div className="mt-5 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717182]" />
                <input
                  value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)}
                  placeholder="Rechercher un pays…"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAFAFA] border-0 outline-none"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem' }}
                />
              </div>
              <div className="mt-3 max-h-[55vh] overflow-y-auto -mx-1 px-1">
                <div className="grid grid-cols-1 gap-1.5">
                  {filteredCountries.map((c) => (
                    <button
                      key={c.code} onClick={() => setZone(c.name)}
                      className={`flex items-center justify-between p-2.5 ${zone === c.name ? 'bg-[#FF3FA4]/8 border-2 border-[#FF3FA4]' : 'bg-[#FAFAFA] border-2 border-transparent'}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span style={{ minWidth: 32, padding: '2px 6px', background: '#FFFFFF', border: '1px solid #EAEAEE', fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em', borderRadius: 4, textAlign: 'center', color: '#1a1a1a' }}>{c.code}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.86rem', color: '#1a1a1a' }}>{c.name}</span>
                      </span>
                      {zone === c.name && <Check size={14} className="text-[#FF3FA4]"/>}
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="text-center py-6 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                      Aucun pays trouvé
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="pt-4">
              <div className="w-12 h-12 bg-[#00C853]/10 flex items-center justify-center mb-4">
                <Sparkles size={20} className="text-[#00C853]"/>
              </div>
              <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
                {t('onb.sect_title')}
              </h2>
              <p className="text-[#717182] mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem' }}>
                {t('onb.sect_hint')} ({followed.length})
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {pickable.map((s) => {
                  const on = followed.includes(s.key);
                  return (
                    <button
                      key={s.key}
                      onClick={() => setFollowed((arr) => on ? arr.filter((k) => k !== s.key) : [...arr, s.key])}
                      className={`p-3 text-left flex items-center justify-between ${on ? 'border-2' : 'bg-[#FAFAFA] border-2 border-transparent'}`}
                      style={on ? { borderColor: s.color, background: `${s.color}10` } : {}}
                    >
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.82rem', color: '#1a1a1a' }}>{s.short}</span>
                      {on && <Check size={14} style={{ color: s.color }}/>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 pb-6 pt-4 border-t border-[#F0F0F0]">
        <button
          onClick={() => step < last ? next() : finish()}
          disabled={step === 0 && !name.trim()}
          className="w-full py-3.5 bg-[#0066FF] text-white flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}
        >
          {step < last ? t('onb.continue') : t('onb.start')}
          <ChevronRight size={16}/>
        </button>
      </div>
    </motion.div>
  );
}
