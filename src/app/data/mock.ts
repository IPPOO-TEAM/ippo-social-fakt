import type { SectionKey } from './sections';

export interface Article {
  id: string;
  title: string;
  category: string;
  location: string;
  image: string;
  date: string;
  readTime: string;
  color: string;
  excerpt: string;
  section: SectionKey;
  premium?: boolean;
}

export interface Episode {
  id: string;
  title: string;
  show: string;
  duration: string;
  plays: string;
  image: string;
  color: string;
  section: SectionKey;
  audio?: string;
  premium?: boolean;
}

export interface Video {
  id: string;
  title: string;
  type: string;
  duration: string;
  image: string;
  section: SectionKey;
  video?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  deadline: string;
  tag: string;
  color: string;
  image: string;
  section: SectionKey;
}

export const articles: Article[] = [
  {
    id: 'a1',
    title: 'Le marché de Dantokpa bat un record d\'affluence ce week-end',
    category: 'Économie locale',
    location: 'Cotonou',
    image: 'https://images.unsplash.com/photo-1589707197624-27802d81f462?w=800&q=80',
    date: 'Il y a 2h', readTime: '4 min', color: '#FF8A00',
    excerpt: 'Les commerçants notent une hausse significative liée aux festivités de fin de mois.',
    section: 'informel',
  },
  {
    id: 'a2',
    title: 'Bourse d\'études : 200 places ouvertes pour la rentrée 2026',
    category: 'Éducation', location: 'National',
    image: 'https://images.unsplash.com/photo-1573497491207-618cc224f243?w=800&q=80',
    date: 'Il y a 5h', readTime: '3 min', color: '#4A90E2',
    excerpt: 'Le ministère ouvre les candidatures pour les filières scientifiques et techniques.',
    section: 'jeunesse',
  },
  {
    id: 'a3',
    title: 'Campagne de vaccination contre le paludisme dans 12 quartiers',
    category: 'Santé', location: 'Akpakpa',
    image: 'https://images.unsplash.com/photo-1666867540898-aaa1993ffabc?w=800&q=80',
    date: 'Il y a 8h', readTime: '5 min', color: '#00C853',
    excerpt: 'Une opération gratuite menée avec les centres de santé communautaires.',
    section: 'sante',
  },
  {
    id: 'a4',
    title: 'Le festival des arts urbains revient pour sa 8e édition',
    category: 'Culture', location: 'Cadjèhoun',
    image: 'https://images.unsplash.com/photo-1544214361-1c945dbf4123?w=800&q=80',
    date: 'Hier', readTime: '6 min', color: '#FF3FA4',
    excerpt: 'Trois jours de concerts, expositions et ateliers ouverts au public.',
    section: 'societe',
  },
  {
    id: 'a5',
    title: 'Tomate, oignon, riz : ce qui a bougé sur les marchés cette semaine',
    category: 'Consommation', location: 'Cotonou',
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
    date: 'Il y a 1j', readTime: '4 min', color: '#E8B21A',
    excerpt: 'Notre relevé hebdomadaire dans 8 marchés de quartier.',
    section: 'consommation',
  },
  {
    id: 'a6',
    title: 'Trois start-ups étudiantes primées au concours national',
    category: 'Jeunesse', location: 'Porto-Novo',
    image: 'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?w=800&q=80',
    date: 'Il y a 12h', readTime: '5 min', color: '#9B51E0',
    excerpt: 'Agro-tech, fintech et e-santé : portraits des lauréats.',
    section: 'jeunesse',
    premium: true,
  },
  {
    id: 'a7',
    title: 'Mécaniciens d\'Saint-Michel : un collectif pour mutualiser les outils',
    category: 'Secteur informel', location: 'Saint-Michel',
    image: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=800&q=80',
    date: 'Il y a 3h', readTime: '6 min', color: '#E8B21A',
    excerpt: 'Une coopérative de quartier qui change le quotidien de 80 artisans.',
    section: 'informel',
  },
  {
    id: 'a8',
    title: 'Comment reconnaître les signes d\'épuisement chez l\'enfant',
    category: 'Bien-être', location: 'Dossier',
    image: 'https://images.unsplash.com/photo-1512290793455-dd2f915493bc?w=800&q=80',
    date: 'Il y a 2j', readTime: '7 min', color: '#00C853',
    excerpt: 'Pédiatres et parents partagent leurs repères concrets.',
    section: 'sante',
    premium: true,
  },
  {
    id: 'a9',
    title: 'Cohésion sociale : les médiateurs de quartier en première ligne',
    category: 'Société', location: 'Parakou',
    image: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=800&q=80',
    date: 'Il y a 1j', readTime: '8 min', color: '#4A90E2',
    excerpt: 'Reportage immersif au cœur des dispositifs communautaires.',
    section: 'societe',
  },
  {
    id: 'a10',
    title: 'Direct radio : la matinale s\'installe à Natitingou cette semaine',
    category: 'Live', location: 'Natitingou',
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80',
    date: 'Aujourd\'hui', readTime: '2 min', color: '#0066FF',
    excerpt: 'Programme spécial avec auditeurs en plateau pendant trois jours.',
    section: 'live',
  },
  {
    id: 'a11',
    title: 'Tribune : « Donner la parole aux femmes du marché »',
    category: 'Communauté', location: 'Tribune',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
    date: 'Il y a 6h', readTime: '4 min', color: '#FF3FA4',
    excerpt: 'Une autrice invite à repenser nos manières de raconter le commerce informel.',
    section: 'communaute',
  },
  {
    id: 'a12',
    title: 'Annuaire santé : 47 nouveaux centres référencés ce mois-ci',
    category: 'Services', location: 'National',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    date: 'Il y a 1j', readTime: '3 min', color: '#1a1a1a',
    excerpt: 'Hôpitaux, dispensaires et cliniques mis à jour sur la carte.',
    section: 'services',
  },
  {
    id: 'a13',
    title: 'Reportage territoires : Sèmè-Kpodji mise sur la pêche artisanale',
    category: 'Territoires', location: 'Sèmè-Kpodji',
    image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=800&q=80',
    date: 'Il y a 4h', readTime: '7 min', color: '#FF3FA4',
    excerpt: 'Un plan local pour structurer la filière et soutenir les coopératives.',
    section: 'actu',
  },
  {
    id: 'a14',
    title: 'Stages d\'été : les secteurs qui recrutent en 2026',
    category: 'Académie', location: 'National',
    image: 'https://images.unsplash.com/photo-1742549586702-c23994895082?w=800&q=80',
    date: 'Il y a 9h', readTime: '5 min', color: '#9B51E0',
    excerpt: 'Tech, santé, agroalimentaire : où candidater dès maintenant.',
    section: 'jeunesse',
  },
  {
    id: 'a15',
    title: 'Panier de référence : ce qu\'il coûte vraiment à Calavi',
    category: 'Consommation', location: 'Calavi',
    image: 'https://images.unsplash.com/photo-1769972269606-2863e0b37535?w=800&q=80',
    date: 'Hier', readTime: '6 min', color: '#E8B21A',
    excerpt: 'Notre relevé détaillé sur 15 produits du quotidien.',
    section: 'consommation',
  },
  {
    id: 'a16',
    title: 'Conseils pratiques : ouvrir son compte mobile money sans erreur',
    category: 'Pratique', location: 'Guide',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    date: 'Il y a 3j', readTime: '4 min', color: '#FF8A00',
    excerpt: 'Étapes, pièges et astuces pour démarrer sereinement.',
    section: 'informel',
  },
  {
    id: 'a17',
    title: 'Initiative locale : un jardin partagé sur les toits d\'Saint-Michel',
    category: 'Initiative', location: 'Saint-Michel',
    image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&q=80',
    date: 'Il y a 5h', readTime: '5 min', color: '#00C853',
    excerpt: 'Quinze familles cultivent ensemble légumes, herbes et liens.',
    section: 'communaute',
  },
  {
    id: 'a18',
    title: 'Mémoire & patrimoine : les griots de Tiébissou racontent',
    category: 'Patrimoine', location: 'Tiébissou',
    image: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=800&q=80',
    date: 'Il y a 2j', readTime: '9 min', color: '#4A90E2',
    excerpt: 'Une série d\'archives sonores collectées sur deux ans.',
    section: 'societe',
  },
  {
    id: 'a19',
    title: 'Eau & assainissement : les chantiers prioritaires de l\'année',
    category: 'Santé', location: 'National',
    image: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800&q=80',
    date: 'Il y a 6h', readTime: '5 min', color: '#00C853',
    excerpt: 'Cartographie et budgets prévus dans 32 communes.',
    section: 'sante',
  },
  {
    id: 'a20',
    title: 'Émission spéciale en direct : élections municipales décryptées',
    category: 'Live', location: 'Studio',
    image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800&q=80',
    date: 'En direct', readTime: '60 min', color: '#0066FF',
    excerpt: 'Trois experts répondent à vos questions ce soir 20h.',
    section: 'live',
  },
  {
    id: 'a21',
    title: 'Diaspora béninoise : cinq porteurs de projets racontent leur retour',
    category: 'Diaspora', location: 'Diaspora',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80',
    date: 'Il y a 7h', readTime: '8 min', color: '#9B51E0',
    excerpt: 'De Dakar à Montréal en passant par Cotonou : témoignages de ceux qui rentrent investir au pays.',
    section: 'societe',
  },
  {
    id: 'a22',
    title: 'Transferts d\'argent de la diaspora : les coûts cachés à éviter',
    category: 'Économie', location: 'Diaspora',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80',
    date: 'Il y a 1j', readTime: '5 min', color: '#FF8A00',
    excerpt: 'Comparatif des solutions panafricaines pour envoyer plus, payer moins.',
    section: 'consommation',
  },
  {
    id: 'a23',
    title: 'ZLECAf : ce que le marché unique africain change pour les PME locales',
    category: 'Économie', location: 'Continent',
    image: 'https://images.unsplash.com/photo-1649299313612-48cc3493f62e?w=800&q=80',
    date: 'Il y a 2j', readTime: '7 min', color: '#00C853',
    excerpt: 'Tarifs, douanes, opportunités : le point sur la Zone de libre-échange continentale.',
    section: 'actu',
  },
  {
    id: 'a24',
    title: 'Parakou : la rénovation du grand stade entre dans sa phase finale',
    category: 'Infrastructures', location: 'Parakou',
    image: 'https://images.unsplash.com/photo-1708674286294-d0b434becea3?w=800&q=80',
    date: 'Il y a 3h', readTime: '4 min', color: '#0066FF',
    excerpt: 'Livraison prévue avant la prochaine compétition continentale.',
    section: 'actu',
  },
  {
    id: 'a25',
    title: 'Un bus 100% électrique testé sur la ligne Cadjèhoun–Plateau',
    category: 'Mobilité', location: 'Cotonou',
    image: 'https://images.unsplash.com/photo-1722452323902-ae938fa1ad66?w=800&q=80',
    date: 'Il y a 6h', readTime: '5 min', color: '#00C853',
    excerpt: 'Premier essai en conditions réelles avant un déploiement progressif.',
    section: 'actu',
  },
  {
    id: 'a26',
    title: 'Natitingou : le marché aux légumes rouvre après six mois de travaux',
    category: 'Économie locale', location: 'Natitingou',
    image: 'https://images.unsplash.com/photo-1769972269606-2863e0b37535?w=800&q=80',
    date: 'Il y a 9h', readTime: '3 min', color: '#FF8A00',
    excerpt: 'Plus de 400 commerçants reprennent leurs étals dans un site modernisé.',
    section: 'informel',
  },
  {
    id: 'a27',
    title: 'Mécaniciens informels : un nouveau statut coopératif testé à Akpakpa',
    category: 'Informel', location: 'Akpakpa',
    image: 'https://images.unsplash.com/photo-1636761358770-009ce3957519?w=800&q=80',
    date: 'Il y a 1j', readTime: '6 min', color: '#FF8A00',
    excerpt: 'Mutualisation des outils, accès au crédit, formation continue.',
    section: 'informel',
  },
  {
    id: 'a28',
    title: 'Concours d\'entrée à l\'ENA : inscriptions ouvertes jusqu\'au 30 mai',
    category: 'Opportunités', location: 'National',
    image: 'https://images.unsplash.com/photo-1742549586702-c23994895082?w=800&q=80',
    date: 'Il y a 4h', readTime: '3 min', color: '#0066FF',
    excerpt: 'Conditions d\'éligibilité, épreuves, calendrier : tout savoir.',
    section: 'opportunities',
  },
  {
    id: 'a29',
    title: 'Programme YALI : 100 jeunes leaders sélectionnés cette année',
    category: 'Opportunités', location: 'National',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80',
    date: 'Il y a 1j', readTime: '5 min', color: '#9B51E0',
    excerpt: 'Témoignages d\'anciens participants et conseils pour candidater.',
    section: 'opportunities',
  },
  {
    id: 'a30',
    title: 'Diabète : une consultation gratuite ce samedi dans 6 quartiers',
    category: 'Santé', location: 'Cotonou',
    image: 'https://images.unsplash.com/photo-1675270427967-b8f09d7c939b?w=800&q=80',
    date: 'Il y a 2h', readTime: '3 min', color: '#00C853',
    excerpt: 'Dépistage, conseils nutritionnels et accompagnement par des médecins bénévoles.',
    section: 'sante',
  },
  {
    id: 'a31',
    title: 'Mutuelles de santé : ce qui change pour les travailleurs informels',
    category: 'Santé', location: 'National',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
    date: 'Il y a 14h', readTime: '6 min', color: '#00C853',
    excerpt: 'Cotisations, prise en charge, démarches : le guide pratique.',
    section: 'sante',
  },
  {
    id: 'a32',
    title: 'Carburant, gaz, pain : la mise à jour des prix officiels du mois',
    category: 'Consommation', location: 'National',
    image: 'https://images.unsplash.com/photo-1588743645013-29487076ef7b?w=800&q=80',
    date: 'Il y a 30 min', readTime: '3 min', color: '#E8B21A',
    excerpt: 'Hausses contenues sur les produits régulés, vigilance sur le frais.',
    section: 'consommation',
  },
  {
    id: 'a33',
    title: 'Étudiants : 5 banques comparées pour ouvrir un premier compte',
    category: 'Jeunesse', location: 'Cotonou',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
    date: 'Il y a 1j', readTime: '5 min', color: '#9B51E0',
    excerpt: 'Frais, services mobiles, plafonds : notre comparatif transparent.',
    section: 'jeunesse',
  },
  {
    id: 'a34',
    title: 'Mariage et coût de la vie : comment les familles s\'adaptent',
    category: 'Société', location: 'Cotonou',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    date: 'Il y a 2j', readTime: '7 min', color: '#FF3FA4',
    excerpt: 'Cérémonies allégées, financement participatif, choix assumés.',
    section: 'societe',
  },
  {
    id: 'a35',
    title: 'Sèmè-Kpodji : le port franchit le cap du million de conteneurs',
    category: 'Économie', location: 'Sèmè-Kpodji',
    image: 'https://images.unsplash.com/photo-1758613560930-732cbc352970?w=800&q=80',
    date: 'Il y a 5h', readTime: '4 min', color: '#0066FF',
    excerpt: 'Croissance soutenue par le cacao et les nouveaux corridors logistiques.',
    section: 'actu',
  },
];

