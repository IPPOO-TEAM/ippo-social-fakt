import {
  HeartPulse, Users, Scale, Package, Calculator, FileText,
  Wallet, Baby, GraduationCap, Wrench, Handshake, Truck,
  type LucideIcon,
} from 'lucide-react';

export interface Assurance {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  pricePerMonth: number;
  pricePerYear: number;
  hero: string;
  description: string;
  coverage: string[];
  audience: string[];
  benefits: { title: string; description: string }[];
  partners: string[];
}

export const assurances: Assurance[] = [
  {
    id: 'as-sante', slug: 'sante',
    name: 'IPPOO Santé',
    tagline: 'Soins de base, consultations et pharmacie',
    icon: HeartPulse, color: '#00C853', bg: '#D4F4E0',
    pricePerMonth: 1500, pricePerYear: 15000,
    hero: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=1200&q=80',
    description: "Couverture santé essentielle pour vous et votre famille : consultations chez les médecins partenaires, médicaments génériques, examens de base et urgences.",
    coverage: [
      'Consultations généralistes illimitées',
      'Pharmacie : médicaments essentiels remboursés à 80%',
      'Examens biologiques courants',
      'Hospitalisation jusqu\'à 500 000 FCFA / an',
      'Téléconsultation 24h/24',
    ],
    audience: ['Travailleurs informels', 'Familles', 'Étudiants'],
    benefits: [
      { title: 'Réseau étendu', description: '120+ centres de santé partenaires en Côte d\'Ivoire' },
      { title: 'Tiers payant', description: 'Pas d\'avance de frais chez les partenaires' },
      { title: 'Famille incluse', description: 'Conjoint et enfants à -50%' },
    ],
    partners: ['CNAM', 'Pharmacies du Réseau IPPOO', 'Polycliniques agréées'],
  },
  {
    id: 'as-sociale', slug: 'sociale',
    name: 'Sociale & RC',
    tagline: 'Responsabilité civile et événements de la vie',
    icon: Users, color: '#0066FF', bg: '#DFF0FF',
    pricePerMonth: 800, pricePerYear: 8000,
    hero: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
    description: "Protection sociale pour faire face aux événements imprévus : décès, mariage, baptême, accidents domestiques causés à autrui.",
    coverage: [
      'Capital décès jusqu\'à 1 000 000 FCFA',
      'Indemnité naissance / mariage',
      'Responsabilité civile vie privée',
      'Accident corporel jusqu\'à 500 000 FCFA',
    ],
    audience: ['Tout public', 'Chefs de famille'],
    benefits: [
      { title: 'Soutien immédiat', description: 'Versement sous 72h après dossier complet' },
      { title: 'Cotisation flexible', description: 'Mensuelle, trimestrielle ou annuelle' },
    ],
    partners: ['NSIA Assurances', 'SUNU Assurances'],
  },
  {
    id: 'as-juridique', slug: 'juridique',
    name: 'Juridique',
    tagline: 'Conseil et défense devant les juridictions',
    icon: Scale, color: '#9B51E0', bg: '#EFE4FF',
    pricePerMonth: 1200, pricePerYear: 12000,
    hero: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=1200&q=80',
    description: "Accès à des avocats et juristes pour vous défendre dans les litiges du quotidien : conflits commerciaux, baux, litiges familiaux, droit du travail.",
    coverage: [
      'Consultation juridique illimitée par téléphone',
      'Rédaction d\'actes simples',
      'Représentation devant les tribunaux civils et commerciaux',
      'Médiation et règlement amiable',
    ],
    audience: ['Commerçants', 'Artisans', 'Locataires', 'Salariés'],
    benefits: [
      { title: 'Réseau d\'avocats', description: '40 cabinets partenaires sur le territoire' },
      { title: 'Honoraires plafonnés', description: 'Pas de mauvaise surprise sur la facture' },
    ],
    partners: ['Ordre des Avocats', 'Associations de juristes'],
  },
  {
    id: 'as-marchandises', slug: 'marchandises',
    name: 'Marchandises',
    tagline: 'Stocks, étals et matériel commerçant',
    icon: Package, color: '#FF8A00', bg: '#FFE9D4',
    pricePerMonth: 2000, pricePerYear: 20000,
    hero: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&q=80',
    description: "Garantie pour les commerçants du marché : vol, incendie, dégâts des eaux, casse accidentelle de votre stock et de vos équipements.",
    coverage: [
      'Vol et tentative de vol jusqu\'à 2 000 000 FCFA',
      'Incendie et explosion',
      'Dégâts des eaux',
      'Bris d\'étalage et casse',
      'Pertes financières directes',
    ],
    audience: ['Commerçants de marché', 'Boutiquiers', 'Étalagistes'],
    benefits: [
      { title: 'Inventaire annuel', description: 'Évaluation gratuite de votre stock' },
      { title: 'Indemnisation rapide', description: 'Sous 7 jours après expertise' },
    ],
    partners: ['NSIA', 'Allianz CI'],
  },
  {
    id: 'as-comptable', slug: 'comptable',
    name: 'Comptable & Fiscale',
    tagline: 'Tenue de comptes et accompagnement fiscal',
    icon: Calculator, color: '#4A90E2', bg: '#DFF0FF',
    pricePerMonth: 2500, pricePerYear: 25000,
    hero: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80',
    description: "Externalisez votre comptabilité et la gestion de vos déclarations fiscales. Un expert dédié suit votre activité et vous met en règle.",
    coverage: [
      'Tenue de la comptabilité mensuelle',
      'Déclarations TVA, ITS, BIC',
      'Bilans annuels',
      'Conseil en optimisation fiscale',
      'Représentation lors de contrôles',
    ],
    audience: ['Auto-entrepreneurs', 'PME', 'Coopératives'],
    benefits: [
      { title: 'Expert dédié', description: 'Un comptable identifié pour votre dossier' },
      { title: 'Outils numériques', description: 'Tableau de bord en ligne, factures dématérialisées' },
    ],
    partners: ['Ordre des Experts-Comptables', 'DGI'],
  },
  {
    id: 'as-administrative', slug: 'administrative',
    name: 'Administrative',
    tagline: 'Démarches et papiers officiels',
    icon: FileText, color: '#1a1a1a', bg: '#F0F0F4',
    pricePerMonth: 600, pricePerYear: 6000,
    hero: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80',
    description: "Un assistant pour toutes vos démarches administratives : carte d'identité, passeport, immatriculation, certificats, agréments commerciaux.",
    coverage: [
      'Constitution de dossiers',
      'Suivi auprès des administrations',
      'Renouvellement de documents officiels',
      'Légalisations et apostilles',
    ],
    audience: ['Tout public', 'Diaspora'],
    benefits: [
      { title: 'Gain de temps', description: 'Vous évite les files d\'attente' },
      { title: 'Suivi numérique', description: 'État d\'avancement en temps réel' },
    ],
    partners: ['CNRA', 'Mairies partenaires'],
  },
  {
    id: 'as-retraite', slug: 'retraite',
    name: 'Retraite',
    tagline: 'Épargne longue et rente complémentaire',
    icon: Wallet, color: '#E8B21A', bg: '#FFF6D9',
    pricePerMonth: 5000, pricePerYear: 50000,
    hero: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80',
    description: "Constituez votre capital retraite à votre rythme. Rente versée à partir de 55 ans, capital récupérable en cas de coup dur.",
    coverage: [
      'Versements libres ou programmés',
      'Capitalisation garantie',
      'Sortie en rente ou en capital',
      'Réversion conjoint',
      'Avance possible après 5 ans',
    ],
    audience: ['Travailleurs informels', 'Indépendants', 'Diaspora'],
    benefits: [
      { title: 'Sécurité', description: 'Fonds gérés par des partenaires agréés CIMA' },
      { title: 'Souplesse', description: 'Modulez vos versements selon vos revenus' },
    ],
    partners: ['NSIA Vie', 'SUNU Vie', 'CIMA'],
  },
  {
    id: 'as-maternite', slug: 'maternite',
    name: 'Maternité',
    tagline: 'Suivi de grossesse, accouchement et nouveau-né',
    icon: Baby, color: '#FF3FA4', bg: '#FFE0F2',
    pricePerMonth: 1800, pricePerYear: 18000,
    hero: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
    description: "Accompagnement complet pour la maternité : consultations prénatales, accouchement, suivi du nouveau-né, indemnité de naissance.",
    coverage: [
      'Consultations prénatales (8 visites)',
      'Échographies et bilans',
      'Accouchement à la maternité partenaire',
      'Hospitalisation mère et enfant',
      'Indemnité naissance 100 000 FCFA',
    ],
    audience: ['Femmes enceintes', 'Couples'],
    benefits: [
      { title: 'Sage-femme dédiée', description: 'Suivi personnalisé du début à la fin' },
      { title: 'Vaccinations bébé', description: 'Programme PEV pris en charge la 1re année' },
    ],
    partners: ['Maternités du Réseau IPPOO', 'Ministère de la Santé'],
  },
  {
    id: 'as-education', slug: 'education',
    name: 'Éducation',
    tagline: 'Frais de scolarité et fournitures',
    icon: GraduationCap, color: '#9B51E0', bg: '#EFE4FF',
    pricePerMonth: 3000, pricePerYear: 30000,
    hero: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=1200&q=80',
    description: "Sécurisez la scolarité de vos enfants. Versement annuel garanti pour la rentrée, prise en charge en cas d'imprévu familial.",
    coverage: [
      'Capital rentrée scolaire (jusqu\'à 200 000 FCFA / enfant)',
      'Maintien des versements en cas de décès du souscripteur',
      'Bourse mérite annuelle',
      'Réduction sur fournitures partenaires',
    ],
    audience: ['Parents', 'Tuteurs'],
    benefits: [
      { title: 'Garantie rentrée', description: 'Capital débloqué automatiquement en septembre' },
      { title: 'Continuité éducative', description: 'Études poursuivies même en cas de coup dur' },
    ],
    partners: ['Écoles privées agréées', 'Librairies partenaires'],
  },
  {
    id: 'as-equipement', slug: 'equipement',
    name: 'Équipement',
    tagline: 'Outils, machines et matériel professionnel',
    icon: Wrench, color: '#FF8A00', bg: '#FFE9D4',
    pricePerMonth: 1500, pricePerYear: 15000,
    hero: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1200&q=80',
    description: "Protégez vos outils de travail : machines à coudre, motos, fours, congélateurs, outils de mécanicien, équipement de coiffure.",
    coverage: [
      'Vol et casse accidentelle',
      'Panne mécanique et dépannage',
      'Remplacement à neuf < 2 ans',
      'Indemnité d\'arrêt d\'activité',
    ],
    audience: ['Artisans', 'Coiffeurs', 'Mécaniciens', 'Tailleurs'],
    benefits: [
      { title: 'Réparation prioritaire', description: 'Réseau de réparateurs agréés' },
      { title: 'Activité préservée', description: 'Indemnité jusqu\'à reprise du travail' },
    ],
    partners: ['Ateliers partenaires', 'NSIA'],
  },
  {
    id: 'as-cooperative', slug: 'cooperative',
    name: 'Coopérative',
    tagline: 'Couverture collective pour groupements',
    icon: Handshake, color: '#00C853', bg: '#D4F4E0',
    pricePerMonth: 10000, pricePerYear: 100000,
    hero: 'https://images.unsplash.com/photo-1573164574230-db1d5e960238?w=1200&q=80',
    description: "Protection mutualisée pour coopératives, GIE et associations. Une cotisation collective qui couvre l'ensemble des membres.",
    coverage: [
      'Couverture santé groupe (jusqu\'à 50 membres)',
      'Responsabilité civile collective',
      'Assurance des biens communs',
      'Caution solidaire pour microcrédit',
    ],
    audience: ['Coopératives agricoles', 'GIE', 'Tontines formalisées'],
    benefits: [
      { title: 'Tarif dégressif', description: 'Plus le groupe est grand, plus le coût par tête baisse' },
      { title: 'Gouvernance', description: 'Outils de gestion mutualisée fournis' },
    ],
    partners: ['CNCAS', 'Ministère de l\'Agriculture'],
  },
  {
    id: 'as-transport', slug: 'transport',
    name: 'Transport',
    tagline: 'Véhicules, motos et trajets professionnels',
    icon: Truck, color: '#0066FF', bg: '#DFF0FF',
    pricePerMonth: 2200, pricePerYear: 22000,
    hero: 'https://images.unsplash.com/photo-1722452323902-ae938fa1ad66?w=1200&q=80',
    description: "Couverture pour conducteurs de taxi, woro-woro, gbaka, motos-taxis et coursiers. RC obligatoire et garanties complémentaires.",
    coverage: [
      'Responsabilité civile (obligatoire)',
      'Dommages au véhicule',
      'Vol et incendie',
      'Indemnité conducteur en cas d\'accident',
      'Assistance dépannage 24h/24',
    ],
    audience: ['Taxis', 'Woro-woro', 'Gbaka', 'Livreurs moto'],
    benefits: [
      { title: 'RC en règle', description: 'Carte verte numérique disponible immédiatement' },
      { title: 'Réseau de garages', description: '60 garages partenaires sur le territoire' },
    ],
    partners: ['SAA', 'NSIA', 'Coopératives de transport'],
  },
];

export function findAssurance(slug: string) {
  return assurances.find((a) => a.slug === slug);
}
