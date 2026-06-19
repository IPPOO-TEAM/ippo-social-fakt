import { Home, Heart, Briefcase, Moon, Feather, Handshake, Sparkles, Brain, type LucideIcon } from 'lucide-react';

export type WellbeingTheme =
  | 'famille' | 'couple' | 'travail' | 'solitude'
  | 'deuil' | 'amitie' | 'confiance' | 'sante-mentale';

export interface ThemeMeta {
  key: WellbeingTheme;
  label: string;
  color: string;
  bg: string;
  icon: LucideIcon;
}

export const themes: ThemeMeta[] = [
  { key: 'famille',       label: 'Famille',          color: '#FF8A00', bg: '#FFE9D4', icon: Home },
  { key: 'couple',        label: 'Couple',           color: '#FF3FA4', bg: '#FFE0F2', icon: Heart },
  { key: 'travail',       label: 'Travail',          color: '#0066FF', bg: '#DFF0FF', icon: Briefcase },
  { key: 'solitude',      label: 'Solitude',         color: '#9B51E0', bg: '#EFE4FF', icon: Moon },
  { key: 'deuil',         label: 'Deuil',            color: '#4A4A55', bg: '#F0F0F4', icon: Feather },
  { key: 'amitie',        label: 'Amitié',           color: '#00C853', bg: '#D4F4E0', icon: Handshake },
  { key: 'confiance',     label: 'Confiance en soi', color: '#E8B21A', bg: '#FFF6D9', icon: Sparkles },
  { key: 'sante-mentale', label: 'Santé mentale',    color: '#4A90E2', bg: '#DFF0FF', icon: Brain },
];

export const themeMap: Record<WellbeingTheme, ThemeMeta> = themes.reduce(
  (acc, t) => { acc[t.key] = t; return acc; },
  {} as Record<WellbeingTheme, ThemeMeta>,
);

export interface Mood {
  calm: number;     // 1 (tendu) → 10 (apaisé)
  energy: number;   // 1 (épuisé) → 10 (énergique)
}

export type ResponseKind = 'support' | 'experience' | 'critique';

export const responseKindMeta: Record<ResponseKind, { label: string; color: string; bg: string; hint: string }> = {
  support:    { label: 'Soutien',           color: '#00C853', bg: '#D4F4E0', hint: 'Encourager, rassurer' },
  experience: { label: 'Mon expérience',    color: '#0066FF', bg: '#DFF0FF', hint: 'Partager un vécu similaire' },
  critique:   { label: 'Avis bienveillant', color: '#9B51E0', bg: '#EFE4FF', hint: 'Une autre perspective, sans juger' },
};

export interface WellbeingResponse {
  id: string;
  postId: string;
  author: string;
  kind: ResponseKind;
  body: string;
  date: string;
  helpful: number;
}

export interface WellbeingPost {
  id: string;
  theme: WellbeingTheme;
  title: string;
  body: string;
  author: string;            // pseudonyme
  anonymous: boolean;
  date: string;
  moodBefore: Mood;
  moodAfter?: Mood;
  image?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  mood: string;              // libellé court
  duration: string;
  themes: WellbeingTheme[];
  image: string;
  audio?: string;
}