export const episodes: Episode[] = [
  {
    id: 'p1',
    title: 'Entrepreneuriat féminin : témoignages qui inspirent',
    show: 'Voix d\'Afrique', duration: '32 min', plays: '12.4k',
    image: 'https://images.unsplash.com/photo-1632800237110-f9c87acc2222?w=600&q=80',
    color: '#0066FF', section: 'informel',
  },
  {
    id: 'p2',
    title: 'Comprendre les prix du cacao en 15 minutes',
    show: 'Économie Locale', duration: '15 min', plays: '8.1k',
    image: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=600&q=80',
    color: '#FF8A00', section: 'consommation',
  },
  {
    id: 'p3',
    title: 'Innovation dans le secteur informel',
    show: 'Terrain', duration: '28 min', plays: '6.7k',
    image: 'https://images.unsplash.com/photo-1646658056871-97278a8f97ce?w=600&q=80',
    color: '#00C853', section: 'informel',
  },
  {
    id: 'p4',
    title: 'Santé mentale : libérer la parole',
    show: 'Bien-être', duration: '24 min', plays: '5.2k',
    image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&q=80',
    color: '#FF3FA4', section: 'sante',
  },
  {
    id: 'p5',
    title: 'Bourses panafricaines : décrypter les dossiers de la diaspora',
    show: 'Académie', duration: '36 min', plays: '4.9k',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80',
    color: '#9B51E0', section: 'jeunesse', premium: true,
  },
  {
    id: 'p6',
    title: 'Voix de quartiers : Calavi en 30 minutes',
    show: 'Communauté', duration: '30 min', plays: '7.8k',
    image: 'https://images.unsplash.com/photo-1761666520258-e6de315a61c5?w=600&q=80',
    color: '#FF3FA4', section: 'communaute',
  },
  {
    id: 'p7',
    title: 'Vaccins, doutes et faits : on répond aux questions',
    show: 'Santé Publique', duration: '22 min', plays: '5.6k',
    image: 'https://images.unsplash.com/photo-1612277795421-9bc7706a4a34?w=600&q=80',
    color: '#00C853', section: 'sante',
  },
  {
    id: 'p8',
    title: 'Marchés de quartier : les nouveaux usages',
    show: 'Économie Locale', duration: '19 min', plays: '3.4k',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80',
    color: '#E8B21A', section: 'consommation',
  },
  {
    id: 'p9',
    title: 'Direct : la matinale du jeudi',
    show: 'Live', duration: '90 min', plays: '14.2k',
    image: 'https://images.unsplash.com/photo-1606117331085-5760e3b58520?w=600&q=80',
    color: '#0066FF', section: 'live',
  },
  {
    id: 'p10',
    title: 'Mobilité urbaine : où en est-on à Cotonou ?',
    show: 'Société', duration: '41 min', plays: '6.0k',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80',
    color: '#4A90E2', section: 'societe',
  },
  {
    id: 'p11',
    title: 'Coopératives agricoles : retours d\'expérience',
    show: 'Terrain', duration: '34 min', plays: '4.1k',
    image: 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=600&q=80',
    color: '#00C853', section: 'informel',
  },
  {
    id: 'p12',
    title: 'CV et entretien : passer le premier tri',
    show: 'Académie', duration: '18 min', plays: '9.5k',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80',
    color: '#9B51E0', section: 'jeunesse',
  },
  {
    id: 'p13',
    title: 'Mémoire orale : récits de Abomey',
    show: 'Patrimoine', duration: '46 min', plays: '2.8k',
    image: 'https://images.unsplash.com/photo-1593696954577-ab3d39317b97?w=600&q=80',
    color: '#4A90E2', section: 'societe',
  },
  {
    id: 'p14',
    title: 'Tribune ouverte : vos messages de la semaine',
    show: 'Communauté', duration: '27 min', plays: '5.3k',
    image: 'https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=600&q=80',
    color: '#FF3FA4', section: 'communaute',
  },
  {
    id: 'p15',
    title: 'Diaspora, identités et retours : conversations panafricaines',
    show: 'Voix d\'Afrique', duration: '38 min', plays: '6.1k',
    image: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=600&q=80',
    color: '#9B51E0', section: 'societe',
  },
];

