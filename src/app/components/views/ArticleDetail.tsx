import { ImageWithFallback } from '../figma/ImageWithFallback';
import { ChevronLeft, Share2, Bookmark, MapPin, Clock, Type } from 'lucide-react';
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useFavorites, useHistory, useViewCount } from '../../lib/storage';
import { Comments } from '../Comments';
import { ReactionBar } from '../ReactionBar';
import { useT } from '../../lib/i18n';
import { useContentT } from '../../data/mock_translations';
import { useSubscription } from '../../lib/subscription';
import { useNavigate } from 'react-router';
import { Paywall } from '../Paywall';

interface Article {
 id: string;
 title: string;
 category: string;
 location: string;
 image: string;
 date: string;
 readTime: string;
 color: string;
 excerpt: string;
}

interface Props {
 article: Article;
 onBack: () => void;
}

export function ArticleDetail({ article, onBack }: Props) {
 const t = useT();
 const tc = useContentT();
 const title = tc.article(article.id, 'title', article.title);
 const category = tc.article(article.id, 'category', article.category);
 const date = tc.article(article.id, 'date', article.date);
 const readTime = tc.article(article.id, 'readTime', article.readTime);
 const excerpt = tc.article(article.id, 'excerpt', article.excerpt);
 const { isPremium } = useSubscription();
 const navigate = useNavigate();
 const locked = !!article.premium && !isPremium;
 const { has, toggle } = useFavorites();
 const { push } = useHistory();
 const saved = has(article.id);
 useViewCount(`article:${article.id}`);

 useEffect(() => {
 push({ id: article.id, kind: 'article', title: article.title, image: article.image, meta: article.category });
 }, [article.id]);

 return (
 <motion.div
 initial={{ y: '100%', opacity: 0.6 }}
 animate={{ y: 0, opacity: 1 }}
 exit={{ y: '100%', opacity: 0.4 }}
 transition={{ type: 'spring', damping: 32, stiffness: 320 }}
 className="fixed inset-0 z-[60] bg-white overflow-y-auto overscroll-contain max-w-2xl mx-auto">
 <div className="relative">
 <div className="relative aspect-[4/5] sm:aspect-[16/10]">
 <ImageWithFallback src={article.image} alt={article.title} className="w-full h-full object-cover"/>
 <div className="absolute inset-0 bg-black/45"/>

 <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
 <button onClick={onBack} className="w-10 h-10 bg-white/95 backdrop-blur flex items-center justify-center" aria-label={t('common.back')}>
 <ChevronLeft size={20} className="text-[#1a1a1a]"/>
 </button>
 <div className="flex gap-2">
 <button onClick={async () => {
 const text = `${article.title} · IPPOO`;
 if (navigator.share) { try { await navigator.share({ title: article.title, text }); } catch {} }
 else if (navigator.clipboard) { navigator.clipboard.writeText(text); }
 }} className="w-10 h-10 bg-white/95 backdrop-blur flex items-center justify-center" aria-label={t('common.share')}>
 <Share2 size={17} className="text-[#1a1a1a]"/>
 </button>
 <button
 onClick={() => toggle({ id: article.id, kind: 'article', title: article.title, image: article.image, meta: article.category })}
 className={`w-10 h-10 backdrop-blur flex items-center justify-center ${saved ? 'bg-[#0066FF]' : 'bg-white/95'}`}
 aria-label={t('sheet.favorite')}
 >
 <Bookmark size={17} className={saved ? 'text-white fill-white' : 'text-[#1a1a1a]'} />
 </button>
 </div>
 </div>

 <div className="absolute bottom-5 left-5 right-5">
 <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3" style={{ background: article.color, fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: 'white', letterSpacing: '0.1em' }}>
 {category.toUpperCase()}
 </div>
 <h1 className="text-white" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 5vw, 2rem)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
 {title}
 </h1>
 </div>
 </div>

 <div className="px-5 py-5 flex items-center gap-4 text-[#717182] border-b border-[#F0F0F0]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem' }}>
 <span className="flex items-center gap-1"><MapPin size={13} /> {article.location}</span>
 <span>·</span>
 <span className="flex items-center gap-1"><Clock size={13} /> {readTime}</span>
 <span>·</span>
 <span>{date}</span>
 </div>

 <article className="px-5 py-6 space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>
 <p className="text-[#1a1a1a]" style={{ fontSize: '1.1rem', lineHeight: 1.55, fontWeight: 600, letterSpacing: '-0.005em' }}>
 {excerpt}
 </p>

 {locked && (
 <Paywall
 title="Article réservé aux Premium"
 message="Soutenez la rédaction et lisez l'article complet."
 onUpgrade={() => navigate('/pricing')}
 />
 )}

 {!locked && <>
 <p className="text-[#1a1a1a]/85" style={{ fontSize: '0.95rem', lineHeight: 1.75 }}>
 À <strong>{article.location}</strong>, l'évolution observée sur le terrain confirme une tendance plus large
 que la rédaction d'IPPOO suit depuis plusieurs semaines. Au-delà des chiffres, ce sont les habitudes des
 ménages, l'organisation des acteurs économiques et la place laissée aux initiatives communautaires qui se
 redessinent en profondeur, souvent loin des projecteurs nationaux.
 </p>

 <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#1a1a1a', letterSpacing: '-0.015em', marginTop: '0.5rem' }}>
 Ce qui se joue concrètement
 </h2>
 <p className="text-[#1a1a1a]/85" style={{ fontSize: '0.95rem', lineHeight: 1.75 }}>
 Les acteurs locaux interrogés décrivent une dynamique nouvelle. Les commerçants, regroupés en coopératives
 ou en associations de quartier, ont mutualisé leurs achats pour négocier de meilleurs tarifs auprès des
 grossistes. En parallèle, les ménages, premiers concernés, adaptent leurs paniers d'achat au plus près,
 arbitrant entre produits locaux, importés et alternatives saisonnières. Plusieurs <em>bonnes pratiques</em>
 se diffusent désormais d'un quartier à l'autre, portées par les radios communautaires et les groupes WhatsApp
 de voisinage qui jouent un rôle d'agrégateur d'information.
 </p>

 <blockquote className="pl-5 py-3 my-2" style={{ borderLeft: `4px solid ${article.color}`, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '1.08rem', color: '#1a1a1a', lineHeight: 1.45, letterSpacing: '-0.005em' }}>
 « Cette approche collective change la donne pour nos familles et redonne de la fierté à nos métiers. Nous
 voyons enfin que ce que nous faisons compte, et que d'autres veulent reproduire ce que nous avons réussi
 à construire ici. »
 <span className="block mt-2 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 500 }}>
 Témoignage recueilli sur place
 </span>
 </blockquote>

 <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#1a1a1a', letterSpacing: '-0.015em' }}>
 Les chiffres qui comptent
 </h2>
 <p className="text-[#1a1a1a]/85" style={{ fontSize: '0.95rem', lineHeight: 1.75 }}>
 Les premières estimations partagées par les organisations de terrain font état d'un effet visible dès les
 premières semaines : économies pour les ménages, hausse modérée des volumes échangés, meilleure visibilité
 pour les producteurs. Les structures d'appui (ONG, mutuelles, plateformes coopératives) soulignent que la
 réussite repose sur trois conditions claires : <strong>la transparence sur les prix</strong>, <strong>la
 régularité de l'approvisionnement</strong>, et <strong>un accompagnement de proximité</strong> pour les
 nouveaux entrants. Sans ces trois piliers, les gains restent fragiles et concentrés sur les acteurs déjà
 organisés.
 </p>

 <div className="grid grid-cols-3 gap-2.5 my-2">
 {[
 { label: 'Quartiers concernés', value: '12+', tone: '#0066FF' },
 { label: 'Acteurs mobilisés', value: '230', tone: article.color },
 { label: 'Évolution sur 30 j', value: '+18 %', tone: '#00C853' },
 ].map((k) => (
 <div key={k.label} className="bg-[#FAFAFA] p-3" style={{ borderRadius: 'var(--r-md)' }}>
 <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: k.tone, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
 {k.value}
 </div>
 <div className="text-[#717182] mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', lineHeight: 1.3 }}>
 {k.label}
 </div>
 </div>
 ))}
 </div>

 <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#1a1a1a', letterSpacing: '-0.015em' }}>
 Vers une suite plus large ?
 </h2>
 <p className="text-[#1a1a1a]/85" style={{ fontSize: '0.95rem', lineHeight: 1.75 }}>
 Les autorités locales saluent l'initiative et étudient la possibilité de l'étendre à d'autres communes.
 Plusieurs structures d'accompagnement se sont déjà manifestées pour former de nouveaux porteurs de projets
 dans les mois à venir. La rédaction d'IPPOO continuera de suivre ce dossier sur les prochaines semaines,
 avec des reportages sonores et vidéo dans les quartiers concernés. Si vous êtes acteur de cette dynamique,
 vous pouvez écrire à la rédaction pour partager votre expérience, c'est ce qui permet à ce type d'enquête
 de rester ancrée dans le réel.
 </p>

 <p className="text-[#1a1a1a]/85" style={{ fontSize: '0.95rem', lineHeight: 1.75 }}>
 À plus long terme, plusieurs questions restent ouvertes : la capacité à <em>maintenir la dynamique</em>
 quand l'attention médiatique retombe, la solidité des modèles économiques face aux chocs externes, et
 surtout l'inclusion des publics les plus éloignés des circuits d'information. C'est précisément sur ces
 angles morts que la rédaction concentrera ses prochaines enquêtes.
 </p>

 <div className="bg-[#FAFAFA] p-4 flex items-start gap-3" style={{ borderRadius: 'var(--r-md)' }}>
 <Type size={18} className="text-[#0066FF] mt-0.5 flex-shrink-0"/>
 <div>
 <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>
 {t('sheet.takeaway')}
 </div>
 <ul className="text-[#1a1a1a]/85 mt-2 space-y-1.5" style={{ fontSize: '0.85rem', lineHeight: 1.5, listStyle: 'disc', paddingLeft: '1.1rem' }}>
 <li>Une dynamique territoriale concrète, mesurable et reproductible.</li>
 <li>Trois conditions de réussite : transparence, régularité, accompagnement.</li>
 <li>Un suivi prolongé par la rédaction sur les prochaines semaines.</li>
 </ul>
 </div>
 </div>

 <div className="text-[#717182] pt-2 flex items-center gap-2 border-t border-[#F0F0F0]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
 <span className="w-1.5 h-1.5 bg-[#00C853]" style={{ borderRadius: 999 }}/>
 {t('sheet.report_by')} · {article.location} · {article.date}
 </div>
 </>}
 </article>
 <div className="px-5 pb-2">
 <ReactionBar targetId={article.id} accent={article.color}/>
 </div>
 <div className="px-5 pt-4 pb-6">
 <Comments targetId={article.id} accent={article.color}/>
 </div>
 <div style={{ height: 'calc(120px + env(safe-area-inset-bottom))' }}/>
 </div>
 </motion.div>
 );
}
