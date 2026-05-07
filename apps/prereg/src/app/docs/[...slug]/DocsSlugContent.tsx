'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  LayoutGrid, Milestone, Users, ShoppingBag,
  Gamepad2, Search, Zap, Globe, CreditCard, Box, Eye, Flag, BarChart
} from 'lucide-react'

const BRAND = '#10b981'

const docsContent: Record<string, { title: string; icon: React.ReactNode; content: string; eli12: string }> = {
  'getting-started': {
    title: 'Quick Start Guide',
    icon: <Zap size={40} />,
    content: 'Initialize your academic workspace and sync your team in minutes.',
    eli12: "It's like setting up a new base in a game. You create your character (profile), find your team, and start your first mission!",
  },
  'installation': {
    title: 'Setting up Espeezy',
    icon: <Box size={40} />,
    content: 'How to deploy the Espeezy client for your team.',
    eli12: "Just like installing a new game on your phone, you just need to sign in and you are ready to go. No complicated wires!",
  },
  'features/kanban': {
    title: 'Digital Kanban Board',
    icon: <LayoutGrid size={40} />,
    content: 'Visualize task transitions across the project interval stages.',
    eli12: "Imagine a big wall with sticky notes. When you start work, you move a note to 'Doing'. When you finish, you move it to 'Done'. Everyone can see who is doing what!",
  },
  'features/roadmap': {
    title: 'Academic Roadmap',
    icon: <Milestone size={40} />,
    content: 'Strategize your project using 5-stage academic intervals.',
    eli12: "It's a colorful map for your project. It shows the 5 big steps you need to take before you cross the finish line and win!",
  },
  'features/network': {
    title: 'Peer Network',
    icon: <Users size={40} />,
    content: 'Connect with researchers and students across the institution.',
    eli12: "A big list of all the smart people in your school. You can find friends who are good at things you aren't, so you can work together.",
  },
  'features/marketplace': {
    title: 'Marketplace',
    icon: <ShoppingBag size={40} />,
    content: 'Exchange resources and information within your academic group.',
    eli12: "Like a library but for everything! Need a specific book or a tool for your project? You can borrow it from someone else right here.",
  },
  'features/skirmish': {
    title: 'Skirmish Games',
    icon: <Gamepad2 size={40} />,
    content: 'Real-time academic quizzes and competitions for students.',
    eli12: "Fun school games! You can race your friends to answer questions and see who is the master of the subject.",
  },
  'features/search': {
    title: 'Smart Search',
    icon: <Search size={40} />,
    content: 'Instant discovery across the entire collaborative state.',
    eli12: "A 'Find Everything' box. Type one word and—POOF!—it finds the person, the task, or the team you were looking for.",
  },
  'infra/payments': {
    title: 'Stripe Integration',
    icon: <CreditCard size={40} />,
    content: 'Secure institutional payment and subscription protocols.',
    eli12: "A secure safe where the app handles money for Pro features, just like buying a skin in a game but for school help!",
  },
  'infra/sync': {
    title: 'Firebase Sync',
    icon: <Globe size={40} />,
    content: 'High-performance database and state relay system.',
    eli12: "This is the magic glue that makes sure when you move a note, your friend sees it move on their screen at the exact same time.",
  },
  'infra/presence': {
    title: 'Real-time Presence',
    icon: <Eye size={40} />,
    content: 'Monitoring active session states across the network.',
    eli12: "Little green dots that light up when your friends are online. It's like seeing who is playing in a multiplayer game.",
  },
  'vision': {
    title: 'Our Vision',
    icon: <Flag size={40} />,
    content: 'Building the future of student-led academic collaboration.',
    eli12: "We want to make school projects feel less like work and more like a team sport where everyone gets credit for helping out.",
  },
  'impact': {
    title: 'Impact Stats',
    icon: <BarChart size={40} />,
    content: 'Measuring global contribution metrics of the Espeezy community.',
    eli12: "A scoreboard for the whole world! It shows how many thousands of students are working together right now.",
  },
}

export default function DocsSlugContent() {
  const params = useParams()
  const raw = params.slug
  const slugArr = Array.isArray(raw) ? raw : [raw as string]
  const slug = slugArr.join('/')
  const item = docsContent[slug]

  if (!item) {
    return (
      <div style={{ textAlign: 'center', padding: '8rem 0' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '1.5rem' }}>404</h1>
        <p style={{ color: '#9ca3af', marginBottom: '2.5rem', fontSize: '1rem' }}>
          This documentation segment remains classified or does not exist.
        </p>
        <Link href="/docs" style={{ color: BRAND, fontWeight: 700, textDecoration: 'none' }}>← Return to Archive</Link>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ color: BRAND, marginBottom: '1.5rem' }}>{item.icon}</div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '1.25rem', color: '#f3f4f6' }}>
          {item.title}
        </h1>
        <p style={{ fontSize: '1.15rem', color: '#f3f4f6', fontWeight: 500, lineHeight: 1.6, marginBottom: '0' }}>
          {item.content}
        </p>
      </div>

      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f3f4f6' }}>
          ELI12: The Simple Explanation ✨
        </h2>
        <div style={{ background: 'rgba(16,185,129,0.05)', padding: '1.75rem', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
          <p style={{ margin: 0, color: '#9ca3af', lineHeight: 1.7, fontSize: '1rem', fontWeight: 500 }}>
            {item.eli12}
          </p>
        </div>
      </section>

      <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/docs" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}>← Return to Archive</Link>
        <Link href="/" style={{ color: BRAND, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>Back to Espeezy →</Link>
      </div>
    </div>
  )
}