export const videos: Video[] = [
  {
    id: 'v1', title: '60 secondes pour comprendre le micro-crédit',
    type: 'Capsule', duration: '1:02',
    image: 'https://images.unsplash.com/photo-1563132337-f159f484226c?w=600&q=80',
    section: 'informel',
  },
  {
    id: 'v2', title: 'Reportage : les femmes du marché de Parakou',
    type: 'Reportage', duration: '8:45',
    image: 'https://images.unsplash.com/photo-1747214300285-a8c5f3ab0c0f?w=600&q=80',
    section: 'informel',
  },
  {
    id: 'v3', title: 'Portrait : Aïcha, fondatrice de Mama Cuisine',
    type: 'Portrait', duration: '5:20',
    image: 'https://images.unsplash.com/photo-1763739528420-bdc297ff4ec7?w=600&q=80',
    section: 'communaute',
  },
  {
    id: 'v4', title: 'Comment monter un dossier de bourse, pas à pas',
    type: 'Capsule', duration: '3:10',
    image: 'https://images.unsplash.com/photo-1626639900776-4011102c8712?w=600&q=80',
    section: 'jeunesse',
  },
  {
    id: 'v5', title: 'Mini-doc : la jeunesse de Natitingou',
    type: 'Mini-doc', duration: '12:30',
    image: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&q=80',
    section: 'jeunesse',
  },
  {
    id: 'v6', title: 'Expert : nutrition et budget familial',
    type: 'Expert', duration: '6:14',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
    section: 'sante',
  },
  {
    id: 'v7', title: 'Reportage : les marchés de nuit d\'Saint-Michel',
    type: 'Reportage', duration: '9:08',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
    section: 'consommation',
  },
  {
    id: 'v8', title: 'Capsule santé : prévenir le paludisme chez l\'enfant',
    type: 'Capsule', duration: '2:45',
    image: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?w=600&q=80',
    section: 'sante',
  },
  {
    id: 'v9', title: 'Tribune vidéo : « Notre quartier, notre voix »',
    type: 'Tribune', duration: '4:22',
    image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&q=80',
    section: 'communaute',
  },
  {
    id: 'v10', title: 'Mini-doc : artisans du textile à Parakou',
    type: 'Mini-doc', duration: '15:50',
    image: 'https://images.unsplash.com/photo-1567361808960-dec9cb578182?w=600&q=80',
    section: 'informel',
  },
  {
    id: 'v11', title: 'Direct : extraits du débat municipal',
    type: 'Live', duration: '11:18',
    image: 'https://images.unsplash.com/photo-1606117331085-5760e3b58520?w=600&q=80',
    section: 'live',
  },
  {
    id: 'v12', title: 'Capsule conso : décrypter une étiquette',
    type: 'Capsule', duration: '2:08',
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&q=80',
    section: 'consommation',
  },
  {
    id: 'v13', title: 'Société : portraits croisés de jeunes engagés',
    type: 'Reportage', duration: '7:42',
    image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&q=80',
    section: 'societe',
  },
  {
    id: 'v14', title: 'Services : comment utiliser la carte des centres',
    type: 'Tutoriel', duration: '3:55',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80',
    section: 'services',
  },
];