export const seedPosts: WellbeingPost[] = [
  {
    id: 'we-1', theme: 'solitude',
    title: "Je me sens invisible depuis mon arrivée à Cotonou",
    body: "Je suis arrivée à Cotonou il y a 6 mois pour le travail. Les journées passent vite mais le soir, dans ma chambre, je ressens un vide. Comment vous avez fait pour vous reconstruire un cercle après un déménagement ?",
    author: 'Aminata · 28 ans',
    anonymous: false,
    date: 'il y a 2 j',
    moodBefore: { calm: 3, energy: 4 },
    moodAfter:  { calm: 6, energy: 6 },
    image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&q=80',
  },
  {
    id: 'we-2', theme: 'couple',
    title: "Mon mari ne parle plus depuis qu'il a perdu son poste",
    body: "Depuis qu'il a été remercié il y a 3 mois, il s'est replié. Il dort beaucoup, parle peu. J'aimerais l'aider sans le brusquer. Quelqu'un a déjà traversé cette phase ?",
    author: 'Anonyme',
    anonymous: true,
    date: 'il y a 4 j',
    moodBefore: { calm: 4, energy: 3 },
    image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&q=80',
  },
  {
    id: 'we-3', theme: 'famille',
    title: "Ma mère pense que je dois absolument me marier avant 30 ans",
    body: "À chaque appel le sujet revient. J'ai 27 ans, je ne suis pas pressée mais elle insiste. Comment poser une limite sans la blesser ?",
    author: 'Mariam',
    anonymous: false,
    date: 'il y a 1 sem',
    moodBefore: { calm: 5, energy: 6 },
    moodAfter:  { calm: 7, energy: 7 },
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1200&q=80',
  },
  {
    id: 'we-4', theme: 'travail',
    title: "Je n'ose pas demander une augmentation",
    body: "5 ans dans la même boîte, mes responsabilités ont triplé, mais à chaque entretien annuel j'évite le sujet par peur. Comment vous abordez ça ?",
    author: 'Yao · 33 ans',
    anonymous: false,
    date: 'il y a 5 j',
    moodBefore: { calm: 4, energy: 5 },
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80',
  },
  {
    id: 'we-5', theme: 'deuil',
    title: "Comment continuer après le départ de mon père ?",
    body: "Mon père est parti il y a 4 mois. Les gens autour de moi pensent que c'est passé, mais certains soirs c'est encore très lourd. Est-ce normal ?",
    author: 'Anonyme',
    anonymous: true,
    date: 'il y a 1 sem',
    moodBefore: { calm: 2, energy: 3 },
    moodAfter:  { calm: 5, energy: 4 },
    image: 'https://images.unsplash.com/photo-1505820013142-f86a3439c5b2?w=1200&q=80',
  },
  {
    id: 'we-6', theme: 'confiance',
    title: "Je n'arrive plus à parler en réunion",
    body: "Plus la table est grande, plus je me bloque. Pourtant en petit comité je suis à l'aise. Avez-vous des techniques qui vous ont aidé concrètement ?",
    author: 'Fatou · 26 ans',
    anonymous: false,
    date: 'il y a 3 j',
    moodBefore: { calm: 5, energy: 6 },
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&q=80',
  },
  {
    id: 'we-7', theme: 'amitie',
    title: "Mon meilleur ami s'éloigne sans explication",
    body: "On s'appelait toutes les semaines depuis 10 ans. Depuis 2 mois il ne répond plus à mes messages. Faut-il insister ou laisser de l'espace ?",
    author: 'Anonyme',
    anonymous: true,
    date: 'il y a 6 j',
    moodBefore: { calm: 4, energy: 5 },
    image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1200&q=80',
  },
  {
    id: 'we-8', theme: 'sante-mentale',
    title: "L'angoisse du dimanche soir me ronge",
    body: "Chaque dimanche à partir de 18h je commence à avoir mal au ventre. Lundi semble une montagne. Comment alléger cette boucle ?",
    author: 'Kouadio',
    anonymous: false,
    date: 'il y a 2 j',
    moodBefore: { calm: 3, energy: 4 },
    moodAfter:  { calm: 6, energy: 5 },
    image: 'https://images.unsplash.com/photo-1470115636492-6d2b56f9146d?w=1200&q=80',
  },
];

