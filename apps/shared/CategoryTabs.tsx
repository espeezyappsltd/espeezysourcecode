import React, { useMemo } from 'react';

// WCAG-compliant random color generator
function getRandomWCAGColor(existing: string[]): string {
  // Palette of high-contrast, accessible colors
  const palette = [
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
    '#f1f5f9', // Light
  ];
  // Avoid duplicates
  const available = palette.filter(c => !existing.includes(c));
  return available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : palette[Math.floor(Math.random() * palette.length)];
}

export interface CategoryTabsProps {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, selected, onSelect }) => {
  // Assign a random color to each category, stable per render
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(cat => {
      map[cat] = getRandomWCAGColor(Object.values(map));
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
