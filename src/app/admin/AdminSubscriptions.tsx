import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Check, X, Clock, RefreshCw, Download, Crown, Trash2, TrendingUp, Users, AlertCircle, Plus } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OPERATORS, PLANS, planById, formatXOF, type Transaction, type Subscription, type PlanId, type Operator } from '../lib/subscription';
import { useAdminToast, ConfirmDialog } from './AdminToast';

const KEY = 'ippoo:subscription';
const EVT = 'storage:ippoo:subscription';

interface State {
  current: Subscription | null;
  transactions: Transaction[];
}

function loadState(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { current: null, transactions: [] };
  } catch { return { current: null, transactions: [] }; }
}

function writeState(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {}
}

function genRef(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `IPP-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-MAN`;
}

function addPeriod(planId: PlanId, from: Date): Date {
  const d = new Date(from);
  if (planId === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (planId === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d;
}

export function AdminSubscriptions() {
  const [state, setState] = useState<State>(() => loadState());
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'pending' | 'cancelled'>('all');
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantPlan, setGrantPlan] = useState<PlanId>('monthly');
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const { show } = useAdminToast();

  useEffect(() => {
    const refresh = () => setState(loadState());
    window.addEventListener(EVT, refresh);
    const cross = (e: StorageEvent) => { if (e.key === KEY) refresh(); };
    window.addEventListener('storage', cross);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener('storage', cross);
    };
  }, []);

  const stats = useMemo(() => {
    const success = state.transactions.filter((t) => t.status === 'success');
    const totalRevenue = success.reduce((s, t) => s + t.amountXOF, 0);
    const successCount = success.length;
    const failedCount = state.transactions.filter((t) => t.status === 'failed').length;
    const pendingCount = state.transactions.filter((t) => t.status === 'pending').length;
    const successRate = state.transactions.length > 0 ? (successCount / state.transactions.length) * 100 : 0;
    const avgTicket = successCount > 0 ? totalRevenue / successCount : 0;

    const byPlan: Record<PlanId, number> = { free: 0, monthly: 0, yearly: 0 };
    const revenueByPlan: Record<PlanId, number> = { free: 0, monthly: 0, yearly: 0 };
    success.forEach((t) => { byPlan[t.planId]++; revenueByPlan[t.planId] += t.amountXOF; });

    const byOp: Record<Operator, { count: number; revenue: number }> = {
      orange: { count: 0, revenue: 0 }, mtn: { count: 0, revenue: 0 },
      moov:   { count: 0, revenue: 0 }, wave: { count: 0, revenue: 0 },
    };
    success.forEach((t) => { byOp[t.operator].count++; byOp[t.operator].revenue += t.amountXOF; });

    const monthlyMRR = revenueByPlan.monthly + Math.round(revenueByPlan.yearly / 12);

    return { totalRevenue, successCount, failedCount, pendingCount, successRate, avgTicket, byPlan, revenueByPlan, byOp, monthlyMRR };
  }, [state.transactions]);

  const txs = state.transactions.filter((t) => filter === 'all' || t.status === filter);
  const activeSub = state.current && state.current.planId !== 'free' && Date.parse(state.current.expiresAt) > Date.now();

  const grantPremium = () => {
    const startedAt = new Date();
    const expiresAt = addPeriod(grantPlan, startedAt);
    const plan = planById(grantPlan);
    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      planId: grantPlan, amountXOF: 0, operator: 'orange', phone: 'MANUEL',
      status: 'success',
      createdAt: startedAt.toISOString(), reference: genRef(),
    };
    const next: State = {
      current: {
        planId: grantPlan, startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString(),
        autoRenew: false, lastTxId: tx.id,
      },
      transactions: [tx, ...state.transactions].slice(0, 200),
    };
    writeState(next); setState(next);
    setGrantOpen(false);
    show(`${plan.label} octroyé manuellement`, 'success');
  };

  const revokeSub = () => {
    const next: State = { ...state, current: null };
    writeState(next); setState(next);
    setConfirmRevoke(false);
    show('Abonnement révoqué', 'info');
  };

  const refundTx = (txId: string) => {
    const next: State = {
      ...state,
      transactions: state.transactions.map((t) => t.id === txId ? { ...t, status: 'cancelled' as const } : t),
    };
    writeState(next); setState(next);
    show('Transaction marquée comme remboursée', 'info');
  };

  const resetAll = () => {
    writeState({ current: null, transactions: [] });
    setState({ current: null, transactions: [] });
    setConfirmReset(false);
    show('Données d\'abonnement réinitialisées', 'info');
  };

  const exportCSV = () => {
    const header = ['Référence', 'Date', 'Plan', 'Montant FCFA', 'Opérateur', 'Téléphone', 'Statut'].join(';');
    const rows = state.transactions.map((t) => [
      t.reference,
      new Date(t.createdAt).toLocaleString('fr-FR'),
      planById(t.planId).label,
      String(t.amountXOF),
      OPERATORS.find((o) => o.id === t.operator)?.label ?? t.operator,
      t.phone,
      t.status,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ippoo-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    show('Export CSV téléchargé', 'success');
  };

  return (
    <div>
      <PageHeader
        title="Abonnements & paiements"
        subtitle="Suivi des transactions Mobile Money, MRR et gestion manuelle des accès Premium"
        actions={
          <>
            <button onClick={() => setGrantOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0066FF] text-white" style={{ borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>
              <Plus size={14} /> Octroyer Premium
            </button>
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#EAEAEE]" style={{ borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>
              <Download size={14} /> Export CSV
            </button>
          </>
        }
      />

      <div className="px-6 pt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={CreditCard} label="Revenus totaux" value={formatXOF(stats.totalRevenue)} hint={`${stats.successCount} paiement(s)`} color="#0066FF" />
        <Stat icon={TrendingUp} label="MRR estimé" value={formatXOF(stats.monthlyMRR)} hint="Revenus récurrents/mois" color="#00A04A" />
        <Stat icon={Users} label="Panier moyen" value={formatXOF(Math.round(stats.avgTicket))} hint={`Taux succès ${stats.successRate.toFixed(0)}%`} color="#FF3FA4" />
        <Stat icon={AlertCircle} label="Échecs" value={String(stats.failedCount)} hint={`${stats.pendingCount} en cours`} color="#D32F2F" />
      </div>

      <div className="px-6 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white p-4 border border-[#EAEAEE]" style={{ borderRadius: 12 }}>
          <div className="mb-3" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#717182', letterSpacing: '0.1em' }}>RÉPARTITION PAR PLAN</div>
          <div className="space-y-2.5">
            {(['monthly', 'yearly'] as PlanId[]).map((id) => {
              const p = planById(id);
              const count = stats.byPlan[id];
              const rev = stats.revenueByPlan[id];
              const max = Math.max(stats.byPlan.monthly, stats.byPlan.yearly, 1);
              const pct = (count / max) * 100;
              return (
                <div key={id}>
                  <div className="flex items-center justify-between mb-1" style={{ fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 600 }}>{p.label}</span>
                    <span className="text-[#717182]">{count} · {formatXOF(rev)}</span>
                  </div>
                  <div className="h-2 bg-[#F4F4F6]" style={{ borderRadius: 999 }}>
                    <div className="h-full" style={{ width: `${pct}%`, background: id === 'monthly' ? '#0066FF' : '#FF3FA4', borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-4 border border-[#EAEAEE]" style={{ borderRadius: 12 }}>
          <div className="mb-3" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#717182', letterSpacing: '0.1em' }}>RÉPARTITION PAR OPÉRATEUR</div>
          <div className="grid grid-cols-2 gap-2">
            {OPERATORS.map((o) => {
              const d = stats.byOp[o.id];
              return (
                <div key={o.id} className="flex items-center gap-2.5 p-2.5 bg-[#FAFAFA]" style={{ borderRadius: 8 }}>
                  <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: o.bg, color: o.color, borderRadius: 999, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.7rem' }}>
                    {o.short}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{o.label}</div>
                    <div className="text-[#717182]" style={{ fontSize: '0.7rem' }}>{d.count} · {formatXOF(d.revenue)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 pt-4">
        <div className="bg-white p-4 border border-[#EAEAEE] flex items-start gap-3" style={{ borderRadius: 12 }}>
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: activeSub ? '#E8F5E9' : '#F4F4F6', color: activeSub ? '#00A04A' : '#717182', borderRadius: 999 }}>
            <Crown size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontWeight: 700, color: '#1a1a1a' }}>
              {state.current ? planById(state.current.planId).label : 'Aucun abonnement actif'}
            </div>
            <div className="text-[#717182]" style={{ fontSize: '0.78rem' }}>
              {activeSub
                ? `Démarré le ${new Date(state.current!.startedAt).toLocaleDateString('fr-FR')} · expire le ${new Date(state.current!.expiresAt).toLocaleDateString('fr-FR')} · ${state.current!.autoRenew ? 'renouvellement auto' : 'renouvellement désactivé'}`
                : 'L\'utilisateur est actuellement sur le plan gratuit'}
            </div>
          </div>
          {activeSub && (
            <button onClick={() => setConfirmRevoke(true)} className="px-3 py-2 bg-[#FEEAEA] text-[#D32F2F] inline-flex items-center gap-1.5" style={{ borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>
              <X size={14} /> Révoquer
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white border border-[#EAEAEE]" style={{ borderRadius: 12 }}>
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EAEAEE]">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'success', 'pending', 'failed', 'cancelled'] as const).map((f) => {
                const counts = { all: state.transactions.length, success: stats.successCount, pending: stats.pendingCount, failed: stats.failedCount, cancelled: state.transactions.filter((t) => t.status === 'cancelled').length };
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 transition-colors ${filter === f ? 'bg-[#0066FF] text-white' : 'bg-[#F4F4F6] text-[#1a1a1a]'}`}
                    style={{ borderRadius: 999, fontSize: '0.78rem', fontWeight: 600 }}
                  >
                    {f === 'all' ? 'Tous' : f === 'success' ? 'Réussis' : f === 'pending' ? 'En cours' : f === 'failed' ? 'Échoués' : 'Annulés'}
                    <span className="ml-1.5 opacity-70">{counts[f]}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setState(loadState())} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F4F6]" style={{ borderRadius: 999, fontSize: '0.78rem', fontWeight: 600 }}>
                <RefreshCw size={13} /> Rafraîchir
              </button>
              <button onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEEAEA] text-[#D32F2F]" style={{ borderRadius: 999, fontSize: '0.78rem', fontWeight: 600 }}>
                <Trash2 size={13} /> Vider
              </button>
            </div>
          </div>

          {txs.length === 0 ? (
            <div className="px-4 py-12 text-center text-[#717182]" style={{ fontSize: '0.85rem' }}>
              Aucune transaction.
            </div>
          ) : (
            <div className="divide-y divide-[#F5F5F5]">
              {txs.map((tx) => {
                const op = OPERATORS.find((o) => o.id === tx.operator);
                const p = planById(tx.planId);
                const statusColor = tx.status === 'success' ? '#00A04A' : tx.status === 'failed' ? '#D32F2F' : tx.status === 'cancelled' ? '#717182' : '#FF6600';
                const statusBg = tx.status === 'success' ? '#E8F5E9' : tx.status === 'failed' ? '#FEEAEA' : tx.status === 'cancelled' ? '#F4F4F6' : '#FFF1E5';
                const StatusIcon = tx.status === 'success' ? Check : tx.status === 'pending' ? Clock : X;
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: op?.bg, color: op?.color, borderRadius: 999, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.7rem' }}>
                      {op?.short}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{p.label}</span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5" style={{ background: statusBg, color: statusColor, borderRadius: 999, fontSize: '0.62rem', fontWeight: 700 }}>
                          <StatusIcon size={9} strokeWidth={3} />
                          {tx.status === 'success' ? 'Réussi' : tx.status === 'failed' ? 'Échoué' : tx.status === 'cancelled' ? 'Annulé' : 'En cours'}
                        </span>
                      </div>
                      <div className="text-[#717182] truncate" style={{ fontSize: '0.72rem' }}>
                        {new Date(tx.createdAt).toLocaleString('fr-FR')} · {tx.reference} · {op?.label} · {tx.phone}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0" style={{ fontWeight: 700, color: '#1a1a1a' }}>
                      {formatXOF(tx.amountXOF)}
                    </div>
                    {tx.status === 'success' && tx.amountXOF > 0 && (
                      <button onClick={() => refundTx(tx.id)} className="ml-2 px-2.5 py-1.5 bg-[#FFF1E5] text-[#FF6600] inline-flex items-center gap-1" style={{ borderRadius: 6, fontSize: '0.72rem', fontWeight: 600 }}>
                        Rembourser
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 p-3.5 bg-[#FFF8E1] flex items-start gap-2.5" style={{ borderRadius: 12, fontSize: '0.78rem', color: '#7C5400', lineHeight: 1.5 }}>
          <strong>Note de production :</strong> les données sont stockées localement (localStorage) à des fins de démonstration. Pour la prod, brancher un backend (CinetPay + webhook serveur signé) afin de valider les paiements de façon fiable et synchroniser les abonnements entre appareils.
        </div>
      </div>

      {grantOpen && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center" onClick={() => setGrantOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white" style={{ borderRadius: 12 }}>
            <div className="px-5 pt-5 pb-3 border-b border-[#EAEAEE]">
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>Octroyer Premium manuellement</div>
              <div className="text-[#717182] mt-1" style={{ fontSize: '0.85rem' }}>Crée une transaction à 0 FCFA et active l'abonnement immédiatement.</div>
            </div>
            <div className="p-5 space-y-2.5">
              {(['monthly', 'yearly'] as PlanId[]).map((id) => {
                const p = planById(id);
                return (
                  <button
                    key={id}
                    onClick={() => setGrantPlan(id)}
                    className="w-full flex items-center justify-between p-3 border transition-colors text-left"
                    style={{ borderColor: grantPlan === id ? '#0066FF' : '#EAEAEE', background: grantPlan === id ? '#F0F6FF' : 'white', borderRadius: 8 }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#1a1a1a' }}>{p.label}</div>
                      <div className="text-[#717182]" style={{ fontSize: '0.78rem' }}>Durée : {id === 'monthly' ? '1 mois' : '1 an'}</div>
                    </div>
                    {grantPlan === id && <Check size={18} className="text-[#0066FF]" />}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 px-5 pb-5">
              <button onClick={() => setGrantOpen(false)} className="flex-1 py-2.5 bg-[#F4F4F6]" style={{ borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>Annuler</button>
              <button onClick={grantPremium} className="flex-1 py-2.5 bg-[#0066FF] text-white" style={{ borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>Octroyer</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmRevoke}
        title="Révoquer l'abonnement ?"
        message="L'utilisateur perdra immédiatement ses accès Premium."
        confirmLabel="Révoquer"
        onCancel={() => setConfirmRevoke(false)}
        onConfirm={revokeSub}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Vider toutes les données ?"
        message="Toutes les transactions et l'abonnement actif seront supprimés. Action irréversible."
        confirmLabel="Tout supprimer"
        onCancel={() => setConfirmReset(false)}
        onConfirm={resetAll}
      />
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint, color }: { icon: typeof CreditCard; label: string; value: string; hint: string; color: string }) {
  return (
    <div className="bg-white p-4 border border-[#EAEAEE]" style={{ borderRadius: 12 }}>
      <div className="flex items-center gap-1.5 text-[#717182]" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
        <Icon size={13} style={{ color }} /> {label}
      </div>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: '#1a1a1a', marginTop: 4, letterSpacing: '-0.01em' }}>
        {value}
      </div>
      <div className="text-[#717182] truncate" style={{ fontSize: '0.7rem' }}>{hint}</div>
    </div>
  );
}
