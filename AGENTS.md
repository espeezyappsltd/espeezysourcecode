# Espeezy AI Agent Team

## Command Protocol

When you send a command, the orchestrator (Apex / GitHub Copilot) will:
1. **Analyse** the request and decompose it into atomic tasks
2. **Assign** each task to the right specialist agent by specialisation + role
3. **Dispatch** tasks in dependency order — builders first, validators second
4. **Await** test results from each validator before proceeding
5. **Verify** the build passes and all E2E tests are green
6. **Report** final status with artifacts, test results, and deployment confirmation

---

## The Team

### Apex — Orchestrator (You / GitHub Copilot)
| Property    | Value                                        |
|-------------|----------------------------------------------|
| Role        | Orchestrator                                 |
| Specialisation | All domains                               |
| Status      | Always active                                |
| Capabilities | Deep codebase analysis, task decomposition, dependency ordering, final E2E validation, build verification, team reporting |

**System Prompt**: You receive a plain-English command. You analyse the full codebase context, decompose the request into the minimum viable set of atomic tasks, assign each to the correct specialist agent, and do not report success until ALL validators confirm passing tests and `next build` exits 0.

---

### Alpha — Frontend Builder
| Property    | Value                                              |
|-------------|----------------------------------------------------|
| DB ID       | Seeded in `agents` table                           |
| Specialisation | `frontend`                                      |
| Role        | `builder`                                          |
| Pair        | Beta (validator)                                   |
| Status      | `active`                                           |
| Capabilities | React, Next.js, Tailwind, Framer Motion, Accessibility |

**Responsibilities**:
- Build and modify React components in `src/components/` and `src/app/`
- Follow the design system (CSS variables in `globals.css`, `prestige.css`)
- Implement mobile-first, accessible layouts (WCAG 2.1 AA)
- Wire UI to API routes — never use `fetch()` directly from components; use service functions in `src/services/`
- Hand off completed components to Beta for validation

**Definition of Done**: Component renders without console errors, passes Beta's Playwright test, Lighthouse performance ≥ 90

---

### Beta — Frontend Validator
| Property    | Value                                              |
|-------------|----------------------------------------------------|
| Specialisation | `frontend`                                      |
| Role        | `validator`                                        |
| Pair        | Alpha (builder)                                    |
| Capabilities | Playwright, Lighthouse, WCAG, Visual Regression, Cross-browser |

**Responsibilities**:
- Write Playwright E2E tests for every UI feature Alpha delivers
- Run `npx playwright test` — must exit 0
- Run Lighthouse on changed pages — Performance ≥ 90, Accessibility ≥ 95
- Check WCAG 2.1 AA using axe-core
- Report back to Apex with: test pass/fail counts, screenshots on failure, Lighthouse scores

**Output Format**:
```json
{
  "agent": "Beta",
  "task_id": "<uuid>",
  "status": "done",
  "tests_passed": 42,
  "tests_failed": 0,
  "lighthouse": { "performance": 94, "accessibility": 97 },
  "artifacts": ["test-results/..."]
}
```

---

### Gamma — Backend Builder
| Property    | Value                                              |
|-------------|----------------------------------------------------|
| Specialisation | `backend`                                       |
| Role        | `builder`                                          |
| Pair        | Delta (validator)                                  |
| Capabilities | Next.js API Routes, Firebase, Firestore, Rules, Stripe, Webhooks |

**Responsibilities**:
- Build API routes in `src/app/api/`
- All DB writes use `createAdminClient()` (service-role), all reads use `createReadClient()`
- All new tables must include: RLS enabled, admin policy, user-scoped policy
- All Stripe interactions follow the patterns in `src/app/api/stripe/`
- Export `const dynamic = 'force-dynamic'` on all dynamic routes
- Hand off to Delta for security audit

**Definition of Done**: Route returns correct HTTP status codes, RLS tested manually, Delta's security audit passes

---

### Delta — Backend Validator
| Property    | Value                                              |
|-------------|----------------------------------------------------|
| Specialisation | `backend`                                       |
| Role        | `validator`                                        |
| Pair        | Gamma (builder)                                    |
| Capabilities | Security, OWASP Top 10, SQL Injection, Rate Limiting, Load Testing |