export const seedResponses: WellbeingResponse[] = [
  { id: 'r-1', postId: 'we-1', author: 'Salimata', kind: 'experience', body: "Je suis passée par là en arrivant à Parakou. J'ai commencé par fréquenter un cours de danse une fois par semaine, pas pour rencontrer des gens, juste pour avoir un rendez-vous avec moi-même. Les liens sont venus après, sans forcer.", date: 'il y a 2 j', helpful: 14 },
  { id: 'r-2', postId: 'we-1', author: 'Jean-Marc', kind: 'support', body: "Le vide que tu décris est très commun et passe, donne-toi du temps. Tu n'es pas invisible, tu es simplement en transition.", date: 'il y a 2 j', helpful: 9 },
  { id: 'r-3', postId: 'we-1', author: 'Anonyme', kind: 'critique', body: "Attention à ne pas tout demander à la ville : parfois la solitude vient d'une attente trop forte vis-à-vis des autres. Reprends d'abord ce qui te nourrit toi.", date: 'il y a 1 j', helpful: 6 },

  { id: 'r-4', postId: 'we-2', author: 'Aïssatou', kind: 'experience', body: "Mon frère a vécu la même chose en 2022. Ce qui a aidé : ne pas combler son silence, mais lui montrer que la maison reste un endroit sûr. Pas de questions, juste de la présence.", date: 'il y a 3 j', helpful: 21 },
  { id: 'r-5', postId: 'we-2', author: 'Dr. Tagro', kind: 'support', body: "La perte d'un emploi est un deuil identitaire. Si le repli dure plus de 6 semaines, n'hésitez pas à proposer un accompagnement avec un praticien, sans le forcer.", date: 'il y a 3 j', helpful: 17 },

  { id: 'r-6', postId: 'we-3', author: 'Mariam Y.', kind: 'experience', body: "J'ai eu cette discussion en posant un cadre : 'Maman, j'entends ton inquiétude. Je te promets de t'en parler quand ce sera le moment, mais pas à chaque appel.' Ça a calmé.", date: 'il y a 5 j', helpful: 11 },
  { id: 'r-7', postId: 'we-3', author: 'Anonyme', kind: 'critique', body: "Sa pression vient souvent de sa propre peur du regard des autres. Ce n'est pas contre toi, mais ce n'est pas non plus à toi de la porter.", date: 'il y a 4 j', helpful: 8 },

  { id: 'r-8', postId: 'we-5', author: 'Sœur Marthe', kind: 'support', body: "4 mois c'est très récent. Le deuil n'a pas de calendrier, laisser monter les vagues est sain. Tu peux ressentir ça pendant des années par moments, et c'est normal.", date: 'il y a 6 j', helpful: 24 },
  { id: 'r-9', postId: 'we-5', author: 'Olivier', kind: 'experience', body: "Pour mon père j'ai mis longtemps. Ce qui m'a aidé : écrire chaque dimanche soir une chose que je voulais lui dire. Petit à petit le poids s'est partagé.", date: 'il y a 5 j', helpful: 18 },

  { id: 'r-10', postId: 'we-8', author: 'Coach Bamba', kind: 'experience', body: "L'angoisse anticipe. Essaie de fermer ton dimanche par un rituel court (15 min de marche, une douche tiède, écrire 3 priorités pour lundi). Couper le défilement des réseaux après 19h.", date: 'il y a 2 j', helpful: 19 },
  { id: 'r-11', postId: 'we-8', author: 'Anonyme', kind: 'support', body: "Tu n'es pas seul, beaucoup de personnes vivent ça. Le simple fait d'écrire ici, c'est déjà un pas.", date: 'il y a 1 j', helpful: 10 },
];

