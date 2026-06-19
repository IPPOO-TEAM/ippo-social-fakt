import { useEffect, useMemo, useState } from 'react';
import { Send, Bell, Newspaper, Mic, Calendar, AlertTriangle, Sparkles } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { Field, Input, Textarea, Select, Btn } from './ui';
import { sections } from '../data/sections';
import type { Notif } from '../lib/notifications';
import { useAdminToast, ConfirmDialog } from './AdminToast';
import { sendPushNotification } from '../lib/api';

interface PushHistoryEntry {
  id: string;
  iconKey: Notif['iconKey'];
  title: string;
  body: string;
  audience: string;
  audienceLabel: string;
  sentAt: number;
  estimatedRecipients: number;
}

const KEY_HISTORY = 'ippoo:admin:push-history';
const KEY_NOTIFS = 'ippoo:notifications';

const ICON_OPTIONS: { value: Notif['iconKey']; label: string; color: string }[] = [
  { value: 'news', label: 'Article', color: '#0066FF' },
  { value: 'podcast', label: 'Podcast', color: '#FF3FA4' },
  { value: 'event', label: 'Événement', color: '#00C853' },
  { value: 'opportunity', label: 'Opportunité', color: '#9B51E0' },
  { value: 'alert', label: 'Alerte', color: '#E8B21A' },
];

const ICONS = {
  news: Newspaper, podcast: Mic, event: Calendar, opportunity: Sparkles, alert: AlertTriangle,
};

function loadHistory(): PushHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    return raw ? (JSON.parse(raw) as PushHistoryEntry[]) : [];
  } catch { return []; }
}

function getFollowerCount(audience: string): number {
  if (audience === 'all') return 12400;
  try {
    const raw = localStorage.getItem('ippoo:user');
    if (!raw) return 0;
    const user = JSON.parse(raw) as { followedSections?: string[] };
    return user.followedSections?.includes(audience) ? Math.floor(800 + Math.random() * 1200) : Math.floor(400 + Math.random() * 600);
  } catch { return 0; }
}

