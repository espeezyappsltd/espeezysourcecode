# GitHub Copilot — Espeezy Project Instructions

> These instructions apply to every prompt submitted in this workspace.
> Copilot must read and apply all sections before generating any response.

---

## 1. Prompt Refinement Protocol

Before acting on any user request, Copilot **internally** rewrites the prompt using this template:

```
CONTEXT  : What part of the codebase does this touch? (route, component, DB, CI)
GOAL     : What is the user actually trying to achieve?
CONSTRAINTS : What must NOT change? (auth patterns, RLS, build exit 0)
STRATEGY : Ordered steps — API-first, then UI, then tests, then CI
RISKS    : What can break? (slug conflicts, Zod v4 API, Supabase DNS, lockfile version)
```

Apply the refined version silently — do not narrate the rewrite. Only output the implementation.

---

## 2. Stack & Runtime Constraints

| Concern | Rule |
|---|---|
| Runtime | Node.js 24.x / npm 11.x — never downgrade in CI or scripts |
| Framework | Next.js App Router (`src/app/`) — no Pages Router patterns |
| Dynamic routes | Always `export const dynamic = 'force-dynamic'` on server routes |
| Slug naming | Sibling dynamic segments **must** share the same param name (e.g. `[id]`) |
| Zod | v4 API — use `.or()` not `z.union([])`, `z.record(z.string(), z.unknown())`, `.min(0)` not `.nonneg()` |
| Package lock | `lockfileVersion: 3` — never regenerate with npm < 11 |

---

## 3. Supabase Patterns

```ts
// Auth — ALWAYS wrap to prevent DNS-failure 500s
const { data: { user } } = await supabase.auth.getUser()
  .catch(() => ({ data: { user: null } }))
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// Writes — service-role only
const admin = await createAdminClient()

// Reads — replica client
const db = createReadClient()

// Server-side auth context
const supabase = await createServerSupabaseClient()
```

**Never** call `createAdminClient()` from client components.
**Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
All new tables: RLS enabled + admin policy + user-scoped policy.

---

## 4. Security Requirements (OWASP Top 10)

Every API route Copilot writes or modifies must:

1. **Authenticate** — check session or `X-Agent-Key` before any DB operation
2. **Validate input** — Zod schema on all `req.json()` bodies
3. **Sanitise** — never interpolate user input into raw SQL
4. **Rate-limit** — apply via `src/proxy.ts` (Upstash sliding window) on public endpoints
5. **Return correct status codes** — 401 (unauthed), 403 (forbidden), 422 (invalid), 404 (not found), 500 (unexpected)

HTTP security headers are set globally in `next.config.ts` — do not add them per-route.

---

## 5. Feature Request Strategy

When a feature request arrives, decompose it in this order:

```
1. DB schema  →  supabase/v{N}_feature_name.sql  (idempotent, IF NOT EXISTS)
2. API route  →  src/app/api/{resource}/route.ts
3. Service fn →  src/services/{resource}.ts       (never fetch() in components)
4. Component  →  src/components/{Feature}.tsx      (mobile-first, WCAG 2.1 AA)
5. i18n keys  →  messages/en.json (+ all 19 other locales)
6. Tests      →  tests/{feature}.spec.ts           (Playwright)
```

Never skip a step. If a step is not needed, note it and move on.

---

## 6. Implementation Strategy

### API Routes
- File: `src/app/api/{resource}/route.ts`
- Export named HTTP methods: `GET`, `POST`, `PATCH`, `DELETE`
- First line after imports: `export const dynamic = 'force-dynamic'`
- Auth before every handler body
- Zod parse on every request body
- Return `NextResponse.json(data, { status })` — no plain `Response`

### Components
- File: `src/components/{Name}.tsx`
- Use CSS variables from `globals.css` and `prestige.css` — no inline hex colours
- Data fetching via `src/services/` — never `fetch('/api/...')` directly
- Framer Motion for animations — use `useReducedMotion()` guard
- All interactive elements must have accessible labels

### Database Migrations
- File: `supabase/v{N}_{description}.sql`
- Always idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`)
- Include `COMMENT ON TABLE` and `COMMENT ON COLUMN` for every new object
- RLS policy names: `"{table}_admin_all"`, `"{table}_user_own"`

---

## 7. Agent Orchestration (AGENTS.md)

The system uses 6 specialist agents (Alpha–Zeta) plus Apex (orchestrator).

When building agent-related features:
- Agent tasks table: `agent_tasks` — columns: `id, title, description, assigned_agent_id, status, depends_on, output_artifacts, logs, created_at, completed_at`
- Auth: `X-Agent-Key` header matching `process.env.AGENT_API_KEY`
- Routes: `[id]` slug only (no `[agentId]`/`[taskId]` conflict)
- Never mark a task done without the paired validator confirming

---

## 8. Build & CI Rules

```bash
# Local — must exit 0 before any commit
npx next build

# CI — GitHub Actions (.github/workflows/build-check.yml)
# Node: 24.x, npm ci, npx next build
```

If `npx next build` fails:
1. Run `npx tsc --noEmit` first — fix type errors
2. Check for dynamic slug conflicts (`'agentId' !== 'taskId'`)
3. Check for Zod v4 API violations
4. Only then re-run full build

---

## 9. Test Strategy

```bash
# All security tests
npx playwright test tests/security-adversarial.spec.ts --project=security --reporter=list

# Full suite
npx playwright test --reporter=list
```

Target: **106+/107 security tests passing**.

Known acceptable failures (do not attempt to fix these):
- 1 intentional skip (marked `.skip` in spec)
- `/api/health` 500ms SLA — only fails locally when Supabase is unreachable; passes in production

When a test fails:
1. Read the exact assertion message
2. Trace back to the route / component / header
3. Fix the root cause — never mock or skip to make tests pass

---

## 10. Git Workflow

```bash
# Commit format
git commit -m "type(scope): short description

- bullet points for each change
- reference files changed"
```

Types: `feat`, `fix`, `refactor`, `test`, `ci`, `chore`

**Never** force-push to `main`.
**Never** commit secrets, `.env.local`, or `.env`.
`.env.example` must be updated whenever a new env var is added.

---

## 11. Response Format

- **Skip** introductions ("Sure!", "I'll help with...")
- **Skip** post-action summaries unless asked
- Lead with the implementation — code first
- Use file links in markdown: `[src/app/api/feed/route.ts](src/app/api/feed/route.ts)`
- For multi-file changes: show a brief checklist of what changed, not prose
- Build output and test results: show the last 8-12 lines only
