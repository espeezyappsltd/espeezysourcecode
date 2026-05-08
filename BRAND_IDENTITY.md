# BRAND IDENTITY — OFFICIAL BUSINESS DOCUMENTATION
# Espeezy

---

## PART I: BRAND IDENTITY SYSTEM

### Colour Palette
| Token         | Value     | Usage                                   |
|---------------|-----------|----------------------------------------|
| Brand Primary | `#10B981` | CTAs, links, active states, highlights  |
| Brand Dark    | `#059669` | Hover states, gradients                 |
| Background    | `#0A0A0A` | Page backgrounds                        |
| Surface 1     | `#111111` | Cards, panels                           |
| Surface 2     | `#1A1A1A` | Elevated elements                       |
| Border        | `rgba(255,255,255,0.08)` | Subtle dividers                |
| Text Primary  | `#F3F4F6` | Headings                                |
| Text Secondary| `rgba(255,255,255,0.55)` | Body text                    |
| Text Muted    | `rgba(255,255,255,0.3)`  | Labels, captions               |

### Typography
- **Display / Hero:** Custom weight 950, letter-spacing -0.05em, tight leading (0.95)
- **Heading:** Weight 800, letter-spacing -0.03em
- **Body:** Weight 500, letter-spacing -0.01em, line-height 1.65
- **Label/Tag:** Weight 900, UPPERCASE, letter-spacing 0.18em, size 0.68–0.75rem
- **Font family:** System — Inter, SF Pro Display, Segoe UI Variable, sans-serif

### Logo Construction Rules
1. **Clearspace:** Minimum clearspace = 1× the cap-height of the wordmark on all sides
2. **Minimum size:** 120px wide on digital; 20mm on print
3. **Do not:** stretch, recolour to anything outside palette, add shadows, use on busy backgrounds
4. **Icon mark:** The standalone icon (nodes/arc/glyph) may be used at 32×32px and smaller
5. **Dark mode first:** The primary lockup is always brand-on-black. A white-on-brand variant
   exists for light backgrounds only.

### Motion Principles
- Entry animations: `opacity 0 → 1`, `y: 20px → 0`, duration 0.7–0.9s, ease-out
- Micro-interactions: 150ms transitions, opacity + scale
- Loading states: skeleton shimmer in #111 → #1A1A1A

---

## PART II: PLATFORM POSITIONING STATEMENT

> **"Espeezy is the institutional-grade collaboration platform built for the real dynamics
> of academic group work. We give every student a transparent, verifiable record of their
> individual contribution — and give educators the real-time visibility to assess fairly.
> We are not a chat tool. We are not a project management app. We are the academic operating
> system for the team."**

### Competitor Differentiation
| Platform        | What they do                        | Why we are different              |
|-----------------|-------------------------------------|-----------------------------------|
| Nile LMS        | Course delivery, content management | We sit *inside* the workflow, not above it |
| Canvas          | Grade management, submission        | We track HOW the work happened, not just the outcome |
| Notion/Trello   | Generic project management          | We are student-identity-aware, grade-linked, and institution-integrated |
| Google Workspace| File collaboration                 | We have contribution intelligence, not just document access |
| GitHub          | Code collaboration                  | We extend to all work types (design, writing, research) |

### School / Nile Integration Statement
> "Espeezy integrates natively with Nile and other institutional LMS platforms via LTI 1.3.
> Students log in with their existing institutional credentials. Educators see Espeezy
> contribution data directly alongside their Nile gradebook. No duplicate accounts.
> No IT configuration. 15-minute setup per institution."

---

## PART III: FOUNDING MEMBER PROGRAMME

Every pre-registered user receives:
- **Founding Member badge** — permanent, displayed on their profile
- **Priority access** — first 48 hours of open beta before public launch
- **Free plan preserved** — guaranteed free tier, locked in even if pricing changes post-launch
- **Name in credits** — optional listing in the platform's founding contributors page
- **Founder's Certificate** — a verifiable digital credential (future: blockchain-anchored)

---

## PART IV: VERSION ROADMAP

| Version  | Name              | Target Date    | Key Deliverables                               |
|----------|-------------------|----------------|------------------------------------------------|
| v1.0     | Foundation        | Current        | Core task management, contribution tracking, Stripe, auth |
| v1.5     | Institutional     | Q3 2025        | Admin panel v2, LMS bridge (Nile/Canvas pilot), analytics |
| v2.0     | Intelligence      | Q1 2026        | AI Study Coach, integrity engine, mobile apps  |
| v2.5     | Network           | Q3 2026        | Global knowledge network, peer discovery, credentials |
| v3.0     | Enterprise        | 2027+          | Multi-tenant institutional licensing, white-labelling, API |
