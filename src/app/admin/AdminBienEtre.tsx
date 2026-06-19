import { useMemo, useState } from 'react';
import { Heart, MessageCircle, Music2, TrendingUp } from 'lucide-react';
import { useResource, type MusicTrack } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Modal, Btn, ImageUpload, MediaUpload, exportCsv } from './ui';
import { useWellbeing } from '../lib/wellbeing-store';
import { themes, themeMap, moodLabel, type WellbeingTheme } from '../data/wellbeing';
import { useAdminToast, ConfirmDialog } from './AdminToast';

const emptyTrack = (): MusicTrack => ({
  id: `m-${Date.now()}`,
  title: '',
  mood: 'Apaisement',
  duration: '5:00',
  themes: ['solitude'],
  image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&q=80',
  audio: '',
});

function StatCard({ icon: Icon, label, value, hint, color }: {
  icon: typeof Heart; label: string; value: string | number; hint?: string; color: string;
}) {
  return (
    <div className="bg-white border border-[#EAEAEE] p-5" style={{ borderRadius: 12 }}>
      <div className="w-10 h-10 flex items-center justify-center" style={{ background: `${color}1A`, borderRadius: 10 }}>
        <Icon size={18} style={{ color }} strokeWidth={2.4} />
      </div>
      <div className="mt-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.7rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.78rem', color: '#717182', fontWeight: 500 }}>{label}</div>
      {hint && <div className="mt-1" style={{ fontSize: '0.72rem', color: '#00A03B' }}>{hint}</div>}
    </div>
  );
}

