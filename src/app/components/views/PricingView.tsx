import { motion } from 'motion/react';
import { ChevronLeft, Crown, Check, Sparkles, Shield } from 'lucide-react';
import { PLANS, formatXOF, planById, useSubscription, OPERATORS, CARD_LOGOS, type PlanId } from '../../lib/subscription';

interface Props {
  onBack: () => void;
  onChoose: (planId: PlanId) => void;
}

export function PricingView({ onBack, onChoose }: Props) {
  const { isPremium, current } = useSubscription();
  const activeId = current?.planId ?? 'free';

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[55] bg-white max-w-2xl mx-auto overflow-y-auto"
    >
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-[#F0F0F0] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 bg-[#FAFAFA] flex items-center justify-center" aria-label="Retour">
          <ChevronLeft size={20} className="text-[#1a1a1a]" />
        </button>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
          Premium
        </h1>
      </div>

      <section className="px-5 pt-6 pb-3">
        <div className="p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2a1648 60%, #FF3FA4 100%)', borderRadius: 'var(--r-xl)' }}>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>
              <Crown size={18} className="fill-white" />
            </div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
              IPPOO Premium
            </div>
          </div>
          <div className="text-white/85" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', lineHeight: 1.5 }}>
            Soutenez le journalisme indépendant béninois et profitez d'une expérience sans publicité, avec tous nos contenus exclusifs.
          </div>
          {isPremium && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[#00C853] text-white" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700 }}>
              <Check size={13} strokeWidth={3} /> Abonnement actif
            </div>
          )}
        </div>
      </section>

      <section className="px-5 pt-2 pb-3 space-y-3">
        {PLANS.map((plan) => {
          const isActive = activeId === plan.id;
          const isFeatured = plan.id === 'yearly';
          return (
            <div
              key={plan.id}
              className="relative p-4 bg-white border"
              style={{
                borderColor: isFeatured ? '#FF3FA4' : '#F0F0F0',
                borderRadius: 'var(--r-lg)',
                boxShadow: isFeatured ? '0 14px 32px -18px rgba(255,63,164,0.4)' : 'none',
              }}
            >
              {plan.tag && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-[#FF3FA4] text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', borderRadius: 999 }}>
                  {plan.tag}
                </span>
              )}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
                      {plan.label}
                    </div>
                    {isActive && plan.id !== 'free' && (
                      <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#00A04A]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, borderRadius: 999 }}>
                        Actif
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
                      {plan.priceXOF === 0 ? 'Gratuit' : formatXOF(plan.priceXOF)}
                    </span>
                    {plan.priceXOF > 0 && (
                      <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>
                {plan.id !== 'free' && (
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: '#FFF1F8', borderRadius: 999 }}>
                    {isFeatured ? <Sparkles size={17} className="text-[#FF3FA4]" /> : <Crown size={17} className="text-[#FF3FA4]" />}
                  </div>
                )}
              </div>
              <ul className="space-y-1.5 mb-4">
                {plan.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', color: '#1a1a1a' }}>
                    <Check size={14} className="text-[#00C853] mt-0.5 flex-shrink-0" strokeWidth={3} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <button
                disabled={isActive || plan.id === 'free'}
                onClick={() => onChoose(plan.id)}
                className="w-full py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isActive ? '#F4F4F6' : isFeatured ? '#FF3FA4' : '#0066FF',
                  color: isActive ? '#717182' : 'white',
                  borderRadius: 'var(--r-pill)',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {plan.id === 'free' ? 'Plan actuel' : isActive ? 'Plan en cours' : `Choisir ${plan.label}`}
              </button>
            </div>
          );
        })}
      </section>

      <section className="px-5 pt-2 pb-8">
        <div className="p-3.5 bg-[#FAFAFA] flex items-start gap-2.5" style={{ borderRadius: 'var(--r-lg)' }}>
          <Shield size={16} className="text-[#0066FF] mt-0.5 flex-shrink-0" />
          <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', lineHeight: 1.5 }}>
            Paiement sécurisé via <span className="text-[#1a1a1a]" style={{ fontWeight: 700 }}>Orange Money, MTN MoMo, Moov Money et Wave</span>. Sans engagement, résiliable à tout moment depuis votre profil.
          </div>
        </div>
        {current && (
          <div className="text-center mt-3 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
            {current.planId === 'free'
              ? 'Vous utilisez actuellement le plan gratuit.'
              : `Plan ${planById(current.planId).label}, expire le ${new Date(current.expiresAt).toLocaleDateString('fr-FR')}`}
          </div>
        )}

        <div className="mt-5">
          <div className="text-center mb-2.5 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em' }}>
            MÉTHODES DE PAIEMENT ACCEPTÉES
          </div>
          <div className="flex items-center justify-center flex-wrap gap-2">
            {OPERATORS.map((o) => (
              <div key={o.id} className="w-14 h-9 bg-white border border-[#F0F0F0] flex items-center justify-center overflow-hidden" style={{ borderRadius: 6 }} title={o.label}>
                <img src={o.logo} alt={o.label} className="w-full h-full object-contain" />
              </div>
            ))}
            <div className="w-14 h-9 bg-white border border-[#F0F0F0] flex items-center justify-center overflow-hidden" style={{ borderRadius: 6 }} title="Visa">
              <img src={CARD_LOGOS.visa} alt="Visa" className="w-full h-full object-contain" />
            </div>
            <div className="w-14 h-9 bg-white border border-[#F0F0F0] flex items-center justify-center overflow-hidden" style={{ borderRadius: 6 }} title="Mastercard">
              <img src={CARD_LOGOS.mastercard} alt="Mastercard" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
