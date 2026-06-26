// Encarts par défaut du carrousel publicitaire IPPOO Social-Fact.
// Ces images sont fournies par la marque ; chaque encart porte une accroche
// « cadrée » (brand + title + cta). Servent à :
//   1) remplir le carrousel immédiatement (repli si le serveur n'a rien),
//   2) être synchronisés/persistés côté serveur en un clic depuis /admin/ads.
// Une fois synchronisés, ils deviennent pleinement éditables et persistants.
import type { Ad } from '../admin/AdminAds';

import imgMode from '../../imports/trois-femmes-africaines-choisissent-vetements-lors-journee-magasinage_926199-2565282.jpg';
import imgLivraison from '../../imports/sourire-male-africain-courrier-livreur-messager-devant-voiture-livraison-colis_73622-995-1280x720.jpg';
import imgSmsPro from '../../imports/SMS-PRO__2_.jpg';
import imgAsso from '../../imports/SLIDER_ASSO_TCHE-03__2_.jpeg';
import imgPromo1 from '../../imports/images__9_.png';
import imgPromo2 from '../../imports/images_-_2026-04-10T163945.322.jpeg';
import imgPromo3 from '../../imports/images_-_2026-04-10T162222.523__2_.jpeg';

export const DEFAULT_ADS: Ad[] = [
  {
    id: 'ad-default-mode',
    brand: 'IPPOO Market',
    title: 'Mode & tendances : habillez-vous malin à Cotonou',
    cta: 'Découvrir la boutique',
    url: '/services',
    image: imgMode,
    tone: '#FF3FA4',
    published: true,
    order: 1,
  },
  {
    id: 'ad-default-livraison',
    brand: 'IPPOO Express',
    title: 'Livraison de colis partout au Bénin, en un clic',
    cta: 'Commander une course',
    url: '/services',
    image: imgLivraison,
    tone: '#0066FF',
    published: true,
    order: 2,
  },
  {
    id: 'ad-default-smspro',
    brand: 'SMS Pro',
    title: 'Touchez vos clients par SMS groupés en temps réel',
    cta: 'Activer mon offre',
    url: '/services',
    image: imgSmsPro,
    tone: '#00C853',
    published: true,
    order: 3,
  },
  {
    id: 'ad-default-asso',
    brand: 'Tchè Solidarité',
    title: 'Rejoignez les associations qui font bouger le Bénin',
    cta: 'En savoir plus',
    url: '/services',
    image: imgAsso,
    tone: '#9B51E0',
    published: true,
    order: 4,
  },
  {
    id: 'ad-default-promo1',
    brand: 'IPPOO Premium',
    title: 'Passez Premium dès 1 000 FCFA/mois · Mobile Money',
    cta: 'Profiter de l’offre',
    url: '/pricing',
    image: imgPromo1,
    tone: '#E8B21A',
    published: true,
    order: 5,
  },
  {
    id: 'ad-default-promo2',
    brand: 'IPPOO Services',
    title: 'Tous vos services du quotidien, réunis au même endroit',
    cta: 'Explorer',
    url: '/services',
    image: imgPromo2,
    tone: '#FF8A00',
    published: true,
    order: 6,
  },
  {
    id: 'ad-default-promo3',
    brand: 'IPPOO Social-Fact',
    title: 'L’actu, les podcasts et les opportunités du Bénin',
    cta: 'Ouvrir l’app',
    url: '/',
    image: imgPromo3,
    tone: '#1a1a1a',
    published: true,
    order: 7,
  },
];
