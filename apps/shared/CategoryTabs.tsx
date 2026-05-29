import React, { useMemo } from 'react';

/** High-contrast palette — assignment is deterministic (SSR-safe). */
const CATEGORY_PALETTE = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e42', // Orange
  '#f43f5e', // Rose
  '#a21caf', // Purple
  '#fbbf24', // Amber
  '#0ea5e9', // Sky
  '#84cc16', // Lime
  '#e11d48', // Red
  '#1e293b', // Slate
] as const;

function hashCategoryKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Stable color per category name — same output on server and client. */
function getDeterministicCategoryColor(category: string, existing: string[]): string {
  const start = hashCategoryKey(category) % CATEGORY_PALETTE.length;
  for (let i = 0; i < CATEGORY_PALETTE.length; i++) {
    const color = CATEGORY_PALETTE[(start + i) % CATEGORY_PALETTE.length];
    if (!existing.includes(color)) return color;
  }
  return CATEGORY_PALETTE[start];
}

export interface CategoryTabsProps {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, selected, onSelect }) => {
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat) => {
      map[cat] = getDeterministicCategoryColor(cat, Object.values(map));
    });
    return map;
  }, [categories.join(',')]);

  return (
    <nav aria-label="Categories" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2.5rem' }}>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '100px',
            border: selected === cat ? `2px solid ${colorMap[cat]}` : '1px solid rgba(15,23,42,0.08)',
            background: selected === cat ? colorMap[cat] : 'white',
            color: selected === cat ? (cat === 'All' ? '#222' : '#fff') : '#222',
            fontSize: '0.9rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: selected === cat ? `0 8px 20px ${colorMap[cat]}33` : 'none',
            outline: selected === cat ? `3px solid ${colorMap[cat]}` : undefined,
          }}
          aria-current={selected === cat ? 'page' : undefined}
        >
          {cat}
        </button>
      ))}
    </nav>
  );
};