export interface Short {
  id: string;
  title: string;
  author: string;
  views: string;
  duration: string;
  image: string;
  section: SectionKey;
  video?: string;
}

export const shorts: Short[] = [
  {
    id: 's1', title: '« Le matin à Dantokpa »',
    author: '@aicha.diallo', views: '24.1k', duration: '0:42',
    image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&q=80',
    section: 'informel',
  },
  {
    id: 's2', title: '3 astuces pour économiser sur le marché',
    author: '@kone.fatou', views: '18.7k', duration: '0:55',
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80',
    section: 'consommation',
  },
  {
    id: 's3', title: 'Une journée avec un coursier livreur',
    author: '@yao_terrain', views: '32.4k', duration: '0:58',
    image: 'https://images.unsplash.com/photo-1667844141292-0754524d5897?w=600&q=80',
    section: 'informel',
  },
  {
    id: 's4', title: 'Le geste simple qui sauve : RCP en 60s',
    author: '@dr.aman', views: '12.9k', duration: '1:00',
    image: 'https://images.unsplash.com/photo-1755549746563-a7c0a391af36?w=600&q=80',
    section: 'sante',
  },
  {
    id: 's5', title: 'Étudiant · ma routine à Cadjèhoun',
    author: '@malick_etu', views: '9.3k', duration: '0:48',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
    section: 'jeunesse',
  },
  {
    id: 's6', title: 'Parakou en time-lapse',
    author: '@vue_217', views: '15.6k', duration: '0:36',
    image: 'https://images.unsplash.com/photo-1708674286294-d0b434becea3?w=600&q=80',
    section: 'societe',
  },
  {
    id: 's7', title: 'Recette express : alloco en 60s',
    author: '@chef_ako', views: '41.2k', duration: '1:00',
    image: 'https://images.unsplash.com/photo-1765584830351-b751c8937c75?w=600&q=80',
    section: 'consommation',
  },
  {
    id: 's8', title: '« Pourquoi je vote » · micro-trottoir',
    author: '@ippoo.terrain', views: '22.0k', duration: '0:51',
    image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&q=80',
    section: 'communaute',
  },
  {
    id: 's9', title: 'Atelier couture : le pagne qui parle',
    author: '@adjoa.style', views: '7.8k', duration: '0:44',
    image: 'https://images.unsplash.com/photo-1567361808960-dec9cb578182?w=600&q=80',
    section: 'informel',
  },
  {
    id: 's10', title: 'Sèmè-Kpodji vue du port',
    author: '@drone.225', views: '28.5k', duration: '0:39',
    image: 'https://images.unsplash.com/photo-1758613560930-732cbc352970?w=600&q=80',
    section: 'actu',
  },
];

