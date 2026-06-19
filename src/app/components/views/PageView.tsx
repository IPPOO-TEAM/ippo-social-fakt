import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { usePublicPage } from '../../lib/admin-overrides';

function renderMarkdown(src: string): string {
  // Minimal safe Markdown: escape HTML, then transform headings, bold, italics, paragraphs, lists.
  const esc = src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = esc.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;

  const flushList = () => { if (inList) { out.push('</ul>'); inList = false; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^### /.test(line)) { flushList(); out.push(`<h3>${line.slice(4)}</h3>`); continue; }
    if (/^## /.test(line))  { flushList(); out.push(`<h2>${line.slice(3)}</h2>`); continue; }
    if (/^# /.test(line))   { flushList(); out.push(`<h1>${line.slice(2)}</h1>`); continue; }
    if (/^[-*] /.test(line)) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inlineFormat(line.slice(2))}</li>`);
      continue;
    }
    if (line.trim() === '') { flushList(); out.push(''); continue; }
    flushList();
    out.push(`<p>${inlineFormat(line)}</p>`);
  }
  flushList();
  return out.join('\n');
}

function inlineFormat(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export function PageView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const page = usePublicPage(slug);

  if (!page) {
    throw new Response('Page introuvable', { status: 404 });
  }

  const html = renderMarkdown(page.body);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[55] bg-white max-w-2xl mx-auto overflow-y-auto"
    >
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-[#F0F0F0] px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-[#FAFAFA] flex items-center justify-center" aria-label="Retour" style={{ borderRadius: 10 }}>
          <ChevronLeft size={20} className="text-[#1a1a1a]" />
        </button>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
          {page.title}
        </h1>
      </div>

      <article
        className="px-5 py-6 prose-page"
        style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', color: '#1a1a1a', lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="px-5 pb-10 text-[#717182]" style={{ fontSize: '0.72rem' }}>
        Dernière mise à jour : {new Date(page.updatedAt).toLocaleDateString('fr-FR')}
      </div>

      <style>{`
        .prose-page h1 { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 1.6rem; margin: 1.2rem 0 0.6rem; letter-spacing: -0.02em; }
        .prose-page h2 { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 1.2rem; margin: 1rem 0 0.4rem; letter-spacing: -0.01em; }
        .prose-page h3 { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 1.02rem; margin: 0.8rem 0 0.3rem; }
        .prose-page p { margin: 0.5rem 0; }
        .prose-page ul { margin: 0.4rem 0 0.8rem 1.2rem; list-style: disc; }
        .prose-page li { margin: 0.2rem 0; }
        .prose-page strong { font-weight: 700; }
      `}</style>
    </motion.div>
  );
}
