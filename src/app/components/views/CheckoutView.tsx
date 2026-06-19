import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Check, Loader2, Phone, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { OPERATORS, planById, useSubscription, formatXOF, type Operator, type PlanId } from '../../lib/subscription';
import { useToast } from '../Toast';

type Step = 'select' | 'phone' | 'processing' | 'success' | 'failed';

interface Props {
  planId: PlanId;
  onBack: () => void;
  onDone: () => void;
}

function isValidIvorianPhone(p: string): boolean {
  const digits = p.replace(/\D/g, '');
  return digits.length === 10 && digits.startsWith('0');
}

export function CheckoutView({ planId, onBack, onDone }: Props) {
  const plan = planById(planId);
  const { startTransaction, finalizeTransaction } = useSubscription();
  const { show } = useToast();
  const [step, setStep] = useState<Step>('select');
  const [op, setOp] = useState<Operator | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [reference, setReference] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 'processing' || !txId) return;
    let elapsed = 0;
    const total = 4500;
    const tick = setInterval(() => {
      elapsed += 100;
      setProgress(Math.min(100, (elapsed / total) * 100));
      if (elapsed >= total) {
        clearInterval(tick);
        const success = Math.random() > 0.1;
        if (success) {
          finalizeTransaction(txId, 'success');
          setStep('success');
        } else {
          finalizeTransaction(txId, 'failed');
          setErrorMsg('Le paiement a été refusé par l\'opérateur. Vérifiez votre solde et réessayez.');
          setStep('failed');
        }
      }
    }, 100);
    return () => clearInterval(tick);
  }, [step, txId, finalizeTransaction]);

  const submitPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!op) return;
    if (!isValidIvorianPhone(phone)) {
      setPhoneError('Numéro invalide. Format attendu : 0X XX XX XX XX');
      return;
    }
    setPhoneError(null);
    const tx = startTransaction(planId, op, phone.replace(/\s/g, ''));
    setTxId(tx.id);
    setReference(tx.reference);
    setProgress(0);
    setStep('processing');
  };

  const cancelProcessing = () => {
    if (txId) finalizeTransaction(txId, 'cancelled');
    show('Paiement annulé', 'info');
    setStep('select');
  };

  const operator = OPERATORS.find((o) => o.id === op);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[60] bg-white max-w-2xl mx-auto overflow-y-auto"
    >
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-[#F0F0F0] px-4 py-3 flex items-center gap-3">
        <button onClick={step === 'processing' ? cancelProcessing : onBack} className="w-10 h-10 bg-[#FAFAFA] flex items-center justify-center" aria-label="Retour" disabled={step === 'success'}>
          <ChevronLeft size={20} className="text-[#1a1a1a]" />
        </button>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
          Paiement Mobile Money
        </h1>
      </div>

      <section className="px-5 pt-5">
        <div className="p-4 bg-[#FAFAFA] flex items-center justify-between" style={{ borderRadius: 'var(--r-lg)' }}>
          <div>
            <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em' }}>VOTRE COMMANDE</div>
            <div className="mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>
              {plan.label}
            </div>
            <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
              {plan.period}
            </div>
          </div>
          <div className="text-right">
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
              {formatXOF(plan.priceXOF)}
            </div>
          </div>
        </div>
      </section>

      {step === 'select' && (
        <section className="px-5 pt-5 pb-8">
          <div className="mb-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#717182', letterSpacing: '0.15em' }}>
            CHOISISSEZ VOTRE OPÉRATEUR
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {OPERATORS.map((o) => (
              <button
                key={o.id}
                onClick={() => { setOp(o.id); setStep('phone'); }}
                className="p-4 bg-white border border-[#F0F0F0] flex flex-col items-start gap-2 hover:border-[#0066FF] transition-colors text-left"
                style={{ borderRadius: 'var(--r-lg)' }}
              >
                <div className="w-12 h-12 overflow-hidden bg-white flex items-center justify-center" style={{ borderRadius: 10, border: `1px solid ${o.bg}` }}>
                  <img src={o.logo} alt={o.label} className="w-full h-full object-contain" />
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a' }}>
                  {o.label}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-5 p-3.5 bg-[#FFF8E1] flex items-start gap-2.5" style={{ borderRadius: 'var(--r-lg)' }}>
            <ShieldCheck size={16} className="text-[#7C5400] mt-0.5 flex-shrink-0" />
            <div className="text-[#7C5400]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.76rem', lineHeight: 1.5 }}>
              Vous recevrez une demande de validation USSD sur votre téléphone. IPPOO ne stocke jamais votre code secret.
            </div>
          </div>
        </section>
      )}

      {step === 'phone' && operator && (
        <form onSubmit={submitPhone} className="px-5 pt-5 pb-8">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="w-10 h-10 overflow-hidden bg-white flex items-center justify-center" style={{ borderRadius: 8, border: `1px solid ${operator.bg}` }}>
              <img src={operator.logo} alt={operator.label} className="w-full h-full object-contain" />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: '#1a1a1a' }}>
                {operator.label}
              </div>
              <button type="button" onClick={() => setStep('select')} className="text-[#0066FF]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 600 }}>
                Changer d'opérateur
              </button>
            </div>
          </div>

          <label className="block">
            <div className="mb-1.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#717182', letterSpacing: '0.1em' }}>
              NUMÉRO MOBILE MONEY
            </div>
            <div className="flex items-center gap-2 bg-[#FAFAFA] px-3 py-3" style={{ border: phoneError ? '1px solid #FF3B30' : '1px solid transparent' }}>
              <Phone size={16} className="text-[#717182]" />
              <span className="text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 600 }}>+229</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="07 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={14}
                autoFocus
                className="flex-1 bg-transparent outline-none"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem' }}
              />
            </div>
            {phoneError && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[#FF3B30]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.76rem' }}>
                <AlertCircle size={13} /> {phoneError}
              </div>
            )}
          </label>

          <button
            type="submit"
            className="mt-5 w-full py-3.5 bg-[#0066FF] text-white"
            style={{ borderRadius: 'var(--r-pill)', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.92rem' }}
          >
            Payer {formatXOF(plan.priceXOF)}
          </button>

          <div className="mt-3 text-center text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
            En continuant, vous acceptez nos conditions d'abonnement.
          </div>
        </form>
      )}

      {step === 'processing' && operator && (
        <section className="px-5 pt-8 pb-8 flex flex-col items-center text-center">
          <div className="relative w-24 h-24 mb-5 flex items-center justify-center" style={{ background: operator.bg, borderRadius: 999 }}>
            <Loader2 size={36} className="animate-spin" style={{ color: operator.color }} />
          </div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: '#1a1a1a' }}>
            En attente de validation
          </div>
          <div className="text-[#717182] mt-2 max-w-xs" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', lineHeight: 1.5 }}>
            Composez le code USSD reçu sur <span className="text-[#1a1a1a]" style={{ fontWeight: 700 }}>+229 {phone}</span> pour confirmer le paiement.
          </div>
          <div className="mt-6 w-full max-w-xs h-2 bg-[#F0F0F0] overflow-hidden" style={{ borderRadius: 999 }}>
            <div className="h-full transition-all" style={{ width: `${progress}%`, background: operator.color }} />
          </div>
          <div className="mt-3 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
            Réf. {reference}
          </div>
          <button
            onClick={cancelProcessing}
            className="mt-6 px-5 py-2.5 bg-[#FAFAFA] text-[#1a1a1a] inline-flex items-center gap-2"
            style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.85rem' }}
          >
            <X size={14} /> Annuler
          </button>
        </section>
      )}

      {step === 'success' && (
        <section className="px-5 pt-8 pb-8 flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-5 flex items-center justify-center bg-[#E8F5E9]" style={{ borderRadius: 999 }}>
            <Check size={42} className="text-[#00A04A]" strokeWidth={3} />
          </div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
            Paiement confirmé !
          </div>
          <div className="text-[#717182] mt-2 max-w-sm" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Bienvenue dans IPPOO Premium. Profitez d'une expérience sans publicité et de tous nos contenus exclusifs.
          </div>
          <div className="mt-5 px-4 py-3 bg-[#FAFAFA] w-full max-w-xs" style={{ borderRadius: 'var(--r-lg)' }}>
            <div className="flex justify-between" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
              <span className="text-[#717182]">Référence</span>
              <span className="text-[#1a1a1a]" style={{ fontWeight: 600 }}>{reference}</span>
            </div>
            <div className="flex justify-between mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
              <span className="text-[#717182]">Montant</span>
              <span className="text-[#1a1a1a]" style={{ fontWeight: 600 }}>{formatXOF(plan.priceXOF)}</span>
            </div>
          </div>
          <button
            onClick={onDone}
            className="mt-6 w-full max-w-xs py-3.5 bg-[#0066FF] text-white"
            style={{ borderRadius: 'var(--r-pill)', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.92rem' }}
          >
            Découvrir Premium
          </button>
        </section>
      )}

      {step === 'failed' && (
        <section className="px-5 pt-8 pb-8 flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-5 flex items-center justify-center bg-[#FEEAEA]" style={{ borderRadius: 999 }}>
            <X size={42} className="text-[#D32F2F]" strokeWidth={3} />
          </div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#1a1a1a' }}>
            Paiement échoué
          </div>
          <div className="text-[#717182] mt-2 max-w-sm" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', lineHeight: 1.5 }}>
            {errorMsg}
          </div>
          <div className="mt-5 flex gap-2 w-full max-w-xs">
            <button onClick={onBack} className="flex-1 py-3 bg-[#F4F4F6] text-[#1a1a1a]" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem' }}>
              Retour
            </button>
            <button onClick={() => { setStep('phone'); setErrorMsg(null); }} className="flex-1 py-3 bg-[#0066FF] text-white" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem' }}>
              Réessayer
            </button>
          </div>
        </section>
      )}
    </motion.div>
  );
}