export const opportunities: Opportunity[] = [
  {
    id: 'o1', title: 'Bourse INP-HB 2026', deadline: '15 mai', tag: 'Bourse',
    color: '#4A90E2', image: 'https://images.unsplash.com/photo-1567168544813-cc03465b4fa8?w=600&q=80',
    section: 'jeunesse',
  },
  {
    id: 'o2', title: 'Concours Jeunes Entrepreneurs', deadline: '30 mai', tag: 'Concours',
    color: '#0066FF', image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=80',
    section: 'opportunities',
  },
  {
    id: 'o3', title: 'Formation gratuite en couture', deadline: '10 mai', tag: 'Formation',
    color: '#00C853', image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80',
    section: 'opportunities',
  },
  {
    id: 'o4', title: 'Appel à projets agriculture', deadline: '22 mai', tag: 'Financement',
    color: '#E8B21A', image: 'https://images.unsplash.com/photo-1509110646989-7ca4308edb3e?w=600&q=80',
    section: 'opportunities',
  },
  {
    id: 'o5', title: 'Programme mentorat Tech 2026', deadline: '5 juin', tag: 'Mentorat',
    color: '#9B51E0', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80',
    section: 'jeunesse',
  },
  {
    id: 'o6', title: 'Subvention équipement artisans', deadline: '18 mai', tag: 'Subvention',
    color: '#FF8A00', image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&q=80',
    section: 'informel',
  },
  {
    id: 'o7', title: 'Microcrédit coopératives marché', deadline: '28 mai', tag: 'Microcrédit',
    color: '#FF3FA4', image: 'https://images.unsplash.com/photo-1573164574230-db1d5e960238?w=600&q=80',
    section: 'informel',
  },
  {
    id: 'o8', title: 'Bourse Mo Ibrahim Foundation · leadership africain', deadline: '12 juin', tag: 'Bourse',
    color: '#4A90E2', image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&q=80',
    section: 'jeunesse',
  },
  {
    id: 'o9', title: 'Incubation start-ups e-santé', deadline: '20 juin', tag: 'Incubation',
    color: '#00C853', image: 'https://images.unsplash.com/photo-1755549746563-a7c0a391af36?w=600&q=80',
    section: 'sante',
  },
  {
    id: 'o10', title: 'Concours photographie communautaire', deadline: '8 juin', tag: 'Concours',
    color: '#FF3FA4', image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80',
    section: 'communaute',
  },
  {
    id: 'o11', title: 'Programme retour diaspora · Africa Investing', deadline: '25 juin', tag: 'Diaspora',
    color: '#9B51E0', image: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=600&q=80',
    section: 'opportunities',
  },
  {
    id: 'o12', title: 'Bourse panafricaine African Leadership Academy', deadline: '30 juin', tag: 'Bourse',
    color: '#0066FF', image: 'https://images.unsplash.com/photo-1559523182-a284c3fb7cff?w=600&q=80',
    section: 'jeunesse',
  },
];

