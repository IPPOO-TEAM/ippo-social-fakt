import { useEffect, useState, useCallback } from 'react';
import { safeStorage, STORAGE_KEYS } from './storage-safe';

export type PlanId = 'free' | 'monthly' | 'yearly';
export type Operator = 'orange' | 'mtn' | 'moov' | 'wave';
export type TxStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export interface Plan {
  id: PlanId;
  label: string;
  priceXOF: number;
  period: string;
  tag?: string;
  perks: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    label: 'Gratuit',
    priceXOF: 0,
    period: 'pour toujours',
    perks: ['Lecture des articles', 'Radio en direct', 'Bien-Être de base', 'Avec publicités'],
  },
  {
    id: 'monthly',
    label: 'Premium mensuel',
    priceXOF: 1000,
    period: '/mois',
    perks: ['Sans publicité', 'Podcasts & replays illimités', 'Dossiers d\'enquête en intégralité', 'Téléchargement hors-ligne', 'Support prioritaire'],
  },
  {
    id: 'yearly',
    label: 'Premium annuel',
    priceXOF: 10000,
    period: '/an',
    tag: '2 mois offerts',
    perks: ['Tous les avantages du mensuel', 'Économisez 2 000 FCFA', 'Badge supporter dans la communauté', 'Accès anticipé aux nouveautés'],
  },
];

import orangeLogo from '../../imports/Orange-Money-logo.jpg';
import mtnLogo from '../../imports/FiRK9VOXwBEtkoy.jpg';
import moovLogo from '../../imports/promotion-1-1-350x250__1_.png';
import waveLogo from '../../imports/wave_logo_670.jpg';
import visaLogo from '../../imports/images__19_.png';
import mcLogo from '../../imports/MasterCard-Logo.svg.png';

export const OPERATORS: { id: Operator; label: string; short: string; color: string; bg: string; logo: string }[] = [
  { id: 'orange', label: 'Orange Money', short: 'OM',  color: '#FF6600', bg: '#FFF1E5', logo: orangeLogo },
  { id: 'mtn',    label: 'MTN MoMo',     short: 'MTN', color: '#FFCC00', bg: '#FFF9D9', logo: mtnLogo },
  { id: 'moov',   label: 'Moov Money',   short: 'MV',  color: '#003DA5', bg: '#E5EDFA', logo: moovLogo },
  { id: 'wave',   label: 'Wave',         short: 'W',   color: '#00C2FF', bg: '#E0F7FF', logo: waveLogo },
];

export const CARD_LOGOS = { visa: visaLogo, mastercard: mcLogo };

export interface Transaction {
  id: string;
  planId: PlanId;
  amountXOF: number;
  operator: Operator;
  phone: string;
  status: TxStatus;
  createdAt: string;
  reference: string;
}

export interface Subscription {
  planId: PlanId;
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  lastTxId: string;
}

interface SubState {
  current: Subscription | null;
  transactions: Transaction[];
}

const KEY = STORAGE_KEYS.subscription;
const EVT = `storage:${KEY}`;
const DEFAULT: SubState = { current: null, transactions: [] };

function read(): SubState {
  return { ...DEFAULT, ...safeStorage.get<Partial<SubState>>(KEY, {}) };
}

function write(v: SubState) {
  safeStorage.set(KEY, v);
}

function genRef(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `IPP-${stamp}-${rnd}`;
}

export function planById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function isExpired(sub: Subscription | null): boolean {
  if (!sub) return true;
  return Date.parse(sub.expiresAt) < Date.now();
}

export function isPremiumActive(state: SubState): boolean {
  const s = state.current;
  if (!s || s.planId === 'free') return false;
  return !isExpired(s);
}

