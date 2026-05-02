# Standalone Games Refactor Plan (Conflict-Safe)

## Goal
Ship a standalone games product at `/games` and `/games/[slug]`, playable by guests, while preserving current member-linked rewards and payout behavior.

## Current Implementation Analysis
- Existing implementation has auth-first quiz routes under `/api/quiz/**`.
- Session ownership in `quiz_sessions` originally assumed signed-in users (`user_id` required).
- Existing payout/reward logic is coupled to member sessions and profile-linked flows.
- UI currently has no dedicated standalone games route.

## Conflict Hotspots
1. `src/app/api/quiz/**`
- Risk: concurrent edits to auth requirements, scoring, payout rules.
- Refactor strategy: freeze current `/api/quiz/**` as member mode and build `/api/games/**` as standalone facade.

2. `supabase/v38_rewards_and_quiz.sql`
- Risk: developers modifying base table definitions differently.
- Refactor strategy: additive migration only (`v41_games_guest_mode.sql`) for guest compatibility.

3. `src/app/api/stripe/webhook/route.ts`
- Risk: payout and reward merge collisions.
- Refactor strategy: keep webhook as canonical payout processor; games APIs only write session state and queue payout flags.

4. Profile pages under `src/app/u/[username]/**`
- Risk: UI conflicts from independent profile redesigns.
- Refactor strategy: isolate games profile stats to dedicated sub-route `/u/[username]/games`; keep summary card small on main profile.

5. Shared service layer
- Risk: direct fetch usage in components and service signature drift.
- Refactor strategy: route all standalone games calls through `src/services/games.ts`.

## Parallel Workstream Assignment
### Gamma (Backend Builder)
- Maintain `/api/quiz/**` as member route set.
- Expand `/api/games/**` for guest+member facade.
- Add anti-abuse constraints for guest play (rate limits, session TTL, max daily guest sessions per IP).
- Keep payouts member-only.

### Delta (Backend Validator)
- Verify guest token authorization cannot read/answer other sessions.
- Ensure member reward writes require `user_id` and cannot be spoofed.
- Run adversarial tests for replayed answer submissions and prize duplication.

### Alpha (Frontend Builder)
- Build standalone pages only under `/games/**`.
- Keep dashboard quiz UX untouched to avoid cross-team collisions.
- Add profile linkage to `/u/[username]/games`.

### Beta (Frontend Validator)
- E2E guest flow: lobby -> start -> answer -> complete.
- E2E member flow: lobby -> start -> complete -> profile stats visible.
- Validate route alias `/games.categories` redirects to `/games`.

### Epsilon (DevOps Builder)
- Add monitoring for `/api/games/**` and session completion rates.
- Add cron for prize settlement route if needed.

### Zeta (DevOps Validator)
- Validate no secrets leak in public games routes.
- Validate build and route health checks include `/games` and `/games/[slug]`.

## Merge-Conflict Minimization Rules
1. Do not refactor existing `/api/quiz/**` signatures while standalone launch is in progress.
2. New guest behavior must be additive migration only.
3. New frontend routes live in dedicated `/games/**` namespace.
4. Shared webhook changes must be behind narrow helper functions.
5. Profile linkage should be additive and small-surface.

## Rollout Phases
1. Phase 1: DB additive migration + `/api/games/**` guest flow
2. Phase 2: Public `/games` UI + category play UX
3. Phase 3: Profile linkage + summary pages
4. Phase 4: Security hardening + payout automation + observability

## Definition of Done
- Guests can play at `/games` and `/games/[slug]` without login.
- Members can play with profile-linked session records and rewards.
- Member stats visible at `/u/[username]/games`.
- Existing `/api/quiz/**` behavior remains stable.
- Build and security checks pass for standalone routes.