export const formatFcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
export const priceTrendPct = (p: { price: number; prev: number }) =>
  p.prev === 0 ? 0 : ((p.price - p.prev) / p.prev) * 100;

export type PriceCategory = 'cereales' | 'frais' | 'boissons' | 'epicerie' | 'energie';

export interface PriceItem {
  id: string;
  product: string;
  unit: string;
  category: PriceCategory;
  price: number;          // prix actuel en FCFA
  prev: number;           // prix de la semaine précédente
  history: number[];      // 12 dernières semaines (FCFA)
  refMin: number;         // mini observé sur 12 semaines (réseau)
  refMax: number;         // maxi observé
  markets: { name: string; price: number }[];
  source: string;
  updated: string;        // libellé d'actualisation
}

// Deterministic 12-week history seeded from base/amplitude. No randomness:
// the prices users see are stable across reloads, and any real data pulled
// from the server fully replaces this fallback.
const w = (base: number, amp: number) =>
  Array.from({ length: 12 }, (_, i) => Math.round(base + Math.sin(i / 1.7) * amp));

export const prices: PriceItem[] = [
  {
    id: 'p-riz', product: 'Riz parfumé', unit: 'kg', category: 'cereales',
    price: 635, prev: 650, history: w(640, 18), refMin: 600, refMax: 690,
    markets: [
      { name: 'Saint-Michel', price: 620 }, { name: 'Cadjèhoun', price: 660 },
      { name: 'Akpakpa', price: 625 }, { name: 'Parakou', price: 635 },
    ], source: 'Réseau IPPOO · 8 marchés', updated: 'il y a 2h',
  },
  {
    id: 'p-huile', product: 'Huile de palme', unit: 'L', category: 'epicerie',
    price: 1218, prev: 1200, history: w(1180, 35), refMin: 1100, refMax: 1280,
    markets: [
      { name: 'Saint-Michel', price: 1180 }, { name: 'Cadjèhoun', price: 1290 },
      { name: 'Akpakpa', price: 1195 }, { name: 'Parakou', price: 1210 },
    ], source: 'Réseau IPPOO · 8 marchés', updated: 'il y a 2h',
  },
  {
    id: 'p-tomate', product: 'Tomate fraîche', unit: 'kg', category: 'frais',
    price: 805, prev: 850, history: w(870, 60), refMin: 720, refMax: 1050,
    markets: [
      { name: 'Saint-Michel', price: 750 }, { name: 'Cadjèhoun', price: 920 },
      { name: 'Akpakpa', price: 780 }, { name: 'Sèmè-Kpodji', price: 770 },
    ], source: 'Réseau IPPOO · 8 marchés', updated: 'il y a 1h',
  },
  {
    id: 'p-igname', product: 'Igname', unit: 'kg', category: 'frais',
    price: 504, prev: 500, history: w(495, 22), refMin: 460, refMax: 560,
    markets: [
      { name: 'Saint-Michel', price: 480 }, { name: 'Cadjèhoun', price: 540 },
      { name: 'Parakou', price: 495 }, { name: 'Natitingou', price: 470 },
    ], source: 'Réseau IPPOO · 8 marchés', updated: 'il y a 3h',
  },
  {
    id: 'p-poisson', product: 'Poisson frais (machoiron)', unit: 'kg', category: 'frais',
    price: 2890, prev: 2800, history: w(2750, 90), refMin: 2500, refMax: 3050,
    markets: [
      { name: 'Dantokpa', price: 2750 }, { name: 'Cadjèhoun', price: 3050 },
      { name: 'Sèmè-Kpodji', price: 2650 }, { name: 'Saint-Michel', price: 2900 },
    ], source: 'Marché de gros · pêche artisanale', updated: 'il y a 30 min',
  },
  {
    id: 'p-pain', product: 'Pain (baguette 250g)', unit: 'unité', category: 'cereales',
    price: 200, prev: 200, history: Array(12).fill(200), refMin: 200, refMax: 200,
    markets: [
      { name: 'Cotonou', price: 200 }, { name: 'Parakou', price: 200 },
      { name: 'Porto-Novo', price: 200 }, { name: 'Sèmè-Kpodji', price: 200 },
    ], source: 'Prix réglementé · Conseil National', updated: 'il y a 1j',
  },
  {
    id: 'p-lait', product: 'Lait en poudre', unit: '500 g', category: 'epicerie',
    price: 938, prev: 950, history: w(945, 18), refMin: 900, refMax: 990,
    markets: [
      { name: 'Saint-Michel', price: 920 }, { name: 'Cadjèhoun', price: 980 },
      { name: 'Akpakpa', price: 930 }, { name: 'Parakou', price: 935 },
    ], source: 'Réseau IPPOO · 8 marchés', updated: 'il y a 2h',
  },
  {
    id: 'p-sucre', product: 'Sucre cristallisé', unit: 'kg', category: 'epicerie',
    price: 768, prev: 750, history: w(745, 16), refMin: 720, refMax: 790,
    markets: [
      { name: 'Saint-Michel', price: 745 }, { name: 'Cadjèhoun', price: 790 },
      { name: 'Akpakpa', price: 760 }, { name: 'Parakou', price: 760 },
    ], source: 'Réseau IPPOO · 8 marchés', updated: 'il y a 2h',
  },
  {
    id: 'p-gaz', product: 'Bouteille gaz butane', unit: '6 kg', category: 'energie',
    price: 2000, prev: 2000, history: Array(12).fill(2000), refMin: 2000, refMax: 2000,
    markets: [
      { name: 'Cotonou', price: 2000 }, { name: 'Parakou', price: 2000 },
      { name: 'Sèmè-Kpodji', price: 2000 }, { name: 'Natitingou', price: 2000 },
    ], source: 'Prix subventionné · État', updated: 'stable',
  },
  {
    id: 'p-essence', product: 'Essence super', unit: 'L', category: 'energie',
    price: 875, prev: 875, history: [855, 855, 855, 870, 870, 870, 870, 875, 875, 875, 875, 875],
    refMin: 855, refMax: 875,
    markets: [
      { name: 'Cotonou', price: 875 }, { name: 'Parakou', price: 875 },
      { name: 'Porto-Novo', price: 875 }, { name: 'Sèmè-Kpodji', price: 875 },
    ], source: 'PETROCI · barème national', updated: 'il y a 3j',
  },
  {
    id: 'p-banane', product: 'Banane plantain', unit: 'kg', category: 'frais',
    price: 410, prev: 430, history: w(420, 25), refMin: 360, refMax: 480,
    markets: [
      { name: 'Saint-Michel', price: 380 }, { name: 'Cadjèhoun', price: 460 },
      { name: 'Sèmè-Kpodji', price: 390 }, { name: 'Abomey', price: 400 },
    ], source: 'Réseau IPPOO · 8 marchés', updated: 'il y a 2h',
  },
  {
    id: 'p-cacao', product: 'Fève de cacao (bord-champ)', unit: 'kg', category: 'cereales',
    price: 1800, prev: 1750, history: [1500, 1550, 1600, 1620, 1650, 1680, 1700, 1720, 1740, 1750, 1770, 1800],
    refMin: 1500, refMax: 1800,
    markets: [
      { name: 'Abomey', price: 1810 }, { name: 'Sèmè-Kpodji', price: 1820 },
      { name: 'Soubré', price: 1790 }, { name: 'Divo', price: 1780 },
    ], source: 'Conseil Café-Cacao · campagne 2025-26', updated: 'il y a 6h',
  },
];

