# FNNL — Resume development handoff

Use this doc when returning to the project after a break. Paste the **“Start here”** block into a new Cursor chat (or `@docs/RESUME_DEVELOPMENT.md`).

Last updated: **2026-03-18**

---

## Start here (copy into Cursor)

```
I'm resuming work on FNNL (funnel-app). Read @docs/RESUME_DEVELOPMENT.md first.

Repo: /Users/anendlesspursuit/Documents/Coding/funnel-app
GitHub: https://github.com/sdalgetty/funnel-app
Production: https://app.fnnlapp.com

Before making changes:
1. Run `git status` and `git log -5` — confirm branch and what's committed.
2. Read `.cursor/rules/deploy-playbook.mdc` for deploy steps (production only).
3. Use `effectiveUserId` from AuthContext for all data reads/writes (guest/admin aware).
4. Prefer extending UnifiedDataService patterns; don't add parallel Supabase access.

I'm content using GitHub as source of truth unless I say otherwise. Help me pick up from the "Current focus" and "Planned direction" sections below.
```

---

## What this product is

**FNNL** is a sales funnel + booking analytics app for creative/service businesses (photographers, etc.). Users track inquiries → calls → bookings, revenue, ad spend, goals, and forecasts. A **Client Journey** Kanban (CRM pilot) was in progress locally.

**Primary app:** `analytics-vite-app/` (React 19 + Vite + TypeScript + Supabase)  
**Secondary:** `crm-vite-app/` (thin shell; real CRM UI lives in analytics for now)

---

## Environments (important)

We run **one live environment** — production only.

| | Production |
|--|--|
| URL | https://app.fnnlapp.com |
| Netlify site | `fnnl-app-prod` |
| Site ID | `8313f660-c306-4d5e-af13-eeeb793bfd87` |
| Git branch (auto-deploy) | `prod` |
| Supabase | Production project only |

**Retired:** Test Netlify + test Supabase (archived). Do not deploy to site `4e44bee4-893e-494e-be35-1a12f341b6c9`.

Deploy docs: `DEPLOYMENT_REFERENCE.md`, `DEPLOY.md`, `.cursor/rules/deploy-playbook.mdc`

---

## Repo map (where to look)

| Area | Path |
|------|------|
| Main UI + routing | `analytics-vite-app/src/App.tsx` (page state, not React Router except `/onboarding`, `/accept-invite`, `/admin`, `/client-journey`) |
| Auth, guest view, admin, CRM flag | `analytics-vite-app/src/contexts/AuthContext.tsx` |
| Data loading hook | `analytics-vite-app/src/hooks/useDataManager.ts` |
| **All CRUD** | `analytics-vite-app/src/services/unifiedDataService.ts` |
| Client Journey Kanban | `analytics-vite-app/src/Projects.tsx`, `services/projectStagesService.ts` |
| DB migrations | `supabase/migrations/` |
| CSV imports (Honeybook/Dubsado) | `services/honeybookImporter.ts`, `dubsadoImporter.ts` |
| Account sharing | `services/shareService.ts` |
| Admin impersonation | `services/adminService.ts` |

**No backend in repo today:** no Supabase Edge Functions, no webhooks. Browser talks to Supabase with anon key + RLS.

---

## Architecture patterns (don't break these)

1. **`effectiveUserId`** — Always use for queries/mutations (supports guest shared accounts and admin impersonation).
2. **`isViewOnly`** — Block writes for guest viewers.
3. **`UnifiedDataService`** — Single façade for bookings, payments, funnels, funnel_events, lead sources, service types, ad campaigns, forecast models.
4. **RLS** — Postgres policies enforce user isolation; migrations must include policies.
5. **Feature gate** — `can_access_crm` on `user_profiles` (migration 042) gates Client Journey nav/page.
6. **Subscription** — App treats all users as Pro; `FeatureGate` is effectively open.

---

## Git branches

