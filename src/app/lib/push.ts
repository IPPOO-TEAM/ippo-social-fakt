// Web Push subscription helpers. The Service Worker must be registered
// separately (see registerServiceWorker in pwa.ts) for these to work —
// PushManager lives on the SW registration.

import { api } from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushSupport = 'ready' | 'unsupported' | 'denied' | 'unregistered';

export async function pushSupport(): Promise<PushSupport> {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return 'unregistered';
  return 'ready';
}

export async function isSubscribed(): Promise<boolean> {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function subscribeToPush(): Promise<{ ok: boolean; reason?: string }> {
  if ((await pushSupport()) === 'unsupported') return { ok: false, reason: 'unsupported' };

  const perm = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, reason: 'permission_denied' };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();

  if (!sub) {
    let publicKey: string;
    try {
      const r = await api<{ publicKey: string }>('/notifications/vapid-key', { auth: false });
      publicKey = r.publicKey;
    } catch (e) {
      console.log(`VAPID key fetch failed: ${e}`);
      return { ok: false, reason: 'no_vapid_key' };
    }
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  try {
    await api('/notifications/subscribe', { method: 'POST', body: sub.toJSON() });
    return { ok: true };
  } catch (e) {
    console.log(`Push subscribe persist failed: ${e}`);
    return { ok: false, reason: 'server_error' };
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  try {
    await api('/notifications/unsubscribe', {
      method: 'POST', body: { endpoint: sub.endpoint },
    });
  } catch (e) {
    console.log(`Push unsubscribe server failed: ${e}`);
  }
  try { await sub.unsubscribe(); } catch { /* ignore */ }
}
