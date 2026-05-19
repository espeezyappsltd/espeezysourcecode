import type { MarketplaceListingCategory } from '@/lib/marketplace/listing-validation'

export type TutorialSeed = {
  title: string
  description: string
  category: MarketplaceListingCategory
  filename: string
  content: string
  tags: string[]
}

export const MARKETPLACE_TUTORIAL_SEEDS: TutorialSeed[] = [
  {
    title: 'Kanban Sprint Planning — Quick Start',
    category: 'Tutorials',
    filename: 'espeezy-kanban-sprint-planning.txt',
    tags: ['kanban', 'productivity'],
    description: 'A 5-minute guide to running sprints on Espeezy Kanban with your study group.',
    content: `Espeezy Kanban — Sprint Planning Quick Start
==========================================

1. Create or join a group workspace from Dashboard → Teams.
2. Add columns: Backlog → In Progress → Review → Done.
3. Assign tasks with clear owners and due dates.
4. Use categories (Coding, Research, Design) for filters.
5. Move cards to Done to earn contribution seed points (+15 each).

Tip: Run a 15-minute standup daily and keep WIP limits (max 2 cards per person in progress).`,
  },
  {
    title: 'Marketplace Credits & Withdrawals 101',
    category: 'Tutorials',
    filename: 'marketplace-credits-withdrawals.txt',
    tags: ['marketplace', 'credits'],
    description: 'How listing prices, platform fees, and seller withdrawals work on campus marketplace.',
    content: `Espeezy Marketplace — Credits & Withdrawals
===========================================

• List items in Espeezy credits (max 100 per listing).
• Digital tutorials and links can sell multiple times (set quantity).
• Physical items are one buyer only — campus meetup after purchase.
• Sellers withdraw only from completed sales (credit value × sales count).
• Buyers get invoices by email and in-app notifications.

Fund your account: Account → Credits before buying.`,
  },
  {
    title: 'Personal Arsenal — Organize Study Assets',
    category: 'Tutorials',
    filename: 'personal-arsenal-guide.txt',
    tags: ['arsenal', 'assets'],
    description: 'Folder structure, credit values, and listing arsenal assets on the marketplace.',
    content: `Personal Arsenal Guide
======================

1. Upload PDFs, links, or notes into folders (/assets).
2. Set a credit value (0–100) on each asset for marketplace pricing.
3. Use "List on marketplace" for one-click listing from an asset.
4. Track storage quota by subscription tier.
5. Trading desk shows sales, withdrawals, and PayPal/Stripe payout options.`,
  },
  {
    title: 'Academic Feed — Post Milestones',
    category: 'Tutorials',
    filename: 'academic-feed-milestones.txt',
    tags: ['feed', 'community'],
    description: 'Best practices for public posts, reactions, and managing your feed presence.',
    content: `Academic Journeys Feed
========================

• Post milestones, project updates, and campus tips.
• Use Public visibility for cohort-wide reach.
• Manage posts at /feed/manage (edit, delete).
• React with fire / insightful to boost engagement signals.
• Profile realtime keeps avatar and score in sync across tabs.`,
  },
  {
    title: 'Hustle Board — Post & Complete Gigs',
    category: 'Tutorials',
    filename: 'hustle-board-guide.txt',
    tags: ['hustle', 'gigs'],
    description: 'Posting tasks, escrow credits, and marking work complete on the hustle board.',
    content: `Hustle Board Guide
==================

1. Browse open gigs by category or search.
2. Post a task with payout in credits and optional escrow.
3. Assignees mark complete; poster confirms to release escrow.
4. Connection-only tasks limit visibility to your network.
5. Combine with marketplace sales for a full campus income stack.`,
  },
  {
    title: 'Study Group Security & RLS Basics',
    category: 'Tutorials',
    filename: 'study-group-security.txt',
    tags: ['security', 'teams'],
    description: 'How group boundaries, join requests, and permissions protect your workspace.',
    content: `Study Group Security (Student-Friendly)
========================================

• Each group has isolated tasks, messages, and artifacts.
• Join requests require admin approval.
• Do not share magic invite links publicly.
• Report suspicious accounts via Settings → Support.
• Admins can review activity logs for the group workspace.`,
  },
  {
    title: 'Invoice & Purchase Records',
    category: 'Tutorials',
    filename: 'marketplace-invoices.txt',
    tags: ['marketplace', 'invoices'],
    description: 'Finding invoices after purchase and what sellers see on a sale.',
    content: `Marketplace Invoices
====================

After checkout you receive:
• In-app notification with invoice link
• Email copy (if profile email is set)
• Personal arsenal entry (marketplace_ref or downloadable file)

URL pattern: /marketplace/invoice/{purchaseId}
Keep invoices for dispute resolution and expense tracking.`,
  },
  {
    title: 'Free Starter Pack — Campus Productivity',
    category: 'Tutorials',
    filename: 'campus-productivity-starter.txt',
    tags: ['free', 'starter'],
    description: 'Free checklist: week-one setup for Kanban, marketplace, and feed.',
    content: `Campus Productivity Starter Pack (FREE)
=======================================

□ Join or create a study group
□ Complete onboarding tour
□ Post one Academic Journey milestone
□ Save a marketplace listing to arsenal
□ Claim one free tutorial from Trending → Free picks
□ Fund credits OR earn from a hustle gig

You are ready for demo day. Good luck!`,
  },
]
