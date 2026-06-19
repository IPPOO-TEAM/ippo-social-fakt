import { motion } from 'motion/react';
import { ChevronLeft, Crown, Calendar, RefreshCw, Pause, Play, Receipt, Check, X, Clock } from 'lucide-react';
import { useState } from 'react';
import { useSubscription, planById, formatXOF, OPERATORS } from '../../lib/subscription';
import { useToast } from '../Toast';

interface Props {
  onBack: () => void;
  onUpgrade: () => void;
}

export function SubscriptionView({ onBack, onUpgrade }: Props) {
  const { current, transactions, cancelAutoRenew, reactivateAutoRenew, isPremium } = useSubscription();
  const { show } = useToast();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const plan = current ? planById(current.planId) : planById('free');
  const expiresAt = current ? new Date(current.expiresAt) : null;
  const startedAt = current ? new Date(current.startedAt) : null;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)) : 0;

  const doCancel = () => {
    cancelAutoRenew();
    setConfirmCancel(false);
    show('Renouvellement automatique désactivé', 'info');
  };

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
          Mon abonnement
        </h1>
      </div>

      <section className="px-5 pt-5">
        <div className="p-5 text-white relative overflow-hidden" style={{ background: isPremium ? 'linear-gradient(135deg, #1a1a1a 0%, #2a1648 60%, #FF3FA4 100%)' : '#F4F4F6', borderRadius: 'var(--r-xl)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 flex items-center justify-center" style={{ background: isPremium ? 'rgba(255,255,255,0.2)' : 'white', borderRadius: 999 }}>
                <Crown size={18} className={isPremium ? 'fill-white' : 'text-[#717182]'} />
              </div>
              <div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em', color: isPremium ? 'white' : '#1a1a1a' }}>
                  {plan.label}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: isPremium ? 'rgba(255,255,255,0.85)' : '#717182' }}>
                  {isPremium ? `${formatXOF(plan.priceXOF)} ${plan.period}` : 'Vous utilisez le plan gratuit'}
                </div>
              </div>
            </div>
            {isPremium && current && (
              <span className="px-2.5 py-0.5" style={{ background: current.autoRenew ? '#00C853' : 'rgba(255,255,255,0.2)', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', borderRadius: 999 }}>
                {current.autoRenew ? 'AUTO' : 'EN PAUSE'}
              </span>
            )}
          </div>

          {isPremium && expiresAt && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
              <div>
                <div className="flex items-center gap-1 text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                  <Calendar size={11} /> Prochain paiement
                </div>
                <div className="mt-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', fontWeight: 700 }}>
                  {expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                  <Clock size={11} /> Restant
                </div>
                <div className="mt-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', fontWeight: 700 }}>
                  {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {!isPremium && (
        <section className="px-5 mt-5">
          <button
            onClick={onUpgrade}
            className="w-full py-3.5 bg-[#FF3FA4] text-white flex items-center justify-center gap-2"
            style={{ borderRadius: 'var(--r-pill)', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.92rem' }}
          >
            <Crown size={16} /> Passer Premium
          </button>
        </section>
      )}

      {isPremium && current && (
        <section className="px-5 mt-5">
          <div className="bg-white border border-[#F0F0F0] divide-y divide-[#F5F5F5]">
            <button onClick={onUpgrade} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#FAFAFA] transition-colors">
              <div className="w-9 h-9 bg-[#FAFAFA] flex items-center justify-center flex-shrink-0">
                <RefreshCw size={16} className="text-[#1a1a1a]" />
              </div>
              <div className="flex-1">
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: '#1a1a1a' }}>Changer de plan</div>
                <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>Mensuel ou annuel</div>
              </div>
            </button>

            {current.autoRenew ? (
              <button onClick={() => setConfirmCancel(true)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#FAFAFA] transition-colors">
                <div className="w-9 h-9 bg-[#FFF1E5] flex items-center justify-center flex-shrink-0">
                  <Pause size={16} className="text-[#FF6600]" />
                </div>
                <div className="flex-1">
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: '#1a1a1a' }}>Désactiver le renouvellement</div>
                  <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>L'abonnement reste actif jusqu'au {expiresAt?.toLocaleDateString('fr-FR')}</div>
                </div>
              </button>
            ) : (
              <button onClick={() => { reactivateAutoRenew(); show('Renouvellement automatique réactivé', 'success'); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#FAFAFA] transition-colors">
                <div className="w-9 h-9 bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                  <Play size={16} className="text-[#00A04A]" />
                </div>
                <div className="flex-1">
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: '#1a1a1a' }}>Réactiver le renouvellement</div>
                  <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>Reprise automatique au prochain cycle</div>
                </div>
              </button>
            )}
          </div>
        </section>
      )}

      <section className="px-5 mt-6">
        <h3 className="mb-2.5 px-1 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#717182', letterSpacing: '0.15em' }}>
          <Receipt size={12} /> HISTORIQUE DES PAIEMENTS
        </h3>
        {transactions.length === 0 ? (
          <div className="p-5 bg-[#FAFAFA] text-center text-[#717182]" style={{ borderRadius: 'var(--r-lg)', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
            Aucune transaction pour le moment.
          </div>
        ) : (
          <div className="bg-white border border-[#F0F0F0] divide-y divide-[#F5F5F5]">
            {transactions.map((tx) => {
              const op = OPERATORS.find((o) => o.id === tx.operator);
              const p = planById(tx.planId);
              const statusColor = tx.status === 'success' ? '#00A04A' : tx.status === 'failed' ? '#D32F2F' : tx.status === 'cancelled' ? '#717182' : '#FF6600';
              const statusBg = tx.status === 'success' ? '#E8F5E9' : tx.status === 'failed' ? '#FEEAEA' : tx.status === 'cancelled' ? '#F4F4F6' : '#FFF1E5';
              const StatusIcon = tx.status === 'success' ? Check : tx.status === 'pending' ? Clock : X;
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: op?.bg, color: op?.color, borderRadius: 999, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.7rem' }}>
                    {op?.short}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a' }}>{p.label}</span>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5" style={{ background: statusBg, color: statusColor, borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 700 }}>
                        <StatusIcon size={9} strokeWidth={3} />
                        {tx.status === 'success' ? 'Réussi' : tx.status === 'failed' ? 'Échoué' : tx.status === 'cancelled' ? 'Annulé' : 'En cours'}
                      </span>
                    </div>
                    <div className="text-[#717182] truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                      {new Date(tx.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {tx.reference}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: '#1a1a1a' }}>
                    {formatXOF(tx.amountXOF)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="h-8" />

      {confirmCancel && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setConfirmCancel(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white" style={{ borderRadius: '14px 14px 0 0' }}>
            <div className="px-5 pt-5 pb-3">
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
                Désactiver le renouvellement ?
              </div>
              <div className="text-[#717182] mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Votre abonnement Premium reste actif jusqu'au <strong>{expiresAt?.toLocaleDateString('fr-FR')}</strong>, puis vous repasserez au plan gratuit.
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 pb-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
              <button onClick={() => setConfirmCancel(false)} className="flex-1 py-3 bg-[#F4F4F6] text-[#1a1a1a]" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem' }}>Garder</button>
              <button onClick={doCancel} className="flex-1 py-3 bg-[#FF6600] text-white" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem' }}>Désactiver</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
