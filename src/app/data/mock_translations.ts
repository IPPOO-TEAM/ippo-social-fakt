// English translation overlay for mock content.
// Keyed by record id. Other languages fall back to FR (source).
// Add language-specific fields here if needed.

import { useUser } from '../lib/user';

type Lang = 'fr' | 'en' | 'fon' | 'yo' | 'wo' | 'ha' | 'ig' | 'ln' | 'bm' | 'ff' | 'dyu' | 'sef' | 'dje';

interface ArticleTr { title?: string; category?: string; location?: string; date?: string; readTime?: string; excerpt?: string; }
interface EpisodeTr { title?: string; show?: string; duration?: string; }
interface VideoTr   { title?: string; type?: string; }
interface OpportunityTr { title?: string; deadline?: string; tag?: string; }
interface ShortTr   { title?: string; }

type Overlay = {
  articles: Record<string, ArticleTr>;
  episodes: Record<string, EpisodeTr>;
  videos: Record<string, VideoTr>;
  opportunities: Record<string, OpportunityTr>;
  shorts: Record<string, ShortTr>;
};

const en: Overlay = {
  articles: {
    a1:  { title: 'Dantokpa market sees record turnout this weekend', category: 'Local economy', date: '2h ago', readTime: '4 min', excerpt: 'Traders report a major rise tied to end-of-month festivities.' },
    a2:  { title: 'Scholarships: 200 spots open for 2026 intake', category: 'Education', location: 'National', date: '5h ago', readTime: '3 min', excerpt: 'The ministry opens applications for science and tech tracks.' },
    a3:  { title: 'Malaria vaccination drive in 12 neighborhoods', category: 'Health', date: '8h ago', readTime: '5 min', excerpt: 'A free operation run with community health centers.' },
    a4:  { title: 'Urban arts festival returns for its 8th edition', category: 'Culture', date: 'Yesterday', readTime: '6 min', excerpt: 'Three days of concerts, exhibits and workshops open to all.' },
    a5:  { title: 'Tomato, onion, rice: market shifts this week', category: 'Cost of living', date: '1d ago', readTime: '4 min', excerpt: 'Our weekly survey across 8 neighborhood markets.' },
    a6:  { title: 'Three student start-ups win national contest', category: 'Youth', date: '12h ago', readTime: '5 min', excerpt: 'Agro-tech, fintech and e-health: portraits of the winners.' },
    a7:  { title: "Saint-Michel mechanics: a collective to share tools", category: 'Informal sector', date: '3h ago', readTime: '6 min', excerpt: 'A neighborhood co-op changing daily life for 80 artisans.' },
    a8:  { title: "Spotting signs of burnout in children", category: 'Wellness', location: 'Feature', date: '2d ago', readTime: '7 min', excerpt: 'Pediatricians and parents share concrete signs.' },
    a9:  { title: 'Social cohesion: neighborhood mediators on the front line', category: 'Society', date: '1d ago', readTime: '8 min', excerpt: 'Immersive reportage at the heart of community programs.' },
    a10: { title: 'Live radio: morning show takes over Natitingou this week', category: 'Live', date: 'Today', readTime: '2 min', excerpt: 'Special program with on-air listeners for three days.' },
    a11: { title: 'Op-ed: "Give voice to the women of the market"', category: 'Community', location: 'Op-ed', date: '6h ago', readTime: '4 min', excerpt: 'A writer urges a rethink of how we tell informal commerce.' },
    a12: { title: 'Health directory: 47 new centers added this month', category: 'Services', location: 'National', date: '1d ago', readTime: '3 min', excerpt: 'Hospitals, clinics and dispensaries updated on the map.' },
    a13: { title: 'Territories: Sèmè-Kpodji bets on small-scale fishing', category: 'Territories', date: '4h ago', readTime: '7 min', excerpt: 'A local plan to structure the sector and back co-ops.' },
    a14: { title: 'Summer internships: sectors hiring in 2026', category: 'Academy', location: 'National', date: '9h ago', readTime: '5 min', excerpt: 'Tech, health, agri-food: where to apply now.' },
    a15: { title: "Reference basket: what it really costs in Calavi", category: 'Cost of living', date: 'Yesterday', readTime: '6 min', excerpt: 'Our detailed survey on 15 everyday products.' },
    a16: { title: 'How-to: open your mobile money account without errors', category: 'Practical', location: 'Guide', date: '3d ago', readTime: '4 min', excerpt: 'Steps, pitfalls and tips for a smooth start.' },
    a17: { title: 'Local initiative: a shared rooftop garden in Saint-Michel', category: 'Initiative', date: '5h ago', readTime: '5 min', excerpt: 'Fifteen families grow vegetables, herbs and bonds.' },
    a18: { title: 'Memory & heritage: the griots of Tiébissou speak', category: 'Heritage', date: '2d ago', readTime: '9 min', excerpt: 'A series of audio archives gathered over two years.' },
    a19: { title: 'Water & sanitation: priority projects for the year', category: 'Health', location: 'National', date: '6h ago', readTime: '5 min', excerpt: 'Mapping and budgets planned across 32 communes.' },
    a20: { title: 'Live special: municipal elections decoded', category: 'Live', location: 'Studio', date: 'Live now', readTime: '60 min', excerpt: 'Three experts answer your questions tonight at 8pm.' },
    a21: { title: 'Ivorian diaspora: five entrepreneurs tell their return story', category: 'Diaspora', date: '7h ago', readTime: '8 min', excerpt: 'From Dakar to Montréal via Cotonou: voices of those returning to invest.' },
    a22: { title: 'Diaspora remittances: hidden costs to avoid', category: 'Economy', date: '1d ago', readTime: '5 min', excerpt: 'A panafrican comparison to send more, pay less.' },
    a23: { title: 'AfCFTA: what the African single market changes for local SMEs', category: 'Economy', location: 'Continent', date: '2d ago', readTime: '7 min', excerpt: 'Tariffs, customs, opportunities: the state of the continental free trade area.' },
    a24: { title: 'Parakou: stadium renovation enters its final phase', category: 'Infrastructure', date: '3h ago', readTime: '4 min', excerpt: 'Delivery expected before the next continental tournament.' },
    a25: { title: 'A 100% electric bus tested on Cadjèhoun–Plateau line', category: 'Mobility', date: '6h ago', readTime: '5 min', excerpt: 'First real-world trial before gradual rollout.' },
    a26: { title: 'Natitingou: vegetable market reopens after six months of works', category: 'Local economy', date: '9h ago', readTime: '3 min', excerpt: 'Over 400 traders return to stalls in a modernized site.' },
    a27: { title: 'Informal mechanics: a new co-op status piloted in Akpakpa', category: 'Informal', date: '1d ago', readTime: '6 min', excerpt: 'Pooled tools, credit access, ongoing training.' },
    a28: { title: 'ENA entrance exam: registrations open until May 30', category: 'Opportunities', location: 'National', date: '4h ago', readTime: '3 min', excerpt: 'Eligibility, exams, calendar: everything to know.' },
    a29: { title: 'YALI program: 100 young leaders selected this year', category: 'Opportunities', location: 'National', date: '1d ago', readTime: '5 min', excerpt: 'Alumni stories and tips to apply.' },
    a30: { title: 'Diabetes: free consultations Saturday in 6 neighborhoods', category: 'Health', date: '2h ago', readTime: '3 min', excerpt: 'Screening, nutrition advice and support from volunteer doctors.' },
    a31: { title: 'Health mutuals: what changes for informal workers', category: 'Health', location: 'National', date: '14h ago', readTime: '6 min', excerpt: 'Contributions, coverage, steps: the practical guide.' },
    a32: { title: 'Fuel, gas, bread: monthly official price update', category: 'Cost of living', location: 'National', date: '30 min ago', readTime: '3 min', excerpt: 'Modest hikes on regulated goods, watch for fresh products.' },
    a33: { title: 'Students: 5 banks compared to open a first account', category: 'Youth', date: '1d ago', readTime: '5 min', excerpt: 'Fees, mobile services, limits: our transparent review.' },
    a34: { title: 'Marriage and cost of living: how families adapt', category: 'Society', date: '2d ago', readTime: '7 min', excerpt: 'Lighter ceremonies, crowdfunding, deliberate choices.' },
    a35: { title: 'Sèmè-Kpodji: port crosses one-million-container mark', category: 'Economy', date: '5h ago', readTime: '4 min', excerpt: 'Growth driven by cocoa and new logistics corridors.' },
  },
  episodes: {
    p1:  { title: 'Women entrepreneurs: stories that inspire', show: 'Voices of Africa', duration: '32 min' },
    p2:  { title: 'Understanding cocoa prices in 15 minutes', show: 'Local Economy', duration: '15 min' },
    p3:  { title: 'Innovation in the informal sector', show: 'Field Notes', duration: '28 min' },
    p4:  { title: 'Mental health: speaking up', show: 'Wellness', duration: '24 min' },
    p5:  { title: 'Pan-African scholarships: decoding diaspora applications', show: 'Academy', duration: '36 min' },
    p6:  { title: 'Voices of the neighborhood: Calavi in 30 minutes', show: 'Community', duration: '30 min' },
    p7:  { title: 'Vaccines, doubts and facts: Q&A', show: 'Public Health', duration: '22 min' },
    p8:  { title: 'Neighborhood markets: new patterns', show: 'Local Economy', duration: '19 min' },
    p9:  { title: 'Live: Thursday morning show', show: 'Live', duration: '90 min' },
    p10: { title: 'Urban mobility: where do we stand in Cotonou?', show: 'Society', duration: '41 min' },
    p11: { title: 'Farming co-ops: lessons from the field', show: 'Field Notes', duration: '34 min' },
    p12: { title: 'CV and interview: passing the first screen', show: 'Academy', duration: '18 min' },
    p13: { title: 'Oral memory: stories from Abomey', show: 'Heritage', duration: '46 min' },
    p14: { title: 'Open mic: your messages of the week', show: 'Community', duration: '27 min' },
    p15: { title: 'Diaspora, identity and return: pan-African talks', show: 'Voices of Africa', duration: '38 min' },
  },
  videos: {
    v1:  { title: '60 seconds to understand microcredit', type: 'Capsule' },
    v2:  { title: 'Reportage: women of the Parakou market', type: 'Reportage' },
    v3:  { title: 'Portrait: Aïcha, founder of Mama Cuisine', type: 'Portrait' },
    v4:  { title: 'How to build a scholarship file, step by step', type: 'Capsule' },
    v5:  { title: 'Mini-doc: the youth of Natitingou', type: 'Mini-doc' },
    v6:  { title: 'Expert: nutrition and family budget', type: 'Expert' },
    v7:  { title: "Reportage: Saint-Michel's night markets", type: 'Reportage' },
    v8:  { title: 'Health capsule: preventing malaria in children', type: 'Capsule' },
    v9:  { title: 'Video op-ed: "Our neighborhood, our voice"', type: 'Op-ed' },
    v10: { title: 'Mini-doc: Parakou textile artisans', type: 'Mini-doc' },
    v11: { title: 'Live: clips from the municipal debate', type: 'Live' },
    v12: { title: 'Cost-of-living capsule: reading a label', type: 'Capsule' },
    v13: { title: 'Society: portraits of engaged youth', type: 'Reportage' },
    v14: { title: 'Services: how to use the centers map', type: 'Tutorial' },
  },
  opportunities: {
    o1:  { title: 'INP-HB Scholarship 2026', deadline: 'May 15', tag: 'Scholarship' },
    o2:  { title: 'Young Entrepreneurs Contest', deadline: 'May 30', tag: 'Contest' },
    o3:  { title: 'Free sewing training', deadline: 'May 10', tag: 'Training' },
    o4:  { title: 'Agriculture call for projects', deadline: 'May 22', tag: 'Funding' },
    o5:  { title: 'Tech Mentorship Program 2026', deadline: 'June 5', tag: 'Mentorship' },
    o6:  { title: 'Artisan equipment grant', deadline: 'May 18', tag: 'Grant' },
    o7:  { title: 'Microcredit for market co-ops', deadline: 'May 28', tag: 'Microcredit' },
    o8:  { title: 'Mo Ibrahim Foundation Scholarship · African leadership', deadline: 'June 12', tag: 'Scholarship' },
    o9:  { title: 'E-health start-up incubation', deadline: 'June 20', tag: 'Incubation' },
    o10: { title: 'Community photography contest', deadline: 'June 8', tag: 'Contest' },
    o11: { title: 'Diaspora return program · Africa Investing', deadline: 'June 25', tag: 'Diaspora' },
    o12: { title: 'African Leadership Academy pan-African scholarship', deadline: 'June 30', tag: 'Scholarship' },
  },
  shorts: {
    s1:  { title: '"Morning in Dantokpa"' },
    s2:  { title: '3 tips to save at the market' },
    s3:  { title: 'A day with a delivery rider' },
    s4:  { title: 'The simple gesture that saves: CPR in 60s' },
    s5:  { title: 'Student · my Cadjèhoun routine' },
    s6:  { title: 'Parakou in time-lapse' },
    s7:  { title: 'Express recipe: alloco in 60s' },
    s8:  { title: '"Why I vote" · street poll' },
    s9:  { title: 'Sewing workshop: the pagne that speaks' },
    s10: { title: 'Sèmè-Kpodji view from the port' },
  },
};

const overlays: Partial<Record<Lang, Overlay>> = { en };

export function useContentT() {
  const { user } = useUser();
  const lang = user.language as Lang;
  const overlay = overlays[lang];

  return {
    article: <K extends keyof ArticleTr>(id: string, field: K, fallback: string): string =>
      (overlay?.articles[id]?.[field] as string | undefined) ?? fallback,
    episode: <K extends keyof EpisodeTr>(id: string, field: K, fallback: string): string =>
      (overlay?.episodes[id]?.[field] as string | undefined) ?? fallback,
    video: <K extends keyof VideoTr>(id: string, field: K, fallback: string): string =>
      (overlay?.videos[id]?.[field] as string | undefined) ?? fallback,
    opportunity: <K extends keyof OpportunityTr>(id: string, field: K, fallback: string): string =>
      (overlay?.opportunities[id]?.[field] as string | undefined) ?? fallback,
    short: <K extends keyof ShortTr>(id: string, field: K, fallback: string): string =>
      (overlay?.shorts[id]?.[field] as string | undefined) ?? fallback,
  };
}