function addPeriod(planId: PlanId, from: Date): Date {
  const d = new Date(from);
  if (planId === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (planId === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d;
}

export function useSubscription() {
  const [state, setState] = useState<SubState>(() => read());

  useEffect(() => {
    const h = () => setState(read());
    window.addEventListener(EVT, h);
    const cross = (e: StorageEvent) => { if (e.key === KEY) h(); };
    window.addEventListener('storage', cross);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener('storage', cross);
    };
  }, []);

  // Real payment flow. Calls the backend which delegates to CinetPay and
  // returns a paymentUrl the UI should open. Activation lands via the
  // CinetPay webhook + pollTransactionStatus, never via a local timer.
  const startTransaction = useCallback(async (planId: PlanId, operator: Operator, phone: string): Promise<Transaction> => {
    if (planId === 'free') throw new Error('Plan gratuit: aucun paiement nécessaire.');
    const { transaction, paymentUrl } = await initRealPayment(planId as 'monthly' | 'yearly', operator, phone);
    if (paymentUrl && typeof window !== 'undefined') {
      try { window.open(paymentUrl, '_blank', 'noopener,noreferrer'); } catch { /* ignore */ }
    }
    void pollTransactionStatus(transaction.id).then(() => syncSubscriptionFromServer());
    return transaction;
  }, []);

  // Manual finalize is a no-op against the server (status is authoritative
  // there). Kept for legacy callers; it only re-syncs from the server.
  const finalizeTransaction = useCallback(async (_txId: string, _status: 'success' | 'failed' | 'cancelled') => {
    await syncSubscriptionFromServer();
  }, []);

  const cancelAutoRenew = useCallback(async () => {
    await cancelSubscriptionOnServer();
    setState(read());
  }, []);

  const reactivateAutoRenew = useCallback(async () => {
    // Re-enabling auto-renew is only meaningful at next payment.
    // Direct the user back to the checkout flow.
    await syncSubscriptionFromServer();
    setState(read());
  }, []);

  // Keep local cache in sync with the server whenever the hook mounts and on
  // tab focus, so the UI never drifts from the authoritative subscription state.
  useEffect(() => {
    void syncSubscriptionFromServer();
    const onFocus = () => { void syncSubscriptionFromServer(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return {
    current: state.current,
    transactions: state.transactions,
    isPremium: isPremiumActive(state),
    startTransaction,
    finalizeTransaction,
    cancelAutoRenew,
    reactivateAutoRenew,
  };
}

export function formatXOF(n: number): string {
  return `${n.toLocaleString('fr-FR')} FCFA`;
}

// ============== SERVER-BACKED FLOWS ==============
import { initPayment, checkPayment, fetchMySubscription, cancelMySubscription } from './api';
import { emitToast } from '../components/Toast';

export async function initRealPayment(planId: 'monthly' | 'yearly', operator: Operator, phone: string, returnUrl?: string) {
  const plan = planById(planId);
  const tx: Transaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    planId, amountXOF: plan.priceXOF, operator, phone,
    status: 'pending',
    createdAt: new Date().toISOString(),
    reference: genRef(),
  };
  const cur = read();
  write({ ...cur, transactions: [tx, ...cur.transactions].slice(0, 50) });
  try {
    const res = await initPayment(planId, operator, phone, returnUrl);
    const cur2 = read();
    const mapped: Transaction = { ...tx, id: res.transactionId, reference: res.transactionId };
    write({ ...cur2, transactions: cur2.transactions.map((t) => t.id === tx.id ? mapped : t) });
    window.dispatchEvent(new Event(EVT));
    return { transaction: mapped, paymentUrl: res.paymentUrl };
  } catch (err) {
    const cur2 = read();
    write({ ...cur2, transactions: cur2.transactions.map((t) => t.id === tx.id ? { ...t, status: 'failed' } : t) });
    window.dispatchEvent(new Event(EVT));
    throw err;
  }
}

export async function pollTransactionStatus(transactionId: string, opts: { intervalMs?: number; timeoutMs?: number } = {}) {
  const interval = opts.intervalMs ?? 4000;
  const timeout = opts.timeoutMs ?? 5 * 60 * 1000;
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const { transaction } = await checkPayment(transactionId);
      if (transaction.status !== 'pending') {
        await syncSubscriptionFromServer();
        return transaction;
      }
    } catch (err) {
      console.log('pollTransactionStatus error:', err);
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return null;
}

export async function syncSubscriptionFromServer() {
  try {
    const { subscription, transactions } = await fetchMySubscription();
    const cur = read();
    const next: SubState = {
      current: subscription
        ? {
            planId: subscription.planId,
            startedAt: subscription.startedAt,
            expiresAt: subscription.expiresAt,
            autoRenew: subscription.autoRenew,
            lastTxId: subscription.lastTxId,
          }
        : cur.current,
      transactions: (transactions ?? []).map((t) => ({
        id: t.id,
        planId: t.planId,
        amountXOF: t.amountXOF,
        operator: t.operator as Operator,
        phone: t.phone,
        status: t.status,
        createdAt: t.createdAt,
        reference: t.id,
      })),
    };
    write(next);
    window.dispatchEvent(new Event(EVT));
    return next;
  } catch (err) {
    console.log('syncSubscriptionFromServer error:', err);
    return null;
  }
}

export async function cancelSubscriptionOnServer() {
  try {
    await cancelMySubscription();
  } catch (err) {
    console.log('cancelSubscriptionOnServer error:', err);
    emitToast('Annulation enregistrée localement — serveur injoignable.', 'error');
  }
  const cur = read();
  if (cur.current) {
    write({ ...cur, current: { ...cur.current, autoRenew: false } });
    window.dispatchEvent(new Event(EVT));
  }
}