| Branch | Typical use |
|--------|-------------|
| `prod` | Production deploys |
| `test` | Integration branch (no live test env) |
| `main` | Exists but **not** used for deploy |

Check remote: `git fetch origin && git branch -vv`

---

## Local setup after clone or long break

```bash
cd "/Users/anendlesspursuit/Documents/Coding/funnel-app"
git checkout test   # or prod — match what you're working on
git pull

cd analytics-vite-app
cp .env.example .env   # if needed; restore secrets from your backup
npm install
npm run dev
```

Required env vars (Netlify + local): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`  
Optional: `VITE_POSTHOG_KEY`

**Secrets are gitignored** — restore `.env` / `.env.local` from your own backup if missing.

---

## Current focus (as of pause — March 2026)

Work may exist **locally beyond GitHub** (user chose not to push before pause). Run `git status` first.

### Client Journey (CRM pilot) — likely local WIP

- Kanban board with 3 sections: Inquiries & Booking, Planning & Preparation, Delivery & Client Care
- Default columns in `project_stages` (migration 043)
- Add/reorder/archive custom columns; `@dnd-kit` drag-drop with optimistic updates
- Nav: "Client Journey" gated by `canAccessCRM`
- Routes: `/client-journey`, `/projects`

**Supabase:** Run migrations 042 + 043 in production SQL Editor if not already applied.

### Recently shipped / stable areas

- Onboarding wizard (service types, lead sources, advertising step)
- Insights, Goals, Funnel, Sales (bookings + payments)
- Account sharing, admin impersonation
- Honeybook/Dubsado CSV import (client-side)

---

## Planned direction (product — not built yet)

User wants to pivot toward:

1. **AI agent as primary UX** — chat-first; dashboards remain as deep-link views
2. **Automation** — Gmail lead parsing, Calendar/Calendly booking detection, Zapier → Honeybook/Dubsado
3. **Architecture needed:** server layer (Edge Functions/workers), webhooks, integration tokens, `activity_log` / proposed actions, agent tool API mirroring `UnifiedDataService`

See prior architecture discussion in Cursor history or ask the agent to re-read requirements from this section.

---

## Deploy (production only)

```bash
cd "/Users/anendlesspursuit/Documents/Coding/funnel-app"
netlify status   # should show fnnl-app-prod when linked
cd analytics-vite-app && npm run build && cd ..
netlify deploy --site=8313f660-c306-4d5e-af13-eeeb793bfd87 --dir=analytics-vite-app/dist --prod
```

Or push to `prod` for Netlify auto-deploy.

---

## What helps the AI work smoothly

When starting a session, provide:

1. **This file** (`@docs/RESUME_DEVELOPMENT.md`)
2. **Your goal** in one sentence (bug, feature, deploy, architecture)
3. **Branch** you're on (`git status -sb`)
4. **Whether** Supabase migrations were applied in prod
5. **Deploy playbook** if deploying: `@.cursor/rules/deploy-playbook.mdc`

Avoid assuming Test env exists. Avoid committing/pushing unless explicitly asked.

---

## Key contacts / access (human checklist)

- [ ] GitHub: `sdalgetty/funnel-app`
- [ ] Netlify: `fnnl-app-prod`
- [ ] Supabase: production project dashboard
- [ ] Local `.env` files backed up separately
- [ ] Netlify CLI logged in (`netlify login`) if deploying from Cursor

---

## Quick troubleshooting

| Issue | Check |
|-------|--------|
| Client Journey missing from nav | `user_profiles.can_access_crm = true` for user |
| Empty Kanban / stages error | Migration 043 applied; `projectStagesService.seedDefaultStages` |
| Guest can't edit | Expected — `isViewOnly` |
| Deploy 401 | `netlify logout && netlify login` |
| EPERM in Cursor deploy | Use local terminal or `scripts/deploy-to-netlify.mjs --prod` with token |
