import { ESPEEZY_APP_ORIGINS } from '@shared/espeezy-app-origins'

export type DevLink = {
  title: string
  description: string
  href: string
  external?: boolean
}

export type DevLinkSection = {
  id: string
  title: string
  subtitle: string
  links: DevLink[]
}

/** Local Espeezy apps (default dev-hub ports). */
export const LOCAL_APPS: DevLink[] = [
  {
    title: 'Dev Hub',
    description: 'Start/stop apps, logs, and workspace preview',
    href: 'http://localhost:3000/dashboard',
    external: true,
  },
  {
    title: 'Kanban',
    description: 'Scholar workspace & task boards',
    href: 'http://localhost:3001',
    external: true,
  },
  {
    title: 'Games',
    description: 'Skirmish & quiz surfaces',
    href: 'http://localhost:3002',
    external: true,
  },
  {
    title: 'Dashboard',
    description: 'Kanban home & internal dashboard',
    href: 'http://localhost:3003',
    external: true,
  },
  {
    title: 'Panel',
    description: 'Staff console — panel.espeezy.com (apps/admin)',
    href: process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3004/login',
    external: true,
  },
  {
    title: 'Prereg',
    description: 'Marketing & early access',
    href: 'http://localhost:3005',
    external: true,
  },
  {
    title: 'Studios',
    description: 'Marketplace & jobs',
    href: 'http://localhost:3007/login',
    external: true,
  },
  {
    title: 'Articles',
    description: 'Articles reader',
    href: 'http://localhost:3008',
    external: true,
  },
]

export const DEV_LINK_SECTIONS: DevLinkSection[] = [
  {
    id: 'docs',
    title: 'Framework & language docs',
    subtitle: 'Official references you will open daily.',
    links: [
      {
        title: 'Next.js Documentation',
        description: 'App Router, routing, data fetching, deployment',
        href: 'https://nextjs.org/docs',
        external: true,
      },
      {
        title: 'React Documentation',
        description: 'Components, hooks, and patterns',
        href: 'https://react.dev',
        external: true,
      },
      {
        title: 'TypeScript Handbook',
        description: 'Types, generics, and strict mode',
        href: 'https://www.typescriptlang.org/docs/handbook/',
        external: true,
      },
      {
        title: 'Node.js Documentation',
        description: 'Runtime APIs, modules, and tooling',
        href: 'https://nodejs.org/docs/latest/api/',
        external: true,
      },
      {
        title: 'Supabase Docs',
        description: 'Auth, Postgres, RLS, and realtime (used across Espeezy)',
        href: 'https://supabase.com/docs',
        external: true,
      },
    ],
  },
  {
    id: 'web',
    title: 'Web fundamentals',
    subtitle: 'HTML, CSS, accessibility, and platform APIs.',
    links: [
      {
        title: 'MDN Web Docs',
        description: 'HTML, CSS, JavaScript, and browser APIs',
        href: 'https://developer.mozilla.org/en-US/docs/Web',
        external: true,
      },
      {
        title: 'web.dev Learn',
        description: 'Google’s guided paths for modern web development',
        href: 'https://web.dev/learn/',
        external: true,
      },
      {
        title: 'WCAG Quick Reference',
        description: 'Accessibility success criteria (AA target)',
        href: 'https://www.w3.org/WAI/WCAG22/quickref/',
        external: true,
      },
      {
        title: 'Can I Use',
        description: 'Browser support for CSS and JS features',
        href: 'https://caniuse.com',
        external: true,
      },
    ],
  },
  {
    id: 'learn',
    title: 'Learning paths',
    subtitle: 'Structured courses for app and web development.',
    links: [
      {
        title: 'Next.js Learn',
        description: 'Official interactive Next.js course',
        href: 'https://nextjs.org/learn',
        external: true,
      },
      {
        title: 'freeCodeCamp',
        description: 'Free full-stack and responsive web design tracks',
        href: 'https://www.freecodecamp.org/learn/',
        external: true,
      },
      {
        title: 'The Odin Project',
        description: 'Open curriculum from foundations to full stack',
        href: 'https://www.theodinproject.com/',
        external: true,
      },
      {
        title: 'JavaScript.info',
        description: 'Modern JavaScript from basics to advanced',
        href: 'https://javascript.info/',
        external: true,
      },
    ],
  },
  {
    id: 'tutorials',
    title: 'Tutorials & references',
    subtitle: 'Deep dives, patterns, and day-to-day lookup.',
    links: [
      {
        title: 'CSS-Tricks',
        description: 'Layout recipes, flexbox, grid, and UI patterns',
        href: 'https://css-tricks.com/guides/',
        external: true,
      },
      {
        title: 'Patterns.dev',
        description: 'Modern web app architecture patterns',
        href: 'https://www.patterns.dev/',
        external: true,
      },
      {
        title: 'Playwright Docs',
        description: 'E2E testing (used in apps/kanban)',
        href: 'https://playwright.dev/docs/intro',
        external: true,
      },
      {
        title: 'Git Book',
        description: 'Branching, merging, and collaboration workflows',
        href: 'https://git-scm.com/book/en/v2',
        external: true,
      },
      {
        title: 'Espeezy — main site',
        description: 'Production marketing & registration',
        href: 'https://espeezy.com',
        external: true,
      },
      {
        title: 'Kanban workspace (prod)',
        description: 'Live scholar product',
        href: ESPEEZY_APP_ORIGINS.kanban,
        external: true,
      },
      {
        title: 'Dev Launch (prod)',
        description: 'Developer launchpad',
        href: ESPEEZY_APP_ORIGINS.core,
        external: true,
      },
      {
        title: 'Articles (prod)',
        description: 'articles.espeezy.com / blog.espeezy.com',
        href: ESPEEZY_APP_ORIGINS.articles,
        external: true,
      },
      {
        title: 'Dev Hub (prod)',
        description: 'Monorepo control plane',
        href: ESPEEZY_APP_ORIGINS.base,
        external: true,
      },
    ],
  },
]
