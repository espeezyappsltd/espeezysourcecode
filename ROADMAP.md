# COMPREHENSIVE PRODUCT ROADMAP
## Espeezy Platform — Full Build-Out Plan
### Two-Party Action Plan: Copilot (AI Engine) + Lead Engineer (Orchestrator)

---

## HOW TO USE THIS DOCUMENT

This roadmap is divided into **sequential phases**. Each phase contains:
- **COPILOT TASKS** — items the AI coding agent executes directly (code generation, architecture, implementation)
- **LEAD ENGINEER TASKS** — items that require human judgment, accounts, credentials, relationships, or decisions

Work happens **in parallel** where possible. The Lead Engineer unblocks dependencies;
Copilot builds continuously.

---

## PHASE 0 — FOUNDATION VERIFICATION (NOW — Week 1)

### COPILOT TASKS
- [x] Build pre-registration landing page (`/preregister`)
- [x] Build donation/funding page (`/fund`) with Stripe checkout
- [x] Build thank-you page (`/fund/thank-you`)
- [x] Build admin Launch Command Center panel
- [x] Build pre-registration API (`/api/preregister`)
- [x] Build donation Stripe API (`/api/stripe/donate`)
- [x] Build admin launch config API (`/api/admin/launch-config`)
- [x] Update Stripe webhook to handle donation sessions
- [x] Database migration `v33_preregistration_and_config.sql`
- [ ] Fix all TypeScript compile errors in new API routes
- [ ] Verify Stripe webhook signature verification is correct
- [ ] Add rate limiting to `/api/preregister` (prevent abuse)
- [ ] Add input sanitisation to all new POST endpoints

### LEAD ENGINEER TASKS
- [ ] Run `supabase/v33_preregistration_and_config.sql` in Supabase SQL Editor
- [ ] Add `IP_HASH_SALT=<random-secret>` to `.env.local` and Vercel environment variables
- [ ] Configure Stripe webhook in Stripe Dashboard to forward `checkout.session.completed`
- [ ] Set Stripe webhook secret in Vercel env as `STRIPE_WEBHOOK_SECRET`
- [ ] Choose final brand name from `BRAND_IDENTITY.md`
- [ ] Register domain for chosen brand name
- [ ] Create Google Workspace account for chosen domain (admin@ / team@ email)

---

## PHASE 1 — LAUNCH MARKETING INFRASTRUCTURE (Weeks 1–3)

### COPILOT TASKS
- [ ] Add email confirmation to pre-registration (send via Resend/SendGrid)
- [ ] Build email template system (`src/emails/`) — welcome, confirmation, countdown
- [ ] Add pre-registration referral tracking (unique shareable URLs)
- [ ] Build referral leaderboard page (`/preregister/leaderboard`)
- [ ] Add social share buttons to post-registration success state
- [ ] Add Open Graph meta tags to `/preregister` page (Twitter card, LinkedIn)
- [ ] Build countdown widget embeddable on external sites (`/embed/countdown`)
- [ ] Add analytics event tracking (Vercel Analytics / PostHog) on all conversion points
- [ ] Build email unsubscribe handler (`/api/preregister/unsubscribe`)
- [ ] SEO: Add `sitemap.xml`, `robots.txt`, structured data for landing page

### LEAD ENGINEER TASKS
- [ ] Create Resend or SendGrid account; add `RESEND_API_KEY` to env
- [ ] Design and approve email templates (brand voice, visual)
- [ ] Set up Google Analytics 4 property; add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to env
- [ ] Create social media accounts (X/Twitter, LinkedIn, Instagram) under brand name
- [ ] Write initial social media content calendar (8 weeks, 3× per week)
- [ ] Set up a newsletter platform (Beehiiv / Substack) for pre-reg nurture sequence
- [ ] Design logo assets (PNG, SVG) based on `BRAND_IDENTITY.md` spec
- [ ] Configure domain DNS, SSL, and Vercel custom domain

---

## PHASE 2 — PRODUCT HARDENING (Weeks 2–5)

### COPILOT TASKS
- [ ] Implement rate limiting middleware (`src/middleware.ts`) for all API routes
- [ ] Add request validation library (zod) to all POST/PUT endpoints
- [ ] Implement CSRF protection on all state-mutating routes
- [ ] Add comprehensive error boundary components
- [ ] Build user onboarding flow (4-step guided setup for new users)
- [ ] Implement end-to-end tests for: pre-registration, donation, auth, group creation
- [ ] Fix all outstanding TypeScript errors (`npx tsc --noEmit`)
- [ ] Add loading skeleton states to all data-fetching components
- [ ] Implement optimistic updates in group task mutations
- [ ] Add PWA manifest and offline support (`sw.js`)
- [ ] Performance audit: Lighthouse ≥90 on all core pages
- [ ] Accessibility audit: WCAG 2.1 AA compliance pass

