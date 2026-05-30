

import { getLatestArticles } from 'apps/espeezyarticles/src/lib/latest-articles';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

function getInitials(name: string) {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

// Accessible color palette
const colors = {
  bg: '#fff',
  border: '#e5e7eb',
  accent: '#10b981',
  accent2: '#6366f1',
  text: '#0f172a',
  subtext: '#475569',
  tagBg: '#f1f5f9',
  tagText: '#6366f1',
  catBg: '#e0f7f3',
  catText: '#10b981',
};

export default async function AllArticlesPage({ searchParams }) {
  // Filtering state (SSR fallback: get from searchParams)
  const page = parseInt(searchParams?.page || '1', 10);
  const filterTag = searchParams?.tag || '';
  const filterCategory = searchParams?.category || '';
  const filterAuthor = searchParams?.author || '';
  const { articles, total } = await getLatestArticles({ limit: 20, page });
  const totalPages = Math.ceil((total || 0) / 20);

  // Get unique tags, categories, authors for filter bar
  const allTags = Array.from(new Set(articles.flatMap(a => Array.isArray(a.tags) ? a.tags : [])));
  const allCategories = Array.from(new Set(articles.map(a => a.category).filter(Boolean)));
  const allAuthors = Array.from(new Set(articles.map(a => a.author).filter(Boolean)));

  // Filter articles client-side (for demo; ideally, filter in backend)
  const filtered = articles.filter(a =>
    (!filterTag || (Array.isArray(a.tags) && a.tags.includes(filterTag))) &&
    (!filterCategory || a.category === filterCategory) &&
    (!filterAuthor || a.author === filterAuthor)
  );

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1rem' }} aria-label="All Articles">
      <h1 style={{ fontWeight: 900, fontSize: '2.5rem', marginBottom: '1.2rem', letterSpacing: '-0.03em', color: colors.text }}>All Articles</h1>
      {/* Filter Bar */}
      <nav aria-label="Filter articles" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <label htmlFor="tag-filter" style={{ fontWeight: 700, color: colors.subtext }}>Tag:</label>
        <select id="tag-filter" name="tag" defaultValue={filterTag} style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: `1.5px solid ${colors.border}` }} aria-label="Filter by tag">
          <option value="">All</option>
          {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
        </select>
        <label htmlFor="category-filter" style={{ fontWeight: 700, color: colors.subtext }}>Category:</label>
        <select id="category-filter" name="category" defaultValue={filterCategory} style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: `1.5px solid ${colors.border}` }} aria-label="Filter by category">
          <option value="">All</option>
          {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <label htmlFor="author-filter" style={{ fontWeight: 700, color: colors.subtext }}>Author:</label>
        <select id="author-filter" name="author" defaultValue={filterAuthor} style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: `1.5px solid ${colors.border}` }} aria-label="Filter by author">
          <option value="">All</option>
          {allAuthors.map(author => <option key={author} value={author}>{author}</option>)}
        </select>
      </nav>
      {/* Responsive grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2.2rem',
      }}>
        {filtered.length === 0 && <div>No articles found.</div>}
        {filtered.map((article, i) => (
          <motion.article
            key={article.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeOut' }}
            style={{
              background: colors.bg,
              borderRadius: 18,
              boxShadow: '0 4px 32px rgba(15,23,42,0.08)',
              border: `1.5px solid ${colors.border}`,
              padding: '2.1rem 1.7rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 320,
              position: 'relative',
              overflow: 'hidden',
              transition: 'box-shadow 0.2s, border 0.2s',
            }}
            whileHover={{ boxShadow: '0 8px 40px rgba(16,185,129,0.13)', borderColor: colors.accent }}
            tabIndex={0}
            aria-labelledby={`article-title-${article.id}`}
            role="article"
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.1rem', gap: '0.9rem' }}>
              {article.authorAvatar ? (
                <img src={article.authorAvatar} alt={article.author} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${colors.border}` }} />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: colors.tagBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', color: colors.accent2, border: `2px solid ${colors.border}`,
                }}>{getInitials(article.author)}</div>
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.01rem', color: colors.text, marginBottom: 2 }}>{article.author}</div>
                <div style={{ color: colors.subtext, fontSize: '0.93rem' }}>{new Date(article.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
            </div>
            <h3 id={`article-title-${article.id}`} style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.7rem', color: colors.text, letterSpacing: '-0.01em', lineHeight: 1.18 }}>{article.title}</h3>
            {/* Meta description */}
            {article.metaDescription && (
              <div style={{ color: colors.subtext, fontSize: '1.01rem', marginBottom: '0.7rem', lineHeight: 1.45 }}>
                {article.metaDescription}
              </div>
            )}
            <div style={{ color: colors.subtext, fontSize: '1.08rem', marginBottom: '1.1rem', lineHeight: 1.55, flex: 1 }}>
              {article.content.slice(0, 180)}{article.content.length > 180 ? '...' : ''}
            </div>
            {/* Meta image */}
            {article.metaImage && (
              <img src={article.metaImage} alt={article.metaTitle || article.title} style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />
            )}
            {/* Real tags and category chips */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
              {article.category && (
                <span style={{ background: colors.catBg, color: colors.catText, fontWeight: 800, fontSize: '0.82rem', borderRadius: 6, padding: '2px 12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{article.category}</span>
              )}
              {Array.isArray(article.tags)
                ? article.tags.map((tag: string) => (
                    <span key={tag} style={{ background: colors.tagBg, color: colors.tagText, fontWeight: 700, fontSize: '0.82rem', borderRadius: 6, padding: '2px 10px', letterSpacing: '0.04em' }}>{tag}</span>
                  ))
                : null}
            </div>
            {/* Reactions count (placeholder) */}
            <div style={{ color: colors.subtext, fontSize: '0.92rem', marginBottom: '0.7rem' }} aria-label="Reactions">
              {/* TODO: Replace with real reactions count */}
              <span role="img" aria-label="likes">👍</span> 0 &nbsp; <span role="img" aria-label="comments">💬</span> 0
            </div>
            <Link href={`/articles/${article.slug}`} style={{
              display: 'inline-block',
              marginTop: 'auto',
              background: `linear-gradient(90deg, ${colors.accent} 0%, ${colors.accent2} 100%)`,
              color: 'white',
              fontWeight: 800,
              fontSize: '1.01rem',
              borderRadius: 8,
              padding: '0.6rem 1.3rem',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(16,185,129,0.08)',
              transition: 'background 0.2s',
            }} aria-label={`Read more about ${article.title}`}>Read more</Link>
          </motion.article>
        ))}
      </div>
      {/* Pagination */}
      <nav aria-label="Pagination" style={{ marginTop: '2.5rem', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        {Array.from({ length: totalPages }, (_, i) => (
          <Link
            key={i}
            href={`?page=${i + 1}`}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '8px',
              background: page === i + 1 ? colors.accent : colors.tagBg,
              color: page === i + 1 ? 'white' : colors.text,
              fontWeight: 700,
              textDecoration: 'none',
              border: `1px solid ${colors.border}`,
              margin: '0 0.2rem',
            }}
            aria-current={page === i + 1 ? 'page' : undefined}
          >
            {i + 1}
          </Link>
        ))}
      </nav>
      {/* Mobile-first responsive styles */}
      <style>{`
        @media (max-width: 600px) {
          main[aria-label='All Articles'] {
            padding: 1rem 0.2rem;
          }
          h1 {
            font-size: 1.5rem !important;
          }
          .article-card {
            padding: 1.1rem 0.7rem 1rem !important;
          }
        }
      `}</style>
    </main>
  );
}
