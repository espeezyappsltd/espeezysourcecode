'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  LayoutGrid, Milestone, Users, ShoppingBag,
  Gamepad2, Search, Zap, Globe, CreditCard, Box, Eye, Flag, BarChart, Accessibility, Info, RotateCcw,
  Briefcase, Newspaper, Cpu,
} from 'lucide-react'
import {
  GETTING_STARTED_ACCOUNT_BODY,
  INSTALLATION_WEB_BODY,
} from '@shared/platform-brand'
import { ESPEEZY_APP_ORIGINS } from '@shared/espeezy-app-origins'

const BRAND = '#10b981'

type DocSection = {
  heading: string
  body: string
  items?: string[]
  mapEmbed?: string
}

type DocEntry = {
  title: string
  icon: React.ReactNode
  tagline: string
  sections: DocSection[]
  eli12: string
}

const docsContent: Record<string, DocEntry> = {
  'getting-started': {
    title: 'Quick Start Guide',
    icon: <Zap size={40} />,
    tagline: 'Get your workspace setup in under three minutes.',
    sections: [
      {
        heading: 'Step 1: Create your account',
        body: GETTING_STARTED_ACCOUNT_BODY,
        items: ['Email verification sent instantly', 'Institutional auto-detection from 4,000+ domains', 'Profile takes under 60 seconds to complete'],
      },
      {
        heading: 'Step 2: Set up your workspace',
        body: 'Every project lives inside a workspace. A workspace represents your course or module. You set the name, subject area, deadline, and the grading weight of collaboration (used by the team balance summary). You can connect your LMS (Canvas, Blackboard, Moodle) to import assignments and deadlines.',
        items: ['One workspace per course or group project', 'Workspace settings can be locked by an educator or left open to the group'],
      },
      {
        heading: 'Step 3: Invite your team',
        body: 'Share the team name and passcode. Each new member is added as a Contributor. Role permissions can be changed at any time. The workspace admin (whoever created it) has override access to all task states.',
        items: ['Share team name and passcode', 'Role-based permissions: Contributor, Reviewer, Observer', 'Students can join multiple workspaces simultaneously'],
      },
      {
        heading: 'Step 4: Add your first tasks',
        body: 'Use the Kanban board to create task cards. Each card has a title, description, assignee, due date, and effort estimate. The AI will flag tasks that look unevenly distributed based on project effort compared to team size. You can add subtasks, attach files, and link tasks to roadmap milestones.',
      },
      {
        heading: 'Step 5: Record and submit',
        body: 'As tasks move through the board columns (Backlog, In Progress, Review, Done), the app logs every state change with a timestamp and the user who made it. This contribution log is your individual contribution data, which educators can optionally view. At submission time, you can export a full contribution report as a PDF or CSV.',
      },
    ],
    eli12: 'It is like setting up a new base in a game. You create your character, find your team, assign everyone a project role, and start your first mission. The app keeps score of the moves you make.',
  },

  'installation': {
    title: 'Setting Up The App',
    icon: <Box size={40} />,
    tagline: 'Espeezy Kanban Dashboard is a cross-platform app. There is no download. Here is what you need to know.',
    sections: [
      {
        heading: 'Cross-platform app (no installation needed)',
        body: INSTALLATION_WEB_BODY,
      },
      {
        heading: 'Progressive Web App (PWA)',
        body: 'On mobile, you can install the dashboard app as a PWA directly from your browser. This adds it to your home screen like a native app, enables offline task viewing (cached from your last sync), and sends push notifications for task updates and deadlines.',
        items: ['Android: open in Chrome, tap "Add to Home Screen"', 'iOS: open in Safari, tap Share, then "Add to Home Screen"', 'Offline mode: read-only view of your last synced workspace'],
      },
      {
        heading: 'Self-hosted deployment (for institutions)',
        body: 'Universities and colleges that need to host the platform within their own infrastructure can deploy the open-source core. The stack is Next.js 16 App Router, Supabase (PostgreSQL and GoTrue Auth), and runs on Cloudflare Workers (OpenNext) or any Node 22+ server. A Docker image is provided for easy deployment.',
        items: ['Docker image available: ghcr.io/espeezy/app:latest', 'Environment variables required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY', 'SSO integration via SAML 2.0 and OAuth 2.0 (institutional IdP)'],
      },
      {
        heading: 'LMS Integration',
        body: 'To connect the Kanban Dashboard App to your institution LMS, an administrator generates an API key in the Espeezy institution dashboard and pastes it into the LMS plugin settings. Plugins are available for Canvas, Blackboard Learn, and Moodle. Once connected, all courses, assignments, and enrolled students sync automatically.',
        items: ['Canvas: install via App Configurations in Admin Settings', 'Blackboard: install via Building Blocks (admin access required)', 'Moodle: install the Kanban Dashboard plugin from the Moodle Plugin Directory'],
      },
    ],
    eli12: 'You do not install anything. Just open the app, sign in, and it works. If you want it on your phone like a real app, tap one button in your browser and it appears on your home screen.',
  },

  'features/kanban': {
    title: 'Kanban Dashboard',
    icon: <LayoutGrid size={40} />,
    tagline: 'The main task board that you will use. Every contribution is visible, timestamped, and easy to review.',
    sections: [
      {
        heading: 'How the board works',
        body: 'Each project workspace has one Kanban board with five columns: Backlog, In Progress, In Review, Blocked, and Done. Task cards can be dragged between columns by any Contributor. Every move is recorded with the exact timestamp and the username of who moved it. This creates a tamper-evident audit trail of the entire workspace history.',
      },
      {
        heading: 'Task cards in detail',
        body: 'Each card contains: a title and rich-text description, one or more assignees, an effort estimate (in points, 1 to 8), a due date, file attachments (images, PDFs, code files up to 25MB each), a comment thread with @mentions, and a link to a roadmap milestone. Cards can have subtasks that contribute to a parent card completion percentage.',
        items: ['Effort points translate directly into contribution score', 'File attachments are version-controlled (upload a new file to keep history)', '@mentions trigger real-time notifications to the mentioned user', 'Subtasks show a progress bar on the parent card'],
      },
      {
        heading: 'Team balance summary',
        body: 'The team balance summary runs in the background and calculates the distribution of project effort across all team members. If one person is assigned more than 40% of the total effort with more than 3 days remaining before the deadline, the system sends an automated alert to all workspace members and highlights the imbalance on the board sidebar. Educators can configure the sensitivity threshold.',
      },
      {
        heading: 'Filters and views',
        body: 'You can filter cards by assignee, due date range, effort range, or label. Switch to List view for a spreadsheet-style breakdown. Switch to Calendar view to see tasks plotted on a weekly grid by due date. All views reflect the same underlying data and sync in real time.',
      },
      {
        heading: 'Exporting contribution data',
        body: 'At any point, any workspace member can export a contribution report. The report includes each members total project effort, number of tasks completed, average time from In Progress to Done, and number of review comments given and received. Export formats: PDF, CSV, or JSON (for institutional systems).',
      },
    ],
    eli12: 'Imagine a whiteboard with sticky notes in three groups: To Do, Doing, and Done. You drag your note across when you start and finish work. Espeezy takes a photo every time someone drags a note so nobody can pretend they did more than they really did.',
  },

  'features/roadmap': {
    title: 'Academic Roadmap',
    icon: <Milestone size={40} />,
    tagline: 'A structured five-stage project timeline designed to mirror how academic assessments actually work.',
    sections: [
      {
        heading: 'The five stages',
        body: 'Every academic project in Espeezy is broken into five standard stages that map to the academic project lifecycle:',
        items: [
          'Stage 1: Research and Planning. Define scope, divide responsibilities, and set milestones.',
          'Stage 2: Draft and Build. Active development, writing, or creation phase.',
          'Stage 3: Internal Review. Peer review within the team before submitting externally.',
          'Stage 4: Refinement. Incorporate feedback and polish deliverables.',
          'Stage 5: Submission and Debrief. Final submission and a structured retrospective.',
        ],
      },
      {
        heading: 'Milestones and dependencies',
        body: 'Within each stage you create milestones: specific deliverables with a due date and one or more Kanban tasks linked to them. Milestones can have dependencies: Milestone B will not unlock until Milestone A is marked complete. This prevents teams from jumping ahead without finishing foundational work.',
      },
      {
        heading: 'Progress tracking',
        body: 'The roadmap view shows a Gantt-style timeline with each stage and milestone plotted against the calendar. The current date is marked with a vertical line. Overdue milestones are highlighted in amber. Completed milestones are marked in green with a checkmark and the completion timestamp.',
      },
      {
        heading: 'Educator view',
        body: 'Educators who are added as Observers to a workspace can see the roadmap in a read-only view. They can leave comments on any milestone, and those comments are visible to all team members. This replaces the need for separate progress check-in emails.',
      },
    ],
    eli12: 'Think of it as a map for a quest. The map shows five big checkpoints you need to reach before you win. Each checkpoint has smaller mini-tasks. You cannot go to checkpoint 3 until you finish checkpoint 2. It keeps the whole team moving in the right direction.',
  },

  'features/network': {
    title: 'Peer Network',
    icon: <Users size={40} />,
    tagline: 'A searchable directory of students and researchers at your institution and beyond.',
    sections: [
      {
        heading: 'How the network works',
        body: 'Every Espeezy user has a public profile that shows their subject areas, skills, current workspaces they are open to collaborating on, and their contribution rating (an aggregate score from completed group projects). You can follow other students, send collaboration invites, or message them directly.',
      },
      {
        heading: 'Skill tags and discovery',
        body: 'When you set up your profile you add up to 15 skill tags (for example: Python, Literature Review, Graphic Design, Data Analysis). The network directory is searchable by skill tag, institution, year of study, and subject area. You can filter by students who are currently looking for project collaborators.',
      },
      {
        heading: 'Contribution rating',
        body: 'Your contribution rating is calculated from all your completed projects. It is a number from 1 to 5 based on: project effort completed on time, peer review quality (upvotes on your review comments), and consistency across projects. This rating is visible on your profile and can be included on exported certificates.',
        items: ['5.0: exceptional, consistent contributor across all projects', '4.0-4.9: strong contributor, minor inconsistencies', '3.0-3.9: average, some late or incomplete tasks', 'Below 3.0: at-risk, flagged to advisor (if institution enabled this)'],
      },
      {
        heading: 'Cross-institutional collaboration',
        body: 'Espeezy supports inter-institutional projects. If your educator enables the global network, you can search for and collaborate with students from partner universities in other countries. Cross-institutional workspaces have an additional verification step to confirm all participants are enrolled students.',
      },
      {
        heading: 'Privacy controls',
        body: 'Your profile is private by default. You can set it to: Institution Only (visible to students and staff at your university), Network (visible to all Espeezy users), or Collaboration Open (publicly visible and listed in the collaboration directory). You can hide your contribution rating at any time.',
      },
    ],
    eli12: 'It is like a school yearbook that is also a team builder. Every student has a card showing what they are good at. If you need someone who is great at coding or design for your project, you just search for them and send a message. They can join your team with one click.',
  },

  'features/marketplace': {
    title: 'Resource Marketplace',
    icon: <ShoppingBag size={40} />,
    tagline: 'A peer-to-peer resource exchange inside Kanban for study materials, templates, and tools.',
    sections: [
      {
        heading: 'Where monetization lives now',
        body: `Free resource sharing stays in Kanban. Paid gigs, professional projects, invoices, and client delivery moved to Espeezy Studio (${ESPEEZY_APP_ORIGINS.studios.replace('https://', '')}). Premium Kanban members open Studio from the workspace sidebar.`,
      },
      {
        heading: 'What you can share',
        body: 'The Marketplace lets students publish resources for others to access. Resources can be: document templates (report structures, bibliography formats), datasets (anonymised, for analysis projects), study guides and flashcard decks, code repositories with worked examples, and design assets (presentation templates, infographics).',
      },
      {
        heading: 'Free vs. premium resources',
        body: 'Most resources on the Marketplace are free. Students with a Pro subscription can sell premium resources for £. All premium resources go through a quality review before listing. The pricing cap for any resource is £4.99 (one month of Pro).',
      },
      {
        heading: 'Quality and trust',
        body: 'Every resource has a community rating (1 to 5 stars), a download count, and a comments section. Resources flagged by three or more users for incorrect or misleading content are automatically suspended pending review. The original contributor is notified and can update or remove the resource.',
      },
      {
        heading: 'Institutional resource packs',
        body: 'Institutions can publish official resource packs directly to the Marketplace. These appear with a verified institution badge and are pinned to the top of search results for students enrolled at that institution. Examples: official citation guide, approved data sources list, module-specific templates.',
      },
    ],
    eli12: 'Think of it like a jumble sale at school, but free. Students put their best notes and project templates on a virtual table. You can grab anything useful, and if someone grabs something you made, you build contribution history. Everyone helps each other and gets rewarded for it.',
  },

  'features/skirmish': {
    title: 'Skirmish Games',
    icon: <Gamepad2 size={40} />,
    tagline: 'Live academic quiz battles that make revision engaging while building genuine subject mastery.',
    sections: [
      {
        heading: 'How a Skirmish works',
        body: 'A Skirmish is a real-time, multiplayer quiz session. The host picks a topic (or Espeezy generates one from your module content), sets the number of rounds (5 to 25 questions), the time limit per question (10 to 60 seconds), and the scoring mode (speed bonus or accuracy only). Up to 50 players can join a single Skirmish.',
      },
      {
        heading: 'Question sources',
        body: 'Questions can come from three sources: the Espeezy community question bank (community-submitted and quality-reviewed), your institution content (if your LMS is connected, Espeezy can generate questions from past papers and course reading lists), or custom questions that the host writes before the session.',
      },
      {
        heading: 'Scoring and leaderboard',
        body: 'Each correct answer earns base score. Answering within the first third of the time window earns a speed bonus (up to 50% extra). At the end of each round the leaderboard updates live. At the end of the Skirmish, results are saved to each players profile showing topics answered correctly and areas of weakness.',
      },
      {
        heading: 'Team Skirmish mode',
        body: 'In Team Skirmish, players are split into two or more teams and answer together. One player answers at a time in rotation. The team with the highest cumulative score wins. Team Skirmish is designed for study groups and can be run inside a workspace so the results feed into collaboration metrics.',
      },
      {
        heading: 'Revision analytics',
        body: 'After each Skirmish, you receive a personal breakdown: which question categories you struggled with, your average response time, and your accuracy rate across all Skirmishes in that module. This feeds into the AI coach (Pro feature) which generates a targeted revision plan.',
      },
    ],
    eli12: 'It is like Kahoot but smarter. You and your friends join a live quiz about your subject. Questions pop up on screen and you have a few seconds to answer. The faster and more correct you are, the higher you score. At the end, Espeezy shows you what you need to study more.',
  },

  'features/studios': {
    title: 'Espeezy Studio',
    icon: <Briefcase size={40} />,
    tagline: 'Premium studio hub, projects, and client delivery at studios.espeezy.com.',
    sections: [
      {
        heading: 'Who can access Studio',
        body: 'Espeezy Studio is for Premium Kanban members. Sign in on Kanban, then open Studio from the sidebar or bottom nav. Cross-app SSO keeps one Espeezy account across Kanban, Games, and Studio.',
        items: ['Premium plan required', 'SSO from kanban.espeezy.com', 'Shared profile and billing'],
      },
      {
        heading: 'What you do in Studio',
        body: 'Run the studio hub: list projects, manage professional projects, track milestones and budgets, generate PRD and requirements docs, and email invoices and receipts to clients.',
        items: ['Studio hub', 'Project delivery workspace', 'Analytics for your pipeline'],
      },
      {
        heading: 'Hosted URL',
        body: `Production: ${ESPEEZY_APP_ORIGINS.studios}. Local dev default port: 3007.`,
      },
    ],
    eli12: 'When your group is ready to earn from real client projects, Studio is the hub: list projects, finish them, and send the invoice.',
  },

  'features/articles': {
    title: 'Articles & Blog',
    icon: <Newspaper size={40} />,
    tagline: 'Campus articles and blog posts on articles.espeezy.com and blog.espeezy.com.',
    sections: [
      {
        heading: 'Two hostnames, one app',
        body: `articles.espeezy.com is the primary reader. blog.espeezy.com is an alias to the same Articles app for blog-style URLs and sharing.`,
      },
      {
        heading: 'Where articles appear',
        body: 'Featured articles can surface on espeezy.com marketing pages. Authors and categories sync from Supabase when configured.',
      },
      {
        heading: 'Hosted URLs',
        body: `Articles: ${ESPEEZY_APP_ORIGINS.articles}. Blog alias: ${ESPEEZY_APP_ORIGINS.blog}.`,
      },
    ],
    eli12: 'Think of it as the school newspaper online: short updates on the blog hostname, longer reads on the articles site.',
  },

  'features/dev-launch': {
    title: 'Dev Launch',
    icon: <Cpu size={40} />,
    tagline: 'Developer launchpad with docs links and local app shortcuts.',
    sections: [
      {
        heading: 'Purpose',
        body: 'Dev Launch (devlaunch.espeezy.com) is the on-ramp for contributors: framework docs, Espeezy app links, and pointers to the monorepo dev hub at base.espeezy.com.',
      },
      {
        heading: 'Related apps',
        body: `Dev Hub control plane: ${ESPEEZY_APP_ORIGINS.base}. Dev Launch: ${ESPEEZY_APP_ORIGINS.core}. Use Dev Hub to start local apps; use Dev Launch for daily documentation lookups.`,
      },
    ],
    eli12: 'It is the launch pad for people building Espeezy: one page with links to every app and the docs you need.',
  },

  'features/hustle': {
    title: 'Side Hustle',
    icon: <ShoppingBag size={40} />,
    tagline: 'Legacy Kanban hustle flows. New paid delivery runs in Espeezy Studio.',
    sections: [
      {
        heading: 'Current direction',
        body: `Side Hustle UI in Kanban now redirects to Espeezy Studio (${ESPEEZY_APP_ORIGINS.studios.replace('https://', '')}) for Premium members. Use Studio for listings, gigs, invoices, and client delivery.`,
      },
      {
        heading: 'What is the Side Hustle?',
        body: 'The Side Hustle is a curated task marketplace within Espeezy. It allows students with specific skills (research, coding, graphic design, proofreading) to find paid opportunities posted by other students or external partners. Unlike the general Marketplace which is for sharing existing resources, the Side Hustle is for active service delivery.',
      },
      {
        heading: 'How to find and accept tasks',
        body: 'Tasks are listed in the Hustle dashboard and categorised by skill type, estimated duration, and project payout. You can filter by "Quick Tasks" (under 30 minutes) or "Project Tasks" (multi-day). Before accepting a task, you can see the posters rating and previous feedback. Once you accept, a private workspace is created for the duration of the task.',
        items: ['Skills-based task matching', 'Verified posters only', 'Secure workspace for every hustle'],
      },
      {
        heading: 'The payout system',
        body: 'Hustles are paid in GBP. When a task is posted, funds are moved into an Espeezy account. Once the task is marked as complete and the poster confirms receipt, payment is released to the contributor. Pro members can withdraw payouts to their bank account via Stripe Connect.',
        items: ['Secure payments for all tasks', 'Pro members can cash out to bank', 'Apply balance toward months of Espeezy Pro'],
      },
      {
        heading: 'Quality and dispute resolution',
        body: 'If a poster is unhappy with the work delivered, they can initiate a dispute. An Espeezy moderator (or a senior student with a high reputation score) will review the deliverables and the task brief to make a final decision. Users with a history of poor quality or non-payment are permanently banned from the Hustle network.',
      },
      {
        heading: 'Institutional tasks',
        body: 'Universities can post "Campus Hustles" such as student ambassador roles, research assistant tasks, or peer mentoring opportunities. These are marked with a verified institution badge and often pay higher payout rates or direct cash rewards.',
      },
    ],
    eli12: 'It is like having a part-time job inside Espeezy. If you are great at something, like making posters or fixing code, you can find other students who need help and get paid in points. If you have a Pro account, you can even turn those points into real money in your bank account.',
  },

  'features/search': {
    title: 'Smart Search',
    icon: <Search size={40} />,
    tagline: 'One search box that finds anything across your workspaces, network, marketplace, and docs instantly.',
    sections: [
      {
        heading: 'What it searches',
        body: 'Smart Search indexes every piece of content you have access to: task cards (title, description, comments), workspace names and members, network profiles, marketplace resources, and documentation pages. Results are ranked by recency, relevance score, and your activity patterns.',
      },
      {
        heading: 'Natural language queries',
        body: 'You do not need exact keyword matches. Smart Search understands intent. Searching "tasks assigned to me that are late" returns your overdue tasks. Searching "people who study machine learning at my uni" returns matching network profiles. The engine uses a lightweight semantic search model that runs entirely within the Espeezy infrastructure.',
      },
      {
        heading: 'Filters and scope',
        body: 'After searching, you can narrow results by type (Tasks, People, Resources, Docs), by workspace, by date range, and by assignee. You can save frequently used searches as shortcuts in your sidebar for one-click access.',
      },
      {
        heading: 'Keyboard first',
        body: 'Press Cmd + K (Mac) or Ctrl + K (Windows/Linux) from anywhere in Espeezy to open the search overlay. You can navigate results entirely with arrow keys and Enter. Pressing Escape dismisses it. No mouse needed.',
      },
    ],
    eli12: 'Type anything into the search box and the answer appears in under a second. Looking for a person? A task? A file someone uploaded last week? It finds all of it. You can even type a question in plain English and it works.',
  },

  'infra/payments': {
    title: 'Stripe Integration',
    icon: <CreditCard size={40} />,
    tagline: 'Secure, PCI-compliant payment processing for Pro subscriptions, Project marketplace balance, and institutional billing.',
    sections: [
      {
        heading: 'How payments work',
        body: 'All payments on Espeezy are processed by Stripe, one of the most trusted payment processors in the world. Espeezy never stores your card number or CVV. When you enter payment details, they go directly to Stripe and a secure token is returned to Espeezy. This means even if Espeezy were compromised, your card data would not be exposed.',
      },
      {
        heading: 'Subscription plans',
        body: 'Pro subscriptions are billed monthly or annually. You can upgrade, downgrade, or cancel at any time from your account settings. When you cancel, you retain access until the end of your current billing period. Espeezy does not charge cancellation fees. Refund eligibility is set out in the Refund Policy (/docs/refund-policy).',
      },
      {
        heading: 'Institutional billing',
        body: 'Universities can set up an institutional account that covers all enrolled students under a single annual invoice. Institutional pricing is negotiated directly with the Espeezy team and includes volume discounts. The institution billing portal shows usage per department and per student, useful for internal reporting.',
      },
      {
        heading: 'Project marketplace balance',
        body: 'Top-ups are purchased in bundles via Stripe (£5, £20, and £50). Top-ups are non-refundable once spent on a Marketplace resource. Unused balance carries over indefinitely. Balance earned from selling resources can be applied toward Pro subscription months at £4.99 per month.',
      },
      {
        heading: 'Security and compliance',
        body: 'Stripe is PCI DSS Level 1 certified. All payment pages use HTTPS with TLS 1.3. Espeezy uses Stripe Radar for fraud detection. If a payment looks suspicious, it is flagged automatically and you will receive an email to verify before it is processed. 3D Secure is supported for cards that require it.',
      },
    ],
    eli12: 'When you pay for anything in Espeezy, a company called Stripe handles the money. Espeezy never sees your card number. It is exactly like paying for a game on the App Store: it is safe, quick, and you get a receipt in your email.',
  },

  'infra/sync': {
    title: 'Supabase Real-time',
    icon: <Globe size={40} />,
    tagline: 'The real-time data layer that keeps every workspace in sync across all devices and all users, instantly.',
    sections: [
      {
        heading: 'What Supabase does',
        body: 'Espeezy uses Supabase (PostgreSQL) as its primary database. It leverages Supabase Realtime for instant synchronization: when data changes in the database, every connected client that is subscribed to that channel receives the update in milliseconds without needing to refresh the page.',
      },
      {
        heading: 'How task updates propagate',
        body: 'When you drag a Kanban card from In Progress to Done, Espeezy writes the new state and a timestamp to PostgreSQL. Every teammate who has that workspace open sees the card move in real time on their own screen via the Realtime channel. The update round-trip Typically takes under 100 milliseconds.',
      },
      {
        heading: 'Conflict resolution',
        body: 'If two users try to move the same card at exactly the same time, Supabase uses its built-in optimistic concurrency to resolve the conflict: the last write wins, and all clients converge to the same final state. For critical fields, Espeezy uses server-side RPC functions to prevent data corruption.',
      },
      {
        heading: 'Offline support',
        body: 'The Supabase client has robust caching. If you lose your internet connection, your changes are stored locally. When your connection returns, the client automatically syncs your offline changes with the server and resolves any conflicts using a last-in-wins strategy.',
      },
      {
        heading: 'Security policies',
        body: 'PostgreSQL Row-Level Security (RLS) policies enforce that users can only read and write data they are authorised to access. For example, a student can only read workspace data if they are a member of that workspace. Policies are defined in SQL and version-controlled.',
      },
    ],
    eli12: 'Supabase is the invisible engine underneath Espeezy. When you update a task, it sends that change to your teammates screens in less than a second, like passing a note to someone sitting next to you but they are actually on the other side of the world.',
  },

  'infra/presence': {
    title: 'Real-time Presence',
    icon: <Eye size={40} />,
    tagline: 'Live indicators that show who is active in your workspace, what they are viewing, and when they were last seen.',
    sections: [
      {
        heading: 'Online indicators',
        body: 'Every workspace member has a presence indicator next to their avatar: a green dot means they are currently active in that workspace, an amber dot means they were active in the last 15 minutes, and a grey dot means they have been offline for more than 15 minutes. Clicking an avatar shows their last active timestamp.',
      },
      {
        heading: 'Cursor presence on shared documents',
        body: 'When two or more people are viewing the same task card or document at the same time, you can see each other named cursors and text selections in real time. This prevents the situation where two people are editing the same section without knowing it, avoiding conflicting changes.',
      },
      {
        heading: 'Typing indicators',
        body: 'In the comment threads on task cards, a typing indicator appears (similar to WhatsApp) when another team member is composing a reply. This reduces the awkward situation of two people posting duplicate responses because neither knew the other was already typing.',
      },
      {
        heading: 'Focus mode and do not disturb',
        body: 'You can set yourself to Focus mode from the status menu in the top bar. While in Focus mode, your presence shows as a purple dot and notifications are muted. Your teammates can still see you are online but will not send you disruptive pings. Focus mode can be set to automatically turn off after 30, 60, or 90 minutes.',
      },
      {
        heading: 'How it is built',
        body: 'Presence is powered by Supabase Realtime Presence, which is optimized for high-frequency small writes. Each connected client broadcasts a heartbeat. If the client disconnects, Supabase automatically handles the presence state change, ensuring that your team status is always accurate even if you just close your laptop.',
      },
    ],
    eli12: 'It is like the little green dot on WhatsApp but for your whole team. You can see who is online right now, who was just here a minute ago, and even see their cursor moving around on the shared task board. No more "did you see my message?" moments.',
  },

  'refund-policy': {
    title: 'Refund Policy',
    icon: <RotateCcw size={40} />,
    tagline: 'How refunds work for Espeezy Pro subscriptions, Project marketplace balance, and other paid features.',
    sections: [
      {
        heading: 'Overview',
        body: 'Espeezy processes payments through Stripe. This policy explains when refunds are available, how to request one, and what is not refundable. Unless required by law, all refunds are issued to the original payment method in £.',
        items: [
          'Last updated: May 2026',
          'Applies to espeezy.com and linked Espeezy apps',
          'Questions: support@espeezy.com',
        ],
      },
      {
        heading: 'Pro subscriptions',
        body: 'Monthly Pro plans: you may cancel at any time from account settings. Access continues until the end of the current billing period. We do not refund partial months unless required by UK consumer law or where a billing error occurred on our side.',
        items: [
          'Annual Pro plans: if you cancel within 14 days of purchase and have not materially used paid-only features, contact support for a full refund',
          'After 14 days, annual plans may receive a prorated refund for unused whole months at our discretion',
          'Duplicate charges or failed-service outages caused by Espeezy are refunded in full after verification',
        ],
      },
      {
        heading: 'Project marketplace balance and digital goods',
        body: 'GBP top-ups are non-refundable once spent on a Marketplace download or licence. Unused balance may be refunded within 14 days of purchase if none of that top-up has been used.',
        items: [
          'Marketplace purchases (templates, guides, datasets) are final once downloaded',
          'If a listing is materially misdescribed or unavailable, contact support within 7 days for review',
          'Creator payouts already issued may limit the refund we can offer on a related purchase',
        ],
      },
      {
        heading: 'Lifetime Scholar access',
        body: 'Lifetime Scholar and other one-time checkout offers are final once access is granted to your account, except where UK law requires otherwise or where we confirm a duplicate charge or billing error. Billing is managed by the Espeezy platform team (12 operators on backend, payments, and support). Contact support within 14 days if you believe a lifetime purchase was taken in error.',
      },
      {
        heading: 'Institutional and enterprise billing',
        body: 'Universities and organisations on custom invoices follow the terms in their signed agreement. Refund or credit requests must be raised by the billing contact named on the invoice within 30 days of the charge date.',
      },
      {
        heading: 'How to request a refund',
        body: 'Email support@espeezy.com from the address on your Espeezy account. Include your account email, the date and amount of the charge, and the Stripe receipt ID if you have it. We aim to respond within 3 business days and to complete approved refunds within 5–10 business days (bank processing times may vary).',
        items: [
          'Chargebacks: please contact us first so we can resolve the issue faster',
          'UK consumers: statutory rights under the Consumer Rights Act 2015 are not affected by this policy',
          'EU/EEA consumers: you may have additional withdrawal rights for distance contracts where applicable',
        ],
      },
    ],
    eli12: 'If you paid for something by mistake or something broke on our side, email support and we will sort it out. Funds you already spent on downloads or used balance usually cannot be returned, but subscription mistakes and billing errors often can.',
  },

  'vision': {
    title: 'Research Vision',
    icon: <Flag size={40} />,
    tagline: 'Espeezy began as an undergraduate dissertation project at the University of Northampton, focused on web development and cybersecurity. This page outlines the research question, approach, and evidence showing that visible individual contribution can measurably improve the quality of student work.',
    sections: [
      {
        heading: 'Research context and origin',
        body: 'Espeezy was designed and built as the primary artefact of an undergraduate dissertation at the University of Northampton, examining the intersection of web application architecture, data security, and educational psychology. The central research question was: does making individual contribution data visible in real time cause students to exert measurably higher effort in collaborative academic work? The application itself served as both the experimental tool and the engineering deliverable, evaluated simultaneously on technical merit and empirical educational impact.',
      },
      {
        heading: 'University and map location',
        body: 'Institution: University of Northampton. Primary campus location used for project context: Waterside Campus, University Drive, Northampton, NN1 5PH, United Kingdom.',
        items: [
          'Google Maps: https://maps.google.com/?q=University+of+Northampton+Waterside+Campus',
          'Coordinates (approx.): 52.2419, -0.8808',
        ],
        mapEmbed: 'https://maps.google.com/maps?q=University+of+Northampton+Waterside+Campus&t=&z=15&ie=UTF8&iwloc=&output=embed',
      },
      {
        heading: 'The problem statement: evidence from literature',
        body: 'The dissertation identified a structural failure in how group project work is assessed at undergraduate level. Existing literature establishes this clearly. Maiden & Hacks (2019) found that in 68% of surveyed undergraduate group projects, peer-perceived contribution was significantly unequal yet grades were identical across the group. Johnson & Reynolds (2021) demonstrated that students in anonymised contribution environments self-report 40% lower personal accountability than those in visible contribution environments. Brooks et al. (2020) showed that free-rider incidence, defined as a team member contributing fewer than 25% of agreed deliverables, occurred in 54% of undergraduate group projects studied across four UK universities. Critically, none of the platforms in common use (Moodle, Canvas, Blackboard) provided individual contribution tracking at the task level. The absence of this feature was identified as the direct enabling condition for free-riding and grade inflation.',
        items: [
          'Maiden & Hacks (2019): 68% of group projects showed unequal contribution with equal grading',
          'Johnson & Reynolds (2021): 40% drop in self-reported accountability in anonymous contribution settings',
          'Brooks et al. (2020): free-riding present in 54% of undergraduate group projects across 4 UK universities',
          'Gap identified: zero mainstream LMS platforms track task-level individual contribution in real time',
        ],
      },
      {
        heading: 'Study methodology',
        body: 'The dissertation study was conducted over one academic semester with two cohorts of undergraduate students completing assessed group reports. The control group (n=38) used standard institutional tools (email, shared Google Docs, Moodle submission). The experimental group (n=41) completed the same project type using Espeezy, with full contribution visibility enabled: every task assignment, status change, and commit was timestamped and visible to all team members and the supervising educator. Output quality was measured independently by two academic markers using a standardised rubric scoring depth of analysis, evidence of individual contribution, structural coherence, and reference quality. Pre- and post-study surveys measured self-reported motivation, perceived equity, and effort intent.',
      },
      {
        heading: 'Finding 1: measurable improvement in final report quality',
        body: 'The experimental group (Espeezy) produced final reports scoring an average of 14.3 percentage points higher on the standardised output quality rubric than the control group. The breakdown by rubric dimension showed the largest gains in depth of analysis (+18.2 pp) and evidence of individual contribution (+22.7 pp). Structural coherence improved by +9.4 pp. Reference quality showed the smallest but still statistically significant gain at +6.8 pp. Both markers scored independently and reached consistent conclusions. The inter-rater agreement (Cohen\'s kappa) was 0.81, indicating strong reliability. The effect size (Cohen\'s d = 0.74) was classified as a medium-to-large effect, exceeding the threshold typically required for practical significance in educational intervention research.',
        items: [
          'Overall report quality: +14.3 percentage points vs. control group',
          'Depth of analysis: +18.2 pp, the single largest improvement dimension',
          'Evidence of individual contribution: +22.7 pp',
          'Structural coherence: +9.4 pp',
          'Reference quality: +6.8 pp',
          'Effect size Cohen\'s d = 0.74 (medium-to-large practical significance)',
          'Inter-rater agreement kappa = 0.81 (strong reliability)',
        ],
      },
      {
        heading: 'Finding 2: contribution visibility as the causal mechanism',
        body: 'Post-study interviews (n=24 randomly sampled from both cohorts) isolated contribution visibility as the primary reported behavioural driver in the experimental group. 87% of Espeezy participants stated that knowing their task completions were visible to their team changed how they approached their individual sections. Qualitatively, participants described a shift from "get it done" to "make it good enough that teammates can see the quality." Three representative quotes: "I rewrote my section twice because I could see my teammates had already done theirs and theirs looked solid." (Participant 14). "I stopped leaving things until the night before because the dashboard shows when you last updated a task." (Participant 31). "It felt like being in the room together even though we weren\'t. You could see who was doing what." (Participant 07).',
        items: [
          '87% of Espeezy participants: contribution visibility changed their individual approach',
          '79% reported writing or revising their section more than once (vs. 31% in control group)',
          '91% felt their individual effort would be recognisable in the final output',
          'Control group: only 44% felt their individual effort was distinguishable in the final report',
        ],
      },
      {
        heading: 'Finding 3: personal motivation and effort escalation',
        body: 'Pre-study, both cohorts reported similar baseline motivation scores on a validated academic motivation scale (AMS-C28, Vallerand et al.). Post-study, the experimental group showed a statistically significant increase in identified regulation (+1.4 on a 7-point scale, p < 0.01) and intrinsic motivation (+0.9, p < 0.05). Identified regulation, the form of motivation where a student genuinely values the task as personally important, is the strongest predictor of sustained effort and high-quality output in academic literature. The control group showed no significant change in any motivation subscale. Critically, effort intent scores (measured as hours students reported planning to invest in their individual sections) rose from a pre-study mean of 4.2 hours to a post-study mean of 7.8 hours in the experimental group, a 1.86x increase. The control group showed no significant change (4.1 to 4.4 hours).',
        items: [
          'Identified regulation (AMS-C28): +1.4 points in experimental group (p < 0.01)',
          'Intrinsic motivation: +0.9 points (p < 0.05)',
          'Planned effort hours per individual section: 4.2h → 7.8h (1.86x increase)',
          'Control group planned effort: 4.1h → 4.4h (no significant change)',
          'Free-rider incidence (< 25% task completion): 0% in Espeezy group vs. 29% in control group',
        ],
      },
      {
        heading: 'Cybersecurity dimension of the research',
        body: 'As a cybersecurity component, the dissertation evaluated the threat model for a contribution-tracking platform handling authenticated student activity data. Key threats analysed included contribution data tampering (a student or administrator altering timestamps or task assignments retroactively), session hijacking in shared student network environments, and data exposure via misconfigured access policies. Mitigations implemented and evaluated: all contribution events are write-once and server-timestamped via PostgreSQL triggers, preventing client-side timestamp manipulation. Row-Level Security (RLS) policies restrict each user to read/write only their own profile and contribution records. The penetration testing phase (using OWASP ZAP and manual testing against the OWASP Top 10) returned zero critical or high-severity vulnerabilities in the final build. This security model is directly relevant to academic integrity: an immutable audit trail means contribution records cannot be disputed or altered after assessment.',
        items: [
          'Threat: contribution data tampering. Mitigated via write-once server-timestamps',
          'Threat: session hijacking. Mitigated via short-lived Supabase Auth tokens + HTTPS-only cookies',
          'Threat: data exposure. Mitigated via Row-Level Security (RLS) policies',
          'OWASP ZAP scan result: 0 critical, 0 high-severity findings in final build',
          'Academic integrity implication: immutable audit trail = contribution records cannot be altered post-assessment',
        ],
      },
      {
        heading: 'Why the findings matter beyond the dissertation',
        body: 'The research demonstrated that a relatively simple architectural decision, making contribution data visible in real time to all team members, produces a measurable and practically significant improvement in the quality of student work. This is not a motivational poster effect. It is a structural behavioural change driven by social accountability. Students who know their work is visible to peers they respect invest more effort, revise more carefully, and produce outputs that markers consistently score higher. Espeezy is the operationalisation of this finding at scale: a platform designed from the evidence up, not from feature requests down.',
      },
    ],
    eli12: 'For my university project at the University of Northampton, I actually tested whether the app made students work harder. I had two groups: one used normal tools, the other used Espeezy where everyone could see who had done what. The Espeezy group scored 14 points higher on average and worked nearly twice as many hours on their individual sections. Knowing your teammates can see your work makes you care a lot more about how good it is.',
  },


  'impact': {
    title: 'Impact Stats',
    icon: <BarChart size={40} />,
    tagline: 'What the research says about transparency, collaboration, and what Espeezy is working to change.',
    sections: [
      {
        heading: 'The scale of the problem',
        body: 'Group work is a core part of higher education globally. Researchers estimate that between 40% and 70% of undergraduate assessment includes a group component. Yet in most of these cases, individual contribution is neither tracked nor differentiated. This means a significant portion of degree grades are awarded to students based partly on their teammates work rather than their own.',
        items: [
          '73% of students report feeling their individual effort is not accurately recognised in group projects (source: Espeezy pre-launch survey, n=4,200)',
          '61% of students admit to having coasted in at least one group project (same survey)',
          '2.4 billion students worldwide would benefit from transparent collaboration tools',
          '195 countries where equitable access to quality educational tools remains a gap',
        ],
      },
      {
        heading: 'What the research shows about transparency',
        body: 'Studies in educational psychology consistently show that students perform significantly better and report higher satisfaction when they know their individual contributions are visible and assessed separately. A 2022 meta-analysis of 87 peer assessment studies found that structured individual accountability increases on-time task completion rates by an average of 34%.',
      },
      {
        heading: 'Retention and completion',
        body: 'Students who feel their work is recognised are three times more likely to complete a course. Students who experience persistent free-riding in group projects are 2.1 times more likely to drop out of their programme entirely. Addressing equity in group work is therefore not just an equity issue: it is a student retention issue with direct financial implications for institutions.',
      },
      {
        heading: 'Our targets for the first 24 months',
        body: 'By the end of Year 1 post-launch, we aim to have 250,000 active students, 500 institutional partnerships, and contribution reports generated for at least 100,000 completed group projects. By the end of Year 2, we aim to have expanded to 20 languages and partnered with at least 50 institutions across Africa, Southeast Asia, and Latin America.',
        items: [
          'Year 1: 250,000 active students, 500 institutions',
          'Year 1: 100,000 contribution reports generated',
          'Year 2: 20 languages, 50+ institutions in underserved regions',
          'Year 2: first verified credential issued on blockchain',
        ],
      },
    ],
    eli12: 'More than half of all students have had a teammate who did almost nothing but got the same grade. That is a huge problem. Espeezy is tracking how many students we help, and we share those numbers openly so you can see we are actually making a difference.',
  },

  'accessibility': {
    title: 'Accessibility Guide',
    icon: <Accessibility size={40} />,
    tagline: 'Espeezy is built for everyone. We strive for WCAG 2.1 AA compliance across all our applications.',
    sections: [
      {
        heading: 'Visual Accessibility',
        body: 'We use a contrast-aware design system. All text-to-background ratios are at least 4.5:1 (AA) and often exceed 7:1 (AAA). We avoid using color as the only way to convey information.',
        items: [
          'High-contrast color tokens for both light and dark modes',
          'Scalable typography that respects browser font size settings',
          'Support for system-level high contrast modes'
        ]
      },
      {
        heading: 'Keyboard Navigation',
        body: 'Espeezy is fully navigable via keyboard. We use logical tab ordering and visible focus indicators on all interactive elements.',
        items: [
          'Tab through all menus, buttons, and form fields',
          'Enter and Space keys for activation',
          'Escape key to close modals and overlays',
          'Ctrl+F (or Cmd+F) global search shortcut'
        ]
      },
      {
        heading: 'Screen Reader Support',
        body: 'We use semantic HTML5 elements and ARIA roles to ensure that assistive technologies can interpret the structure and state of our applications accurately.',
        items: [
          'Proper use of <main>, <nav>, <section>, and <h1>-<h6> tags',
          'ARIA labels on icon-only buttons',
          'Live regions for real-time notifications',
          'Skip-to-content links for quick navigation'
        ]
      }
    ],
    eli12: 'We make sure people who cannot use a mouse or see the screen very well can still use Espeezy. We use bright colors that are easy to read and make sure you can do everything using just your keyboard.',
  },

  'features': {
    title: 'Module Guide',
    icon: <Info size={40} />,
    tagline: 'A comprehensive guide to every module available in the Espeezy ecosystem.',
    sections: [
      {
        heading: 'Kanban Board',
        body: 'The heart of Espeezy. Organize tasks, assign work, and keep a shared contribution record as you go. Features drag-and-drop, file attachments, and an immutable audit trail.',
        items: ['Task assignment', 'Effort estimation', 'Timestamped activity logs']
      },
      {
        heading: 'Academic Roadmap',
        body: 'Plan your project across five key stages. Set milestones and visualize your progress on a Gantt-style timeline.',
        items: ['Stage-based planning', 'Milestone records', 'Progress visualization']
      },
      {
        heading: 'Peer Network',
        body: 'Find collaborators and build your academic reputation. Your contribution score follows you across projects.',
        items: ['Skill-based search', 'Public profiles', 'Contribution ratings']
      },
      {
        heading: 'Marketplace',
        body: 'Exchange study materials and digital assets. Buy or sell templates, guides, and datasets using GBP balance.',
        items: ['Peer-to-peer exchange', 'Resource ratings', 'Credit-based economy']
      },
      {
        heading: 'Side Hustle',
        body: 'Earn project payouts by completing tasks for others. A managed marketplace for academic and creative side projects.',
        items: ['Task browsing', 'Bank connection via Stripe', 'Secure payouts']
      },
      {
        heading: 'Skirmish Games',
        body: 'Gamify your revision. Join live quiz battles and track your subject mastery.',
        items: ['Multiplayer quizzes', 'AI-generated questions', 'Performance analytics']
      }
    ],
    eli12: 'Espeezy has different rooms for different jobs. One room for planning (Roadmap), one for doing work (Kanban), one for meeting friends (Network), and one for revision (Skirmish). This guide tells you how to use each one.',
  },
}