export function AdminBienEtre() {
  const { posts, responses, removePost, removeResponse } = useWellbeing();
  const { items: tracks, create, update, remove, reset } = useResource<MusicTrack>('tracks');
  const { show } = useAdminToast();
  const [tab, setTab] = useState<'posts' | 'tracks' | 'insights'>('posts');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<WellbeingTheme | 'all'>('all');
  const [editing, setEditing] = useState<MusicTrack | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof MusicTrack, string>>>({});
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmPost, setConfirmPost] = useState<string | null>(null);
  const [confirmResp, setConfirmResp] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = filter === 'all' ? posts : posts.filter((p) => p.theme === filter);
    if (q) list = list.filter((p) => (p.title + p.body + p.author).toLowerCase().includes(q));
    return list;
  }, [posts, search, filter]);

  const filteredTracks = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? tracks.filter((t) => (t.title + t.mood).toLowerCase().includes(q)) : tracks;
  }, [tracks, search]);

  const themeStats = useMemo(() => {
    return themes.map((t) => {
      const list = posts.filter((p) => p.theme === t.key);
      const withDelta = list.filter((p) => p.moodAfter);
      const avgDelta = withDelta.length
        ? withDelta.reduce((s, p) => s + ((p.moodAfter!.calm + p.moodAfter!.energy) / 2 - (p.moodBefore.calm + p.moodBefore.energy) / 2), 0) / withDelta.length
        : 0;
      return { ...t, count: list.length, avgDelta };
    }).sort((a, b) => b.count - a.count);
  }, [posts]);

  const totalResponses = responses.length;
  const avgDelta = useMemo(() => {
    const withDelta = posts.filter((p) => p.moodAfter);
    if (!withDelta.length) return 0;
    return withDelta.reduce((s, p) => s + ((p.moodAfter!.calm + p.moodAfter!.energy) / 2 - (p.moodBefore.calm + p.moodBefore.energy) / 2), 0) / withDelta.length;
  }, [posts]);

  const onSaveTrack = () => {
    if (!editing) return;
    const er: Partial<Record<keyof MusicTrack, string>> = {};
    if (!editing.title.trim()) er.title = 'Le titre est requis.';
    if (!editing.mood.trim()) er.mood = "L'ambiance est requise.";
    if (!/^\d+:\d{2}$/.test(editing.duration.trim())) er.duration = 'Format mm:ss attendu.';
    if (editing.themes.length === 0) er.themes = 'Sélectionnez au moins un thème.';
    setErrors(er);
    if (Object.keys(er).length > 0) { show('Champs invalides.', 'error'); return; }
    const isUpdate = tracks.some((t) => t.id === editing.id);
    if (isUpdate) update(editing.id, editing); else create(editing);
    setEditing(null); setErrors({});
    show(isUpdate ? 'Musique mise à jour' : 'Musique créée', 'success');
  };

  const toggleTrackTheme = (key: WellbeingTheme) => {
    if (!editing) return;
    const has = editing.themes.includes(key);
    setEditing({ ...editing, themes: has ? editing.themes.filter((k) => k !== key) : [...editing.themes, key] });
  };

  return (
    <>
      <PageHeader title="Espace Bien-Être" subtitle={`${posts.length} messages · ${totalResponses} réponses · ${tracks.length} musiques`} />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Heart} label="Messages" value={posts.length} color="#FF3FA4" />
          <StatCard icon={MessageCircle} label="Réponses" value={totalResponses} color="#0066FF" />
          <StatCard icon={TrendingUp} label="Δ sérénité moyen" value={`${avgDelta >= 0 ? '+' : ''}${avgDelta.toFixed(1)}`} hint={avgDelta > 0 ? 'Effet positif' : undefined} color="#00C853" />
          <StatCard icon={Music2} label="Musiques" value={tracks.length} color="#9B51E0" />
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-[#EAEAEE]" style={{ borderRadius: 999, width: 'fit-content' }}>
          {(['posts', 'tracks', 'insights'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="px-4 py-1.5 transition-colors"
              style={{
                background: tab === k ? '#0066FF' : 'transparent',
                color: tab === k ? 'white' : '#1a1a1a',
                fontSize: '0.82rem', fontWeight: 700, borderRadius: 999,
              }}
            >
              {k === 'posts' ? 'Modération' : k === 'tracks' ? 'Musiques' : 'Tendances'}
            </button>
          ))}
        </div>

        {tab === 'posts' && (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <Toolbar
                search={search} onSearch={setSearch}
                onExport={() => exportCsv('bien-etre-messages', filteredPosts, [
                  { key: 'id', label: 'ID' },
                  { key: 'theme', label: 'Thème' },
                  { key: 'title', label: 'Titre' },
                  { key: 'body', label: 'Message' },
                  { key: 'author', label: 'Auteur' },
                  { key: 'anonymous', label: 'Anonyme' },
                  { key: 'date', label: 'Date' },
                  { key: 'moodBefore', label: 'Humeur avant', get: (p) => `calm:${p.moodBefore.calm} energy:${p.moodBefore.energy}` },
                  { key: 'moodAfter', label: 'Humeur après', get: (p) => p.moodAfter ? `calm:${p.moodAfter.calm} energy:${p.moodAfter.energy}` : '' },
                  { key: 'responses', label: 'Réponses', get: (p) => responses.filter((r) => r.postId === p.id).length },
                ])}
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as WellbeingTheme | 'all')}
                className="px-3 py-2 bg-white border border-[#EAEAEE] outline-none"
                style={{ borderRadius: 8, fontSize: '0.82rem' }}
              >
                <option value="all">Tous les thèmes</option>
                {themes.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div className="bg-white border border-[#EAEAEE] divide-y divide-[#EAEAEE]" style={{ borderRadius: 12 }}>
              {filteredPosts.length === 0 && (
                <div className="px-5 py-12 text-center text-[#717182]">Aucun message.</div>
              )}
              {filteredPosts.map((p) => {
                const meta = themeMap[p.theme];
                const postResps = responses.filter((r) => r.postId === p.id);
                const delta = p.moodAfter
                  ? ((p.moodAfter.calm + p.moodAfter.energy) / 2) - ((p.moodBefore.calm + p.moodBefore.energy) / 2)
                  : null;
                return (
                  <div key={p.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="px-2 py-0.5" style={{ background: meta.bg, color: meta.color, borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>
                            <><meta.icon size={13} className="inline -mt-0.5 mr-1" /> {meta.label}</>
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#717182' }}>{p.author} · {p.date}</span>
                          {p.anonymous && <span className="px-2 py-0.5 bg-[#F4F4F6]" style={{ borderRadius: 999, fontSize: '0.68rem', fontWeight: 600, color: '#717182' }}>ANONYME</span>}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1a1a1a' }}>{p.title}</div>
                        <div className="mt-1 text-[#1a1a1a]/80 line-clamp-2" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{p.body}</div>
                        <div className="mt-2 flex items-center gap-3 flex-wrap" style={{ fontSize: '0.74rem', color: '#717182' }}>
                          <span>État avant : {moodLabel(p.moodBefore)}</span>
                          {p.moodAfter && <span>· après : {moodLabel(p.moodAfter)}</span>}
                          {delta !== null && (
                            <span style={{ color: delta >= 0 ? '#00A03B' : '#D02F87', fontWeight: 700 }}>
                              Δ {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                            </span>
                          )}
                          <span>· {postResps.length} réponse{postResps.length > 1 ? 's' : ''}</span>
                        </div>
                        {postResps.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {postResps.map((r) => (
                              <div key={r.id} className="bg-[#F7F7FA] px-3 py-2 flex items-start justify-between gap-3" style={{ borderRadius: 8 }}>
                                <div className="min-w-0">
                                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1a1a1a' }}>{r.author} · {r.kind}</div>
                                  <div className="text-[#1a1a1a]/80 line-clamp-2" style={{ fontSize: '0.78rem', lineHeight: 1.45 }}>{r.body}</div>
                                </div>
                                <button
                                  onClick={() => setConfirmResp(r.id)}
                                  className="px-2 py-1 text-[#D32F2F] hover:bg-[#FEEAEA] flex-shrink-0"
                                  style={{ borderRadius: 6, fontSize: '0.72rem', fontWeight: 600 }}
                                >
                                  Suppr.
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setConfirmPost(p.id)}
                        className="px-3 py-2 bg-[#FEEAEA] text-[#D32F2F] hover:bg-[#FBD5D5] flex-shrink-0"
                        style={{ borderRadius: 8, fontSize: '0.78rem', fontWeight: 600 }}
                      >
                        Modérer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'tracks' && (
          <>
            <Toolbar
              search={search} onSearch={setSearch}
              onCreate={() => { setEditing(emptyTrack()); setErrors({}); }}
              onReset={() => setResetOpen(true)}
              onExport={() => exportCsv('bien-etre-musiques', filteredTracks, [
                { key: 'id', label: 'ID' },
                { key: 'title', label: 'Titre' },
                { key: 'mood', label: 'Ambiance' },
                { key: 'duration', label: 'Durée' },
                { key: 'themes', label: 'Thèmes', get: (t) => t.themes.join(' | ') },
                { key: 'audio', label: 'Audio', get: (t) => t.audio?.startsWith('data:') ? '[fichier local]' : (t.audio ?? '') },
              ])}
              createLabel="Nouvelle musique"
            />
            <Table<MusicTrack>
              rows={filteredTracks}
              columns={[
                {
                  key: 'title', label: 'Titre',
                  render: (t) => (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                        <img src={t.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#717182' }}>{t.mood} · {t.duration}</div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'themes', label: 'Thèmes',
                  render: (t) => (
                    <div className="flex flex-wrap gap-1">
                      {t.themes.map((k) => {
                        const m = themeMap[k];
                        return <span key={k} className="px-1.5 py-0.5" style={{ background: m.bg, color: m.color, borderRadius: 999, fontSize: '0.66rem', fontWeight: 600 }}>{m.label}</span>;
                      })}
                    </div>
                  ),
                  width: '260px',
                },
                {
                  key: 'audio', label: 'Audio',
                  render: (t) => t.audio
                    ? (t.audio.startsWith('data:') ? <span style={{ color: '#00A03B', fontSize: '0.74rem', fontWeight: 600 }}>● Local</span> : <span style={{ color: '#0066FF', fontSize: '0.74rem', fontWeight: 600 }}>● URL</span>)
                    : <span style={{ color: '#D32F2F', fontSize: '0.74rem' }}>aucun</span>,
                  width: '90px',
                },
              ]}
              onEdit={(t) => { setEditing(t); setErrors({}); }}
              onDelete={(t) => { remove(t.id); show('Musique supprimée', 'info'); }}
              deleteLabel={(t) => `« ${t.title} »`}
            />
          </>
        )}

        {tab === 'insights' && (
          <div className="bg-white border border-[#EAEAEE] p-5" style={{ borderRadius: 12 }}>
            <div className="mb-4" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>
              Thèmes les plus partagés & effet sur la sérénité
            </div>
            <div className="space-y-3">
              {themeStats.map((s) => {
                const max = themeStats[0]?.count || 1;
                const w = (s.count / max) * 100;
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a' }}><><s.icon size={13} className="inline -mt-0.5 mr-1" /> {s.label}</></span>
                      <span style={{ fontSize: '0.78rem', color: '#717182' }}>
                        {s.count} message{s.count > 1 ? 's' : ''}
                        {s.count > 0 && (
                          <> · Δ {s.avgDelta >= 0 ? '+' : ''}{s.avgDelta.toFixed(1)}</>
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-[#F4F4F6] overflow-hidden" style={{ borderRadius: 999 }}>
                      <div className="h-full" style={{ width: `${w}%`, background: s.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)}
        title={editing && tracks.some((t) => t.id === editing.id) ? 'Modifier la musique' : 'Nouvelle musique'}
        footer={<><Btn onClick={() => setEditing(null)}>Annuler</Btn><Btn variant="primary" onClick={onSaveTrack}>Enregistrer</Btn></>}
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Titre *" hint={errors.title}><Input value={editing.title} maxLength={120} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={{ borderColor: errors.title ? '#D32F2F' : undefined }}/></Field></div>
            <Field label="Ambiance *" hint={errors.mood}><Input value={editing.mood} onChange={(e) => setEditing({ ...editing, mood: e.target.value })} style={{ borderColor: errors.mood ? '#D32F2F' : undefined }}/></Field>
            <Field label="Durée *" hint={errors.duration ?? 'mm:ss'}><Input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} style={{ borderColor: errors.duration ? '#D32F2F' : undefined }}/></Field>
            <div className="col-span-2">
              <Field label="Thèmes ciblés *" hint={errors.themes}>
                <div className="flex flex-wrap gap-1.5">
                  {themes.map((t) => {
                    const on = editing.themes.includes(t.key);
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => toggleTrackTheme(t.key)}
                        className="px-3 py-1.5"
                        style={{
                          background: on ? t.color : t.bg,
                          color: on ? 'white' : '#1a1a1a',
                          borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
                        }}
                      >
                        <><t.icon size={13} className="inline -mt-0.5 mr-1" /> {t.label}</>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Pochette"><ImageUpload value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} aspect="1/1" /></Field>
            </div>
            <div className="col-span-2">
              <Field label="Fichier audio" hint="Importez un MP3 ou collez l'URL d'un flux audio.">
                <MediaUpload kind="audio" value={editing.audio ?? ''} onChange={(url) => setEditing({ ...editing, audio: url })} />
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmPost}
        title="Supprimer ce message ?"
        message="Le message et toutes ses réponses seront définitivement supprimés."
        confirmLabel="Supprimer"
        danger
        onCancel={() => setConfirmPost(null)}
        onConfirm={() => { if (confirmPost) { removePost(confirmPost); show('Message supprimé', 'info'); } setConfirmPost(null); }}
      />
      <ConfirmDialog
        open={!!confirmResp}
        title="Supprimer cette réponse ?"
        message="La réponse sera définitivement supprimée."
        confirmLabel="Supprimer"
        danger
        onCancel={() => setConfirmResp(null)}
        onConfirm={() => { if (confirmResp) { removeResponse(confirmResp); show('Réponse supprimée', 'info'); } setConfirmResp(null); }}
      />
      <ConfirmDialog
        open={resetOpen}
        title="Restaurer les musiques initiales ?"
        message="Vos modifications locales seront remplacées par le jeu de musiques d'exemple."
        confirmLabel="Restaurer"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { reset(); setResetOpen(false); show('Musiques réinitialisées', 'info'); }}
      />
    </>
  );
}
