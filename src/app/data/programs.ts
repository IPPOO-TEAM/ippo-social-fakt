export interface Program {
  id: string;
  time: string;
  end: string;
  title: string;
  host: string;
  hostInitials: string;
  category: string;
  cover: string;
  live?: boolean;
  audio?: string;
  video?: string;        // URL/Stream HLS pour la diffusion TV en direct
  viewers?: number;      // estimation de spectateurs (affiché dans le carrousel live)
}

export const seedPrograms: Program[] = [
  { id: 'pg1', time: '06:00', end: '08:30', title: 'Le réveil communautaire', host: 'Aïcha Diallo', hostInitials: 'AD', category: 'Magazine', cover: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=600&q=80' },
  { id: 'pg2', time: '08:30', end: '10:00', title: 'Décryptage économique', host: 'Mamadou Bah', hostInitials: 'MB', category: 'Économie', cover: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80', live: true },
  { id: 'pg3', time: '10:00', end: '12:00', title: 'Voix des marchés', host: 'Fatou Ndiaye', hostInitials: 'FN', category: 'Société', cover: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80' },
  { id: 'pg4', time: '12:00', end: '13:00', title: 'Journal de la mi-journée', host: 'Rédaction IPPOO', hostInitials: 'IP', category: 'Info', cover: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&q=80' },
  { id: 'pg5', time: '14:00', end: '15:30', title: 'Santé en partage', host: 'Dr Koné', hostInitials: 'DK', category: 'Santé', cover: 'https://images.unsplash.com/photo-1559757175-08c5e0d3e1ec?w=600&q=80' },
  { id: 'pg6', time: '16:00', end: '18:00', title: 'Jeunesse au micro', host: 'Awa Touré', hostInitials: 'AT', category: 'Jeunesse', cover: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600&q=80' },
  { id: 'pg7', time: '18:00', end: '20:00', title: 'Le grand débat', host: 'Ibrahim Sow', hostInitials: 'IS', category: 'Débat', cover: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=600&q=80' },
  { id: 'pg8', time: '20:00', end: '22:00', title: 'Soirée podcast', host: 'Sélection IPPOO', hostInitials: 'IP', category: 'Podcast', cover: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=80' },
];