### LEAD ENGINEER TASKS
- [ ] Commission security penetration test (basic external scan via Detectify or similar)
- [ ] Review and approve user onboarding copy
- [ ] Define KPIs: conversion rate, activation rate, D7 retention targets
- [ ] Set up error monitoring — Sentry account + `SENTRY_DSN` env variable

---

## PHASE 3 — INSTITUTIONAL INTEGRATION BRIDGE (Weeks 4–8)

### COPILOT TASKS
- [ ] Build LTI 1.3 provider endpoint (`/api/lti/`) for Nile LMS
- [ ] Build institutional SSO (SAML 2.0 / OAuth) support
- [ ] Build educator dashboard with class roster management
- [ ] Build contribution report export (PDF, CSV) for educators
- [ ] Build assignment-linked group creation (educator creates, students join via code)
- [ ] Build rubric-aware contribution scoring (educator defines % weights per criterion)
- [ ] Build grade passback to LMS (Nile / Canvas API integration)
- [ ] Build institution admin panel (`/admin/institutions`)
- [ ] Add multi-tenant isolation (data scoped to institution)
- [ ] Build API key system for institution programmatic access

### LEAD ENGINEER TASKS
- [ ] Reach out to 3 pilot institutions (schools/universities) for beta testing
- [ ] Get Nile LMS developer access + LTI sandbox credentials
- [ ] Negotiate pilot agreements (data processing addendum, FERPA/GDPR compliance)
- [ ] Create privacy policy and terms of service (legal review)
- [ ] Create GDPR-compliant data processing agreement template
- [ ] Apply for FERPA compliance documentation

---

## PHASE 4 — AI FEATURES (Weeks 6–12)

### COPILOT TASKS
- [ ] Build AI Study Coach feature (`/app/study-coach`) using OpenAI/Anthropic API
  - Personalized study recommendations based on contribution patterns
  - Smart deadline warnings
  - Group health score and suggestions
- [ ] Build AI Academic Integrity Engine
  - Contribution pattern anomaly detection
  - Flag sudden large single-session contributions
  - Plagiarism signal integration (Turnitin API)
- [ ] Build AI Feedback Generator for educators
  - Auto-draft individual contribution summaries from data
  - Weekly group progress report generation
- [ ] Build AI-powered group matching for new projects
- [ ] Implement AI rate limiting and cost guardrails

### LEAD ENGINEER TASKS
- [ ] Create OpenAI API account; add `OPENAI_API_KEY` to env
- [ ] Define AI feature budget cap (e.g., $500/month maximum Stripe billing alert)
- [ ] Approve AI-generated content policies (what the AI can/cannot say to students)
- [ ] Review Turnitin API pricing; decide on integration depth

---

## PHASE 5 — MOBILE APPLICATIONS (Weeks 8–16)

### COPILOT TASKS
- [ ] Complete React Native mobile app (`mobile-app/`)
  - Fix current `App.js` placeholder to full feature parity with web core
  - Add push notification support (Expo Notifications)
  - Add biometric authentication
  - Add offline task caching
  - Add camera integration for document/evidence upload
- [ ] Build deep linking between web and mobile
- [ ] Build app store metadata (descriptions, screenshots spec)
- [ ] Submit iOS build to TestFlight
- [ ] Submit Android build to Google Play internal testing

### LEAD ENGINEER TASKS
- [ ] Create Apple Developer account ($99/year)
- [ ] Create Google Play Developer account ($25 one-time)
- [ ] Create Expo account for OTA update management
- [ ] Commission app icon design (1024×1024 + all required sizes)
- [ ] Write App Store and Play Store listing copy
- [ ] Record app preview video for store listings

---

## PHASE 6 — CLOUD MIGRATION + INFINITE SCALE (Weeks 10–20)

### COPILOT TASKS
- [ ] Migrate from Vercel hobby to Vercel Pro with edge functions
- [ ] Implement Cloudflare Workers for global edge caching
- [ ] Add Redis (Upstash) for session caching and rate limiting
- [ ] Implement database read replicas via Supabase Pro
- [ ] Add CDN for static assets (Cloudflare R2 or AWS S3 + CloudFront)
- [ ] Implement background job queue (QStash or Inngest) for email, reports, AI tasks
- [ ] Add database connection pooling (Supabase PgBouncer, already available)
- [ ] Implement horizontal scaling test (load test with k6 targeting 10k concurrent)
- [ ] Add distributed tracing (OpenTelemetry + Axiom or Datadog)

