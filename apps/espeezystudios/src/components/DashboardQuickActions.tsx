"use client";


import { Plus, UserPlus, Rocket } from 'lucide-react';

const actions = [
  {
    icon: <Plus size={20} />, label: 'Add Job', onClick: () => alert('Add Job (TODO)')
  },
  {
    icon: <Rocket size={20} />, label: 'New Project', onClick: () => alert('New Project (TODO)')
  },
  {
    icon: <UserPlus size={20} />, label: 'Invite', onClick: () => alert('Invite (TODO)')
  },
];

export default function DashboardQuickActions() {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1.2rem',
        margin: '0 0 2.2rem 0',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--studios-surface-2)',
            color: 'var(--studios-foreground)',
            border: 'none',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: '1.08rem',
            padding: '0.7rem 1.3rem',
            boxShadow: '0 1px 6px rgba(15,23,42,0.07)',
            cursor: 'pointer',
            transition: 'background 0.18s, box-shadow 0.18s, transform 0.13s',
            outline: 'none',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {a.icon}
          {a.label}
        </button>
      ))}
    </div>
  );
}