export const inflationSeries = [
  { month: 'Mai', cpi: 102.4 },
  { month: 'Juin', cpi: 102.9 },
  { month: 'Juil', cpi: 103.2 },
  { month: 'Août', cpi: 103.6 },
  { month: 'Sept', cpi: 104.1 },
  { month: 'Oct', cpi: 104.4 },
  { month: 'Nov', cpi: 104.8 },
  { month: 'Déc', cpi: 105.3 },
  { month: 'Jan', cpi: 105.7 },
  { month: 'Fév', cpi: 106.1 },
  { month: 'Mar', cpi: 106.4 },
  { month: 'Avr', cpi: 106.7 },
];

export const panierMenager = {
  label: 'Panier ménager hebdo',
  current: 28450,
  prev: 28980,
  composition: [
    { name: 'Céréales', value: 7800, color: '#0066FF' },
    { name: 'Frais', value: 9200, color: '#00C853' },
    { name: 'Épicerie', value: 5400, color: '#FF8A00' },
    { name: 'Énergie', value: 3500, color: '#FF3FA4' },
    { name: 'Boissons', value: 2550, color: '#B57CFF' },
  ],
};

export const rubriques = [
  { id: 'r1', name: 'Économie locale', icon: 'TrendingUp', color: '#FF8A00', bg: '#FFE9D4', count: 142 },
  { id: 'r2', name: 'Emploi & Formation', icon: 'Briefcase', color: '#4A90E2', bg: '#DFF0FF', count: 89 },
  { id: 'r3', name: 'Santé & Bien-être', icon: 'Heart', color: '#00C853', bg: '#D4F4E0', count: 67 },
  { id: 'r4', name: 'Éducation & Jeunesse', icon: 'GraduationCap', color: '#FF3FA4', bg: '#FFE0F2', count: 54 },
  { id: 'r5', name: 'Société & Communauté', icon: 'Users', color: '#0066FF', bg: '#FFE5E3', count: 98 },
  { id: 'r6', name: 'Culture & Territoires', icon: 'Globe', color: '#E8B21A', bg: '#FFF6D9', count: 73 },
];