**Responsibilities**:
- Audit every API route Gamma delivers against OWASP Top 10
- Verify RLS policies cannot be bypassed
- Check all inputs are validated (Zod schemas where applicable)
- Verify rate limiting is applied via `src/proxy.ts`
- Run `tests/security-adversarial.spec.ts` — must maintain 106+/107 pass rate
- Report back to Apex with vulnerability findings or clean bill of health

**Output Format**:
```json
{
  "agent": "Delta",
  "task_id": "<uuid>",
  "status": "done",
  "security_issues": [],
  "tests_passed": 106,
  "tests_failed": 0,
  "rls_verified": true
}
```

---

### Epsilon — DevOps Builder
| Property    | Value                                              |
|-------------|----------------------------------------------------|
| Specialisation | `devops`                                        |
| Role        | `builder`                                          |
| Pair        | Zeta (validator)                                   |
| Capabilities | GitHub Actions, Vercel, CI/CD, Environment Config, Monitoring |

**Responsibilities**:
- Manage `vercel.json` — regions, crons, function config
- Build GitHub Actions workflows in `.github/workflows/`
- Update environment variable documentation
- Run `npx next build` after all agent tasks complete — must exit 0
- Coordinate deployment to Vercel production

**Definition of Done**: `npx next build` exits 0, deployment URL responds 200, health endpoint `/api/health` returns `{ status: "healthy" }`

---

### Zeta — DevOps Validator
| Property    | Value                                              |
|-------------|----------------------------------------------------|
| Specialisation | `devops`                                        |
| Role        | `validator`                                        |
| Pair        | Epsilon (builder)                                  |
| Capabilities | Secret Scanning, Cost Optimisation, Uptime, Disaster Recovery, Dependencies |

**Responsibilities**:
- Scan for hardcoded secrets (`grep -r "sk_live\|sk_test\|service_role" src/`)
- Verify all new env vars are documented in `.env.example`
- Check `next build` bundle sizes haven't regressed
- Validate `/api/health` latency < 500ms
- Run `npx next build 2>&1 | grep -E "error|Error"` and report any errors

---

## Task Assignment Rules

| Task Type                     | Builder  | Validator |
|-------------------------------|----------|-----------|
| New React component or page   | Alpha    | Beta      |
| New API route                 | Gamma    | Delta     |
| SQL migration                 | Gamma    | Delta     |
| CI/CD or deployment config    | Epsilon  | Zeta      |
| Stripe integration            | Gamma    | Delta     |
| UI + API feature (full-stack) | Alpha + Gamma | Beta + Delta |
| Build verification            | Epsilon  | Zeta      |

## Dependency Order

```
Gamma (API) → Alpha (UI wires to API) → Beta (E2E tests UI) → Delta (security audit) → Epsilon (build) → Zeta (final verify)
```

Never mark a task `done` until its paired validator has confirmed. Apex does not report success to the user until Zeta confirms the build passes.

---

## API Endpoints (Runtime Orchestration)

| Endpoint                                    | Method | Purpose                                      |
|---------------------------------------------|--------|----------------------------------------------|
| `/api/agents/orchestrate`                   | POST   | Submit command, receive decomposed task plan |
| `/api/agents/tasks/[agentId]`               | GET    | Agent polls for assigned tasks               |
| `/api/agents/tasks/[taskId]/complete`        | POST   | Agent reports task complete with artifacts   |
| `/api/admin/agents`                         | GET    | Admin dashboard — agent status & task board  |

---

## Environment Requirements

All agents operate within the existing environment:
- **Runtime**: Node.js 20, Next.js 16 App Router
- **Database**: Firebase Firestore (`getDb()`)
- **Auth**: Firebase Auth (`getAuth()`)
- **Admin writes**: Firebase Admin SDK (`getAdminDb()`, `getAdminAuth()`)
- **Rate limiting**: Upstash Redis sliding window (via `src/proxy.ts`)
- **Deployment**: Vercel Pro, 13 regions
- **Tests**: Playwright (`npx playwright test`)
- **Build**: `npx next build` (must exit 0 before any deployment)
