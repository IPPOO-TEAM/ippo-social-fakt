import { ImageWithFallback } from '../figma/ImageWithFallback';
import { ChevronLeft, Share2, Bookmark, MapPin, Clock } from 'lucide-react';
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
 {/* Corps RÉEL de l'article saisi en back-office. Aucun texte fictif. */}
 {article.body && article.body.trim() ? (
   article.body.split(/\n{2,}/).map((para, i) => {
     const trimmed = para.trim();
     if (!trimmed) return null;
     // Marqueur Markdown léger : `# ` → titre, `> ` → citation, sinon paragraphe.
     if (trimmed.startsWith('# ')) {
       return (
         <h2 key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#1a1a1a', letterSpacing: '-0.015em', marginTop: '0.5rem' }}>
           {trimmed.slice(2)}
         </h2>
       );
     }
     if (trimmed.startsWith('> ')) {
       return (
         <blockquote key={i} className="pl-5 py-3 my-2" style={{ borderLeft: `4px solid ${article.color}`, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '1.08rem', color: '#1a1a1a', lineHeight: 1.45, letterSpacing: '-0.005em' }}>
           {trimmed.slice(2)}
         </blockquote>
       );
     }
     return (
       <p key={i} className="text-[#1a1a1a]/85" style={{ fontSize: '0.95rem', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
         {trimmed}
       </p>
     );
   })
 ) : (
   <div className="text-[#717182] py-6 text-center" style={{ fontSize: '0.88rem' }}>
     Le contenu complet de cet article sera bientôt disponible.
   </div>
 )}

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
