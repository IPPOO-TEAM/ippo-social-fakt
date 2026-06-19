import { useState, useEffect } from 'react';
import { PageHeader } from './PageHeader';
import { Field, Input, Textarea, Btn } from './ui';
import { CheckCircle2 } from 'lucide-react';
import { useAdminToast, ConfirmDialog } from './AdminToast';

interface AppSettings {
  siteName: string;
  tagline: string;
  defaultZone: string;
  contactEmail: string;
  supportPhone: string;
  premiumPriceXof: number;
  enableComments: boolean;
  enableLive: boolean;
  enableOpportunities: boolean;
  maintenanceMessage: string;
}

const KEY = 'ippoo:admin:settings';

const DEFAULT: AppSettings = {
  siteName: 'IPPOO Social-Fact',
  tagline: 'Le média communautaire africain',
  defaultZone: 'Cotonou',
  contactEmail: 'redaction@ippoo.ci',
  supportPhone: '+229 27 22 00 00 00',
  premiumPriceXof: 1500,
  enableComments: true,
  enableLive: true,
  enableOpportunities: true,
  maintenanceMessage: '',
};

function read(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function AdminSettings() {
  const { show } = useAdminToast();
  const [settings, setSettings] = useState<AppSettings>(() => read());
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof AppSettings, string>>>({});
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(null), 2500);
    return () => clearTimeout(t);
  }, [savedAt]);

  const save = () => {
    const er: Partial<Record<keyof AppSettings, string>> = {};
    if (!settings.siteName.trim()) er.siteName = 'Le nom du site est requis.';
    if (!settings.tagline.trim()) er.tagline = 'Le slogan est requis.';
    if (!settings.defaultZone.trim()) er.defaultZone = 'Zone requise.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contactEmail)) er.contactEmail = 'Email invalide.';
    if (!/^[\d+\s().-]{6,}$/.test(settings.supportPhone)) er.supportPhone = 'Numéro invalide.';
    if (!Number.isFinite(settings.premiumPriceXof) || settings.premiumPriceXof < 0) er.premiumPriceXof = 'Prix ≥ 0 requis.';
    setErrors(er);
    if (Object.keys(er).length > 0) { show('Champs invalides.', 'error'); return; }
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
      setSavedAt(Date.now());
      show('Réglages enregistrés', 'success');
    } catch {
      show('Espace de stockage saturé.', 'error');
    }
  };

  const onReset = () => {
    localStorage.removeItem(KEY);
    setSettings(DEFAULT);
    setErrors({});
    setResetOpen(false);
    show('Réglages réinitialisés', 'info');
  };

  const Toggle = ({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-start justify-between gap-4 py-3 border-b border-[#EAEAEE] last:border-b-0 cursor-pointer">
      <div className="flex-1">
        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1a1a1a' }}>{label}</div>
        {hint && <div style={{ fontSize: '0.78rem', color: '#717182', marginTop: 2 }}>{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="w-11 h-6 transition-colors relative flex-shrink-0"
        style={{ background: checked ? '#0066FF' : '#D9D9DE', borderRadius: 999 }}
      >
        <div className="absolute top-0.5 transition-all bg-white" style={{ left: checked ? 22 : 2, width: 20, height: 20, borderRadius: '50%' }} />
      </button>
    </label>
  );

  return (
    <>
      <PageHeader
        title="Réglages"
        subtitle="Configuration générale de la plateforme"
        actions={
          <>
            {savedAt && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E4F7E9] text-[#00A03B]" style={{ borderRadius: 8, fontSize: '0.78rem', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Enregistré
              </div>
            )}
            <Btn onClick={() => setResetOpen(true)}>Réinitialiser</Btn>
            <Btn variant="primary" onClick={save}>Enregistrer</Btn>
          </>
        }
      />

      <div className="p-8 max-w-3xl space-y-6">
        <section className="bg-white border border-[#EAEAEE] p-6" style={{ borderRadius: 12 }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#1a1a1a', marginBottom: 16 }}>
            Identité de la plateforme
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Nom du site *" hint={errors.siteName}><Input value={settings.siteName} maxLength={80} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} style={{ borderColor: errors.siteName ? '#D32F2F' : undefined }}/></Field></div>
            <div className="col-span-2"><Field label="Slogan *" hint={errors.tagline}><Input value={settings.tagline} maxLength={140} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} style={{ borderColor: errors.tagline ? '#D32F2F' : undefined }}/></Field></div>
            <Field label="Zone par défaut *" hint={errors.defaultZone}><Input value={settings.defaultZone} onChange={(e) => setSettings({ ...settings, defaultZone: e.target.value })} style={{ borderColor: errors.defaultZone ? '#D32F2F' : undefined }}/></Field>
            <Field label="Email rédaction *" hint={errors.contactEmail}><Input type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} style={{ borderColor: errors.contactEmail ? '#D32F2F' : undefined }}/></Field>
            <Field label="Téléphone support *" hint={errors.supportPhone}><Input value={settings.supportPhone} onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })} style={{ borderColor: errors.supportPhone ? '#D32F2F' : undefined }}/></Field>
            <Field label="Prix Premium (FCFA / mois)" hint={errors.premiumPriceXof ?? 'Affiché dans le profil utilisateur'}>
              <Input type="number" min={0} value={settings.premiumPriceXof} onChange={(e) => setSettings({ ...settings, premiumPriceXof: Math.max(0, Number(e.target.value) || 0) })} style={{ borderColor: errors.premiumPriceXof ? '#D32F2F' : undefined }}/>
            </Field>
          </div>
        </section>

        <section className="bg-white border border-[#EAEAEE] p-6" style={{ borderRadius: 12 }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#1a1a1a', marginBottom: 8 }}>
            Modules actifs
          </h2>
          <div>
            <Toggle label="Commentaires" hint="Permettre les commentaires sur les articles et épisodes" checked={settings.enableComments} onChange={(v) => setSettings({ ...settings, enableComments: v })} />
            <Toggle label="Direct radio" hint="Afficher la section Live et les programmes en direct" checked={settings.enableLive} onChange={(v) => setSettings({ ...settings, enableLive: v })} />
            <Toggle label="Opportunités" hint="Bourses, concours, formations" checked={settings.enableOpportunities} onChange={(v) => setSettings({ ...settings, enableOpportunities: v })} />
          </div>
        </section>

        <section className="bg-white border border-[#EAEAEE] p-6" style={{ borderRadius: 12 }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#1a1a1a', marginBottom: 16 }}>
            Maintenance
          </h2>
          <Field label="Message de maintenance" hint="Laisser vide pour désactiver. Affiché en haut de l'app si rempli.">
            <Textarea value={settings.maintenanceMessage} onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })} />
          </Field>
        </section>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Réinitialiser les réglages ?"
        message="Tous les paramètres reviennent aux valeurs par défaut."
        confirmLabel="Réinitialiser"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={onReset}
      />
    </>
  );
}