### CLOUD ARCHITECTURE TARGET
```
User Request
    ↓
Cloudflare Edge (DDoS protection + WAF + CDN)
    ↓
Vercel Edge Network (global CDN for static)
    ↓
Next.js App Router (serverless functions, auto-scaling)
    ↓
Upstash Redis (session cache, rate limits)
    ↓
Supabase (PostgreSQL + Auth + Storage + Realtime)
    + Read Replicas (EU, US, APAC)
    ↓
Cloudflare R2 (file/asset storage)
Background:
    QStash / Inngest → Email, AI tasks, Report generation
```

### LEAD ENGINEER TASKS
- [ ] Upgrade Vercel to Pro plan (required for custom domains + team features)
- [ ] Create Cloudflare account; add domain to Cloudflare (free plan sufficient for now)
- [ ] Create Upstash account; add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- [ ] Upgrade Supabase to Pro plan (required for read replicas + daily backups)
- [ ] Define backup retention policy (minimum 30 days for GDPR)
- [ ] Set up infrastructure monitoring alerts (Uptime Robot or Better Uptime, free tier)

---

## PHASE 7 — VERSION ROLLOUT SYSTEM (Weeks 12–18)

### COPILOT TASKS
- [ ] Build feature flag system (`src/config/flags.ts`)
  - Flags stored in `app_config` table (already exists)
  - Override per user (beta testers), per institution, globally
- [ ] Build staged rollout infrastructure
  - `rollout_percentage` per flag (0–100)
  - Hash user ID to consistently include/exclude
- [ ] Build in-app changelog display (`/changelog`)
- [ ] Build version announcement modal (shown once per version per user)
- [ ] Build beta programme opt-in (`/settings/beta`)
- [ ] Add `platform_version` banner to admin panel (already has version field)
- [ ] Implement canary deployment support via Vercel Git integration

### LEAD ENGINEER TASKS
- [ ] Define version naming convention (semantic versioning: v1.x.x)
- [ ] Set up GitHub releases with release notes template
- [ ] Define beta tester criteria and recruitment process
- [ ] Create internal changelog management process (who writes, who approves)

---

## PART II: AGENT TEAM SPECIFICATION

### TEAM STRUCTURE — 6 SPECIALISED AGENTS (3 PAIRS)

Each pair has a **primary agent** (builds) and a **review agent** (validates + improves).
Agents operate in the admin panel under `/admin/agents`.

---

#### PAIR 1: FRONTEND AGENTS

**Agent Alpha — UI Architect**
- Specialisation: React/Next.js components, Tailwind/CSS-in-JS, design system compliance
- Primary Responsibilities:
  - New page and component construction
  - Design system token implementation
  - Responsive and mobile layout
  - Accessibility (a11y) compliance
  - Animation and micro-interaction implementation

**Agent Beta — Frontend Validator**
- Specialisation: UI testing, visual regression, UX review
- Primary Responsibilities:
  - Playwright E2E tests for all new UI
  - Lighthouse performance audit
  - Cross-browser testing validation
  - Design-to-implementation accuracy review
  - Accessibility automated testing

---

#### PAIR 2: BACKEND AGENTS

**Agent Gamma — API Engineer**
- Specialisation: Next.js API routes, Supabase queries, business logic
- Primary Responsibilities:
  - API route construction and documentation
  - Database query optimisation
  - RLS policy authoring
  - Migration script generation
  - Webhook handler implementation

**Agent Delta — Backend Validator**
- Specialisation: Security review, load testing, data integrity
- Primary Responsibilities:
  - Security audit of all new API routes (OWASP Top 10)
  - SQL injection and RLS gap detection
  - Rate limiting implementation verification
  - Load test script generation (k6)
  - Data validation completeness review

---

#### PAIR 3: DEVOPS AGENTS

**Agent Epsilon — Infrastructure Engineer**
- Specialisation: CI/CD, environment configuration, deployment automation
- Primary Responsibilities:
  - GitHub Actions workflow construction
  - Vercel deployment configuration
  - Environment variable management
  - Monitoring and alerting setup
  - Database backup and restore procedures

**Agent Zeta — DevOps Validator**
- Specialisation: Infrastructure security, cost optimisation, reliability
- Primary Responsibilities:
  - Secret scanning and credential leak detection
  - Cloud cost analysis and optimisation recommendations
  - Uptime monitoring configuration
  - Disaster recovery procedure documentation
  - Dependency vulnerability scanning

---

## PART III: ADMIN AGENT MANAGEMENT INTERFACE

The admin panel at `/admin` already has the foundation. The agent management section
needs to be built as a new tab/panel:

### FEATURE SPEC: `/admin/agents`

**Copilot must build:**