export function AdminPush() {
  const { show } = useAdminToast();
  const [history, setHistory] = useState<PushHistoryEntry[]>(() => loadHistory());
  const [iconKey, setIconKey] = useState<Notif['iconKey']>('news');
  const [audience, setAudience] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const [sendOpen, setSendOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY_HISTORY, JSON.stringify(history)); } catch { /* quota */ }
  }, [history]);

  const audienceOptions = useMemo(() => [
    { value: 'all', label: 'Tous les abonnés (12.4k)' },
    ...sections
      .filter((s) => !['home', 'search', 'profile'].includes(s.key))
      .map((s) => ({ value: s.key, label: s.label })),
  ], []);

  const audienceLabel = audienceOptions.find((o) => o.value === audience)?.label ?? audience;
  const estimated = useMemo(() => getFollowerCount(audience), [audience]);

  const validate = () => {
    const er: { title?: string; body?: string } = {};
    if (!title.trim()) er.title = 'Titre requis.';
    if (title.length > 80) er.title = 'Maximum 80 caractères.';
    if (!body.trim()) er.body = 'Corps requis.';
    if (body.length > 240) er.body = 'Maximum 240 caractères.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onConfirmSend = () => {
    if (!validate()) { show('Champs invalides.', 'error'); return; }
    setSendOpen(true);
  };

  const [sending, setSending] = useState(false);
  const send = async () => {
    if (sending) return;
    const meta = ICON_OPTIONS.find((i) => i.value === iconKey)!;
    setSending(true);
    let serverResult: { sent: number; failed: number; pruned: number } | null = null;
    try {
      const r = await sendPushNotification({ title, body, url: `/${audience === 'all' ? '' : audience}` });
      serverResult = { sent: r.sent, failed: r.failed, pruned: r.pruned };
    } catch (e) {
      console.log(`AdminPush send error: ${e}`);
      show(`Échec d'envoi : ${e instanceof Error ? e.message : String(e)}`, 'error');
      setSending(false);
      return;
    }

    const entry: PushHistoryEntry = {
      id: `push-${Date.now()}`,
      iconKey, title, body,
      audience, audienceLabel,
      sentAt: Date.now(),
      estimatedRecipients: serverResult.sent,
    };
    setHistory([entry, ...history]);

    // Mirror in the in-app notifications drawer so admins see immediate feedback.
    try {
      const raw = localStorage.getItem(KEY_NOTIFS);
      const current: Notif[] = raw ? JSON.parse(raw) : [];
      const notif: Notif = {
        id: entry.id, iconKey, color: meta.color,
        title: title, time: 'À l\'instant', read: false,
      };
      const next = [notif, ...current];
      localStorage.setItem(KEY_NOTIFS, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('storage:ippoo:notifications'));
    } catch { /* ignore */ }

    setTitle(''); setBody(''); setErrors({});
    setSendOpen(false);
    setSending(false);
    show(
      `Push envoyé · ${serverResult.sent} reçus · ${serverResult.failed} échecs${serverResult.pruned ? ` · ${serverResult.pruned} obsolètes purgés` : ''}`,
      'success',
    );
  };

  return (
    <>
      <PageHeader title="Notifications push" subtitle="Composer et envoyer un message aux abonnés d'une section" />
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-[#EAEAEE] p-6 space-y-4" style={{ borderRadius: 12 }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem' }}>Composer</h2>

          <Field label="Type">
            <div className="flex gap-1.5 flex-wrap">
              {ICON_OPTIONS.map((o) => {
                const I = ICONS[o.value];
                const on = iconKey === o.value;
                return (
                  <button key={o.value} type="button" onClick={() => setIconKey(o.value)} className="flex items-center gap-1.5 px-3 py-1.5" style={{
                    background: on ? o.color : `${o.color}1A`,
                    color: on ? 'white' : o.color,
                    borderRadius: 999, fontSize: '0.78rem', fontWeight: 700,
                  }}>
                    <I size={13} strokeWidth={2.4} /> {o.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Audience" hint={`~${estimated.toLocaleString('fr-FR')} destinataires estimés`}>
            <Select value={audience} onChange={setAudience} options={audienceOptions} />
          </Field>

          <Field label="Titre *" hint={errors.title ?? `${title.length} / 80`}>
            <Input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="ex. Nouveau dossier · Coopératives de Abomey" style={{ borderColor: errors.title ? '#D32F2F' : undefined }} />
          </Field>

          <Field label="Corps *" hint={errors.body ?? `${body.length} / 240`}>
            <Textarea value={body} maxLength={240} onChange={(e) => setBody(e.target.value)} placeholder="Message court qui apparaîtra dans la liste de notifications" style={{ borderColor: errors.body ? '#D32F2F' : undefined }} />
          </Field>

          <div className="flex justify-end pt-2">
            <Btn variant="primary" onClick={onConfirmSend}>
              <Send size={13} /> Envoyer
            </Btn>
          </div>
        </section>

        <section className="bg-white border border-[#EAEAEE] p-6" style={{ borderRadius: 12 }}>
          <h2 className="mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem' }}>Aperçu</h2>
          <div className="px-3 py-3 border border-[#EAEAEE] flex items-start gap-3" style={{ borderRadius: 10, background: '#F7F7FA' }}>
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: `${ICON_OPTIONS.find((i) => i.value === iconKey)?.color}1A`, borderRadius: 9 }}>
              {(() => {
                const I = ICONS[iconKey];
                return <I size={16} style={{ color: ICON_OPTIONS.find((i) => i.value === iconKey)?.color }} strokeWidth={2.4} />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>{title || 'Titre de la notification'}</div>
              <div className="line-clamp-2" style={{ fontSize: '0.78rem', color: '#717182', marginTop: 2 }}>{body || 'Corps du message…'}</div>
              <div className="mt-1" style={{ fontSize: '0.7rem', color: '#717182' }}>À l'instant · {audienceLabel}</div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-3 bg-white border border-[#EAEAEE]" style={{ borderRadius: 12 }}>
          <div className="px-5 py-4 border-b border-[#EAEAEE] flex items-center justify-between">
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem' }}>Historique des envois</div>
            {history.length > 0 && <Btn onClick={() => setClearOpen(true)}>Vider l'historique</Btn>}
          </div>
          {history.length === 0 ? (
            <div className="px-5 py-12 text-center" style={{ color: '#717182' }}>
              <Bell size={20} className="inline mb-2 opacity-50" /><br />
              Aucun envoi pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-[#EAEAEE]">
              {history.map((h) => {
                const meta = ICON_OPTIONS.find((i) => i.value === h.iconKey)!;
                const I = ICONS[h.iconKey];
                return (
                  <div key={h.id} className="px-5 py-4 flex items-start gap-3">
                    <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}1A`, borderRadius: 9 }}>
                      <I size={16} style={{ color: meta.color }} strokeWidth={2.4} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{h.title}</div>
                      <div className="line-clamp-2" style={{ fontSize: '0.8rem', color: '#717182', marginTop: 2 }}>{h.body}</div>
                      <div className="mt-1" style={{ fontSize: '0.72rem', color: '#717182' }}>
                        {new Date(h.sentAt).toLocaleString('fr-FR')} · {h.audienceLabel} · ~{h.estimatedRecipients.toLocaleString('fr-FR')} destinataires
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={sendOpen}
        title="Envoyer cette notification ?"
        message={`${estimated.toLocaleString('fr-FR')} abonnés (${audienceLabel}) recevront ce push. Cette action est irréversible.`}
        confirmLabel="Envoyer"
        onCancel={() => setSendOpen(false)}
        onConfirm={send}
      />
      <ConfirmDialog
        open={clearOpen}
        title="Vider l'historique ?"
        message="L'historique local sera supprimé. Les notifications déjà envoyées restent côté abonnés."
        confirmLabel="Vider"
        danger
        onCancel={() => setClearOpen(false)}
        onConfirm={() => { setHistory([]); setClearOpen(false); show('Historique vidé', 'info'); }}
      />
    </>
  );
}