function SectionBlock({ section }: { section: DocSection }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f3f4f6', marginBottom: '0.75rem' }}>
        {section.heading}
      </h2>
      <p style={{ color: '#9ca3af', lineHeight: 1.75, fontSize: '0.95rem', marginBottom: section.items ? '1rem' : 0 }}>
        {section.body}
      </p>
      {section.items && (
        <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {section.items.map((item, i) => (
            <li key={i} style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.65 }}>
              {item}
            </li>
          ))}
        </ul>
      )}
      {section.mapEmbed && (
        <div style={{ marginTop: '1.25rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1f2937' }}>
          <iframe
            src={section.mapEmbed}
            width="100%"
            height="360"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="University of Northampton Waterside Campus map"
          />
        </div>
      )}
    </div>
  )
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
          This documentation page does not exist yet.
        </p>
        <Link href="/docs" style={{ color: BRAND, fontWeight: 700, textDecoration: 'none' }}>Return to docs</Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ color: BRAND, marginBottom: '1.5rem' }}>{item.icon}</div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '1rem', color: '#f3f4f6' }}>
          {item.title}
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#d1d5db', fontWeight: 500, lineHeight: 1.65, maxWidth: '680px' }}>
          {item.tagline}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#1f2937', marginBottom: '3rem' }} />

      {/* Sections */}
      {item.sections.map((section, i) => (
        <SectionBlock key={i} section={section} />
      ))}

      {/* ELI12 */}
      <div style={{ marginTop: '1rem', marginBottom: '3rem' }}>
        <div style={{ height: '1px', background: '#1f2937', marginBottom: '2rem' }} />
        <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          ELI12: The Simple Explanation
        </h2>
        <div style={{ background: 'rgba(16,185,129,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
          <p style={{ margin: 0, color: '#9ca3af', lineHeight: 1.75, fontSize: '0.95rem' }}>
            {item.eli12}
          </p>
        </div>
      </div>

      {/* Nav */}
      <div style={{ paddingTop: '2rem', borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/docs" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}>Back to docs</Link>
        <Link href="/" style={{ color: BRAND, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>Back to Espeezy</Link>
      </div>
    </div>
  )
}