export const musicTracks: MusicTrack[] = [
  {
    id: 'm-1', title: 'Souffle long', mood: 'Apaisement',
    duration: '6:12', themes: ['solitude', 'sante-mentale'],
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&q=80',
  },
  {
    id: 'm-2', title: 'Cercle de parole', mood: 'Liens',
    duration: '4:48', themes: ['famille', 'amitie'],
    image: 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=800&q=80',
  },
  {
    id: 'm-3', title: 'Dimanche doux', mood: 'Anti-angoisse',
    duration: '7:20', themes: ['sante-mentale', 'travail'],
    image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80',
  },
  {
    id: 'm-4', title: 'Au creux du silence', mood: 'Deuil',
    duration: '8:05', themes: ['deuil', 'solitude'],
    image: 'https://images.unsplash.com/photo-1505820013142-f86a3439c5b2?w=800&q=80',
  },
  {
    id: 'm-5', title: 'Reprendre place', mood: 'Confiance',
    duration: '5:34', themes: ['confiance', 'travail'],
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80',
  },
  {
    id: 'm-6', title: 'Lien retrouvé', mood: 'Réconciliation',
    duration: '6:48', themes: ['couple', 'famille'],
    image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&q=80',
  },
  {
    id: 'm-7', title: 'Pluie sur la canopée', mood: 'Sommeil profond',
    duration: '12:00', themes: ['sante-mentale', 'solitude'],
    image: 'https://images.unsplash.com/photo-1438449805896-28a666819a20?w=800&q=80',
  },
  {
    id: 'm-8', title: 'Vagues de Grand-Bassam', mood: 'Méditation océan',
    duration: '15:30', themes: ['sante-mentale'],
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  },
  {
    id: 'm-9', title: 'Forêt du matin', mood: 'Éveil doux',
    duration: '8:42', themes: ['confiance', 'sante-mentale'],
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
  },
  {
    id: 'm-10', title: 'Kora apaisante', mood: 'Tradition vivante',
    duration: '9:15', themes: ['famille', 'amitie'],
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80',
  },
  {
    id: 'm-11', title: 'Balafon du soir', mood: 'Détente',
    duration: '7:50', themes: ['solitude', 'famille'],
    image: 'https://images.unsplash.com/photo-1483393458019-411bc6bd104e?w=800&q=80',
  },
  {
    id: 'm-12', title: 'Ndombolo lent', mood: 'Lâcher-prise',
    duration: '6:35', themes: ['confiance', 'amitie'],
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80',
  },
  {
    id: 'm-13', title: 'Souffle ancestral', mood: 'Ancrage',
    duration: '10:08', themes: ['deuil', 'famille'],
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
  },
  {
    id: 'm-14', title: 'Méditation guidée · 5 min', mood: 'Pause flash',
    duration: '5:00', themes: ['sante-mentale', 'travail'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  },
  {
    id: 'm-15', title: 'Méditation guidée · 20 min', mood: 'Reset profond',
    duration: '20:00', themes: ['sante-mentale', 'solitude'],
    image: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?w=800&q=80',
  },
  {
    id: 'm-16', title: 'Cohérence cardiaque', mood: 'Respiration 5-5',
    duration: '5:00', themes: ['sante-mentale', 'travail'],
    image: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=800&q=80',
  },
  {
    id: 'm-17', title: 'Forêt de la Lama · ambiance forêt', mood: 'Nature béninoise',
    duration: '14:22', themes: ['sante-mentale'],
    image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80',
  },
  {
    id: 'm-18', title: 'Berceuse pour adultes', mood: 'Endormissement',
    duration: '11:18', themes: ['sante-mentale', 'solitude'],
    image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&q=80',
  },
  {
    id: 'm-19', title: 'Crépuscule sur le lagon', mood: 'Décompression',
    duration: '9:40', themes: ['couple', 'sante-mentale'],
    image: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&q=80',
  },
  {
    id: 'm-20', title: 'Bols tibétains', mood: 'Vibrations apaisantes',
    duration: '13:45', themes: ['sante-mentale', 'deuil'],
    image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=80',
  },
  {
    id: 'm-21', title: 'Tambour parlant doux', mood: 'Mémoire & racines',
    duration: '8:25', themes: ['deuil', 'famille'],
    image: 'https://images.unsplash.com/photo-1513863999091-1a3e36796c95?w=800&q=80',
  },
  {
    id: 'm-22', title: 'Piano sous la pluie', mood: 'Mélancolie douce',
    duration: '6:55', themes: ['deuil', 'solitude'],
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80',
  },
  {
    id: 'm-23', title: 'Chœur a cappella', mood: 'Élévation',
    duration: '7:12', themes: ['amitie', 'confiance'],
    image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=800&q=80',
  },
  {
    id: 'm-24', title: 'Nuit étoilée à Natitingou', mood: 'Contemplation',
    duration: '16:30', themes: ['solitude', 'sante-mentale'],
    image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80',
  },
  {
    id: 'm-25', title: 'Brise du Plateau', mood: 'Légèreté',
    duration: '5:48', themes: ['confiance', 'travail'],
    image: 'https://images.unsplash.com/photo-1534269222346-21c629caf6f5?w=800&q=80',
  },
  {
    id: 'm-26', title: 'Yoga nidra · 30 min', mood: 'Relaxation profonde',
    duration: '30:00', themes: ['sante-mentale', 'travail'],
    image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80',
  },
  {
    id: 'm-27', title: 'Café matinal · ambiance', mood: 'Démarrage en douceur',
    duration: '7:00', themes: ['travail', 'amitie'],
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  },
  {
    id: 'm-28', title: 'Fleuve Bandama', mood: 'Flux apaisant',
    duration: '12:45', themes: ['sante-mentale', 'deuil'],
    image: 'https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?w=800&q=80',
  },
  {
    id: 'm-29', title: 'Nuit douce · diaspora', mood: 'Réconfort à distance',
    duration: '8:18', themes: ['solitude', 'famille'],
    image: 'https://images.unsplash.com/photo-1419833173245-f59e1b93f9ee?w=800&q=80',
  },
  {
    id: 'm-30', title: 'Souffle 4-7-8', mood: 'Anti-anxiété',
    duration: '6:00', themes: ['sante-mentale', 'travail'],
    image: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&q=80',
  },
];

export function findPost(id: string, posts: WellbeingPost[]) {
  return posts.find((p) => p.id === id);
}

export function moodLabel(m: Mood): string {
  const avg = (m.calm + m.energy) / 2;
  if (avg <= 3) return 'Tendu·e';
  if (avg <= 5) return 'Mitigé·e';
  if (avg <= 7) return 'Apaisé·e';
  return 'Serein·e';
}

export function moodColor(m: Mood): string {
  const avg = (m.calm + m.energy) / 2;
  if (avg <= 3) return '#FF3FA4';
  if (avg <= 5) return '#FF8A00';
  if (avg <= 7) return '#0066FF';
  return '#00C853';
}