```
ADMIN AGENT CONTROL CENTRE
├── Active Agents List
│   ├── Agent card: name, specialisation, status (active/paused/training)
│   ├── Task queue (current task, queued tasks)
│   ├── Performance metrics (tasks completed, success rate, last active)
│   └── Controls: Pause, Resume, Reassign, Configure
├── New Agent Registration
│   ├── Name, Specialisation (select from enum), Description
│   ├── Capability tags (multi-select)
│   ├── Prompt configuration (system prompt, constraints)
│   └── Pair assignment (which agent it validates/is validated by)
├── Task Assignment
│   ├── Create new task (title, description, priority, deadline)
│   ├── Assign to agent or pair
│   ├── Dependency mapping (task A must complete before task B)
│   └── Automated trigger (on PR, on deployment, on schedule)
├── Task Monitoring
│   ├── Kanban board (Not Started / In Progress / Review / Done)
│   ├── Live log stream per task
│   ├── Output artifact links (PRs, files changed, test results)
│   └── Escalate to Lead Engineer button
└── Agent Analytics
    ├── Total tasks by agent (weekly/monthly)
    ├── Average completion time
    ├── Validation pass rate
    └── Cost per task (token usage × rate)
```

**Mobile-first design:** The agent panel must be fully operable on mobile
(Lead Engineer manages agents from phone). Use the same dark glassmorphism design system.

**API endpoints needed:**
- `GET /api/admin/agents` — list all agents with current status
- `POST /api/admin/agents` — register new agent
- `PATCH /api/admin/agents/[id]` — update agent status/config
- `GET /api/admin/tasks` — list all tasks
- `POST /api/admin/tasks` — create new task
- `PATCH /api/admin/tasks/[id]` — update task status
- `GET /api/admin/tasks/[id]/logs` — stream task logs (SSE)

**Database tables needed:**
```sql
-- agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialisation TEXT NOT NULL,  -- 'frontend' | 'backend' | 'devops'
  role TEXT NOT NULL,            -- 'builder' | 'validator'
  pair_id UUID REFERENCES agents(id),
  status TEXT DEFAULT 'active',  -- 'active' | 'paused' | 'training'
  system_prompt TEXT,
  capabilities TEXT[],
  tasks_completed INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- agent_tasks table
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',  -- 'low' | 'medium' | 'high' | 'critical'
  status TEXT DEFAULT 'not_started',
  assigned_agent_id UUID REFERENCES agents(id),
  depends_on UUID[],  -- task IDs that must complete first
  output_artifacts JSONB DEFAULT '[]',
  created_by UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## PART IV: OFFICIAL PRODUCT LAUNCH SEQUENCE

### PRE-LAUNCH (T-60 to T-7 days)
- [ ] COPILOT: Final QA pass on all features, zero P0 bugs
- [ ] COPILOT: Performance audit — all core pages ≥90 Lighthouse
- [ ] COPILOT: Security audit — all OWASP Top 10 addressed
- [ ] LEAD: Set launch date in admin Launch Command Center
- [ ] LEAD: Set launch message in admin panel
- [ ] LEAD: Send countdown email to all pre-registrants (via Resend)
- [ ] LEAD: Prepare press release draft
- [ ] LEAD: Create Product Hunt launch listing (draft, embargoed)
- [ ] LEAD: Prepare "Day 1" social media content queue

### LAUNCH DAY (T-0)
- [ ] LEAD: Open registration in admin panel (flip `preregister_open` to `true`)
- [ ] LEAD: Post to Product Hunt at 12:01 AM Pacific
- [ ] LEAD: Post to all social channels
- [ ] LEAD: Send "We're live" email to all pre-registrants
- [ ] COPILOT: Monitor error rates in Sentry (on-call)
- [ ] COPILOT: Scale up Supabase connection pool if needed

### POST-LAUNCH (T+1 to T+30 days)
- [ ] COPILOT: Fix all Day 1 bugs within 24 hours
- [ ] COPILOT: Implement any top-voted feature requests
- [ ] LEAD: Weekly metrics review (DAU, activation rate, conversion to paid)
- [ ] LEAD: Outreach to top 100 pre-registrants for testimonials
- [ ] LEAD: Submit to education technology directories (EdTechHub, etc.)

---

## PART V: REVENUE MILESTONES

| Milestone      | Target                    | Key Action                              |
|----------------|---------------------------|------------------------------------------|
| 0→1            | First paying customer     | Manual sales call to beta institution    |
| $1K MRR        | 4-5 paying teams          | Product Hunt + launch email sequence     |
| $10K MRR       | 40-50 teams OR 1 institution | First enterprise pilot agreement    |
| $100K MRR      | 500+ teams OR 10 institutions | Sales team hire; AE + CSM             |
| $1M ARR        | Series A ready            | Data room, traction metrics, growth rate |

---

## QUICK-REFERENCE: ALL ENVIRONMENT VARIABLES NEEDED

```bash
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=

# New — must add now
IP_HASH_SALT=<random-secret-string-32-chars>

# Phase 1
RESEND_API_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Phase 2
SENTRY_DSN=

# Phase 4
OPENAI_API_KEY=

# Phase 6
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
